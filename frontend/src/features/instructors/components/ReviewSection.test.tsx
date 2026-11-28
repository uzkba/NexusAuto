// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
    InstrutorPerfil,
    MyReviewStatus,
    ReviewOut,
} from "../types";
import InstructorProfilePage from "../pages/InstructorProfilePage";
import { ReviewSection } from "./ReviewSection";

const INSTRUCTOR_ID = "11111111-1111-4111-8111-111111111111";
const STUDENT_ID = "00000000-0000-0000-0000-000000001000";

const existingReview: ReviewOut = {
    id: 42,
    instructor_id: INSTRUCTOR_ID,
    student_id: STUDENT_ID,
    rating: 4,
    comment: "Excelente didática nas aulas práticas.",
    created_at: "2026-11-20T15:00:00Z",
    updated_at: "2026-11-20T15:00:00Z",
};

const samplePerfil: InstrutorPerfil = {
    id: INSTRUCTOR_ID,
    display_name: "Carlos Mendes",
    photo_url: null,
    bio: "12 anos de experiência.",
    training_structure: "Local próprio.",
    phone: "83999990001",
    cities: [{ ibge_code: 2510808, name: "Patos", uf: "PB" }],
    categories: ["A", "B"],
    terrains: ["rodovia"],
    availability: [{ weekday: 1, periods: ["manha"] }],
    vehicles: [
        {
            type: "carro",
            brand_model: "Onix 1.0",
            year: 2023,
            transmission: "manual",
            dual_control: true,
            category: "B",
        },
    ],
    accreditation: { status: "aprovado", reviewed_at: "2026-11-08T12:00:00Z" },
    reviews: { average: null, count: 0, items: [] },
};

function makeResponse(status: number, body?: unknown) {
    return {
        ok: status >= 200 && status < 300,
        status,
        json: async () => body,
    };
}

function createTestClient() {
    return new QueryClient({
        defaultOptions: {
            queries: { retry: false, retryDelay: 0 },
            mutations: { retry: false },
        },
    });
}

function renderReviewSection(client = createTestClient()) {
    render(
        <QueryClientProvider client={client}>
            <ReviewSection instructorId={INSTRUCTOR_ID} />
        </QueryClientProvider>,
    );
    return client;
}

afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

describe("BL05.1 · ReviewSection", () => {
    it("exibe mensagem neutra quando não autenticado (401)", async () => {
        const fetchMock = vi
            .fn()
            .mockResolvedValue(
                makeResponse(401, { detail: "Autenticação necessária." }),
            );
        vi.stubGlobal("fetch", fetchMock);

        renderReviewSection();

        expect(
            await screen.findByText(
                "Entre como aluno para avaliar este instrutor.",
            ),
        ).toBeTruthy();
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("exibe mensagem neutra para usuário não-aluno (403)", async () => {
        const fetchMock = vi
            .fn()
            .mockResolvedValue(
                makeResponse(403, {
                    detail: "Apenas alunos podem acessar este recurso.",
                }),
            );
        vi.stubGlobal("fetch", fetchMock);

        renderReviewSection();

        expect(
            await screen.findByText("Apenas alunos podem avaliar instrutores."),
        ).toBeTruthy();
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("exibe alerta com botão de tentar novamente em erro de rede/servidor", async () => {
        const statusOk: MyReviewStatus = {
            can_review: false,
            has_contact: false,
            reason: "contact_required",
            review: null,
        };
        let attempts = 0;
        const fetchMock = vi.fn().mockImplementation(async () => {
            attempts += 1;
            if (attempts <= 3) {
                return makeResponse(500, { detail: "Erro interno" });
            }
            return makeResponse(200, statusOk);
        });
        vi.stubGlobal("fetch", fetchMock);

        renderReviewSection();

        expect(
            await screen.findByText("Não foi possível carregar sua avaliação."),
        ).toBeTruthy();

        fireEvent.click(
            screen.getByRole("button", { name: "Tentar novamente" }),
        );

        expect(
            await screen.findByText(
                "Para avaliar este instrutor, primeiro entre em contato com ele pelo WhatsApp.",
            ),
        ).toBeTruthy();
    });

    it("bloqueia o formulário quando o aluno ainda não contatou via WhatsApp (BL09)", async () => {
        const status: MyReviewStatus = {
            can_review: false,
            has_contact: false,
            reason: "contact_required",
            review: null,
        };
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeResponse(200, status)));

        renderReviewSection();

        expect(
            await screen.findByText(
                "Para avaliar este instrutor, primeiro entre em contato com ele pelo WhatsApp.",
            ),
        ).toBeTruthy();
        expect(
            screen.queryByRole("button", { name: "Enviar avaliação" }),
        ).toBeNull();
    });

    it("valida nota obrigatória e limite de 1000 caracteres antes de enviar", async () => {
        const status: MyReviewStatus = {
            can_review: true,
            has_contact: true,
            reason: null,
            review: null,
        };
        const fetchMock = vi
            .fn()
            .mockResolvedValue(makeResponse(200, status));
        vi.stubGlobal("fetch", fetchMock);

        renderReviewSection();

        const submitBtn = await screen.findByRole("button", {
            name: "Enviar avaliação",
        });
        fireEvent.click(submitBtn);

        expect(
            await screen.findByText("Selecione uma nota de 1 a 5 estrelas."),
        ).toBeTruthy();
        expect(fetchMock).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByRole("radio", { name: "5 estrelas" }));
        const textarea = screen.getByLabelText(/Comentário/);
        fireEvent.change(textarea, { target: { value: "a".repeat(1001) } });
        expect(screen.getByText("1001/1000")).toBeTruthy();

        fireEvent.click(submitBtn);
        expect(
            await screen.findByText(
                "O comentário deve ter no máximo 1000 caracteres.",
            ),
        ).toBeTruthy();
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("cria avaliação via POST, normaliza comentário em branco para null e invalida o perfil", async () => {
        const status: MyReviewStatus = {
            can_review: true,
            has_contact: true,
            reason: null,
            review: null,
        };
        const created: ReviewOut = {
            id: 99,
            instructor_id: INSTRUCTOR_ID,
            student_id: STUDENT_ID,
            rating: 5,
            comment: null,
            created_at: "2026-11-27T12:00:00Z",
            updated_at: "2026-11-27T12:00:00Z",
        };
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce(makeResponse(200, status))
            .mockResolvedValueOnce(makeResponse(201, created));
        vi.stubGlobal("fetch", fetchMock);

        const client = createTestClient();
        const invalidateSpy = vi.spyOn(client, "invalidateQueries");
        renderReviewSection(client);

        await screen.findByRole("button", { name: "Enviar avaliação" });
        fireEvent.click(screen.getByRole("radio", { name: "5 estrelas" }));
        fireEvent.change(screen.getByLabelText(/Comentário/), {
            target: { value: "    " },
        });
        fireEvent.click(
            screen.getByRole("button", { name: "Enviar avaliação" }),
        );

        expect(
            await screen.findByText("Avaliação enviada com sucesso!"),
        ).toBeTruthy();
        expect(screen.getByText("5 - Excelente")).toBeTruthy();
        expect(screen.getByText("Sem comentário adicionado.")).toBeTruthy();

        const [, postInit] = fetchMock.mock.calls[1];
        expect(postInit.method).toBe("POST");
        expect(JSON.parse(postInit.body as string)).toEqual({
            rating: 5,
            comment: null,
        });
        expect(invalidateSpy).toHaveBeenCalledWith({
            queryKey: ["instrutor", INSTRUCTOR_ID],
            exact: true,
        });
    });

    it("abre modo de edição preenchido, cancela sem PUT e salva alterações via PUT", async () => {
        const status: MyReviewStatus = {
            can_review: true,
            has_contact: true,
            reason: null,
            review: existingReview,
        };
        const updated: ReviewOut = {
            ...existingReview,
            rating: 5,
            comment: "Atualizado: aprovado de primeira!",
            updated_at: "2026-11-27T18:00:00Z",
        };
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce(makeResponse(200, status))
            .mockResolvedValueOnce(makeResponse(200, updated));
        vi.stubGlobal("fetch", fetchMock);

        const client = createTestClient();
        const invalidateSpy = vi.spyOn(client, "invalidateQueries");
        renderReviewSection(client);

        expect(
            await screen.findByText("Excelente didática nas aulas práticas."),
        ).toBeTruthy();
        expect(screen.getByText("4 - Bom")).toBeTruthy();

        // Abre edição e cancela
        fireEvent.click(
            screen.getByRole("button", { name: "Editar avaliação" }),
        );
        const textarea = screen.getByLabelText(/Comentário/) as HTMLTextAreaElement;
        expect(textarea.value).toBe("Excelente didática nas aulas práticas.");
        expect(
            screen
                .getByRole("radio", { name: "4 estrelas" })
                .getAttribute("aria-checked"),
        ).toBe("true");

        fireEvent.change(textarea, { target: { value: "Rascunho descartado" } });
        fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
        expect(
            screen.getByText("Excelente didática nas aulas práticas."),
        ).toBeTruthy();
        expect(fetchMock).toHaveBeenCalledTimes(1);

        // Abre edição novamente e salva via PUT
        fireEvent.click(
            screen.getByRole("button", { name: "Editar avaliação" }),
        );
        fireEvent.click(screen.getByRole("radio", { name: "5 estrelas" }));
        fireEvent.change(screen.getByLabelText(/Comentário/), {
            target: { value: "  Atualizado: aprovado de primeira!  " },
        });
        fireEvent.click(
            screen.getByRole("button", { name: "Salvar alterações" }),
        );

        expect(
            await screen.findByText("Avaliação atualizada com sucesso!"),
        ).toBeTruthy();
        expect(
            screen.getByText("Atualizado: aprovado de primeira!"),
        ).toBeTruthy();
        expect(screen.getByText("5 - Excelente")).toBeTruthy();

        const [putUrl, putInit] = fetchMock.mock.calls[1];
        expect(String(putUrl)).toContain(
            `/instrutores/${INSTRUCTOR_ID}/avaliacoes/minha`,
        );
        expect(putInit.method).toBe("PUT");
        expect(JSON.parse(putInit.body as string)).toEqual({
            rating: 5,
            comment: "Atualizado: aprovado de primeira!",
        });
        expect(invalidateSpy).toHaveBeenCalledWith({
            queryKey: ["instrutor", INSTRUCTOR_ID],
            exact: true,
        });
    });

    it("trata erros 422, 403 e 409 retornados pelo backend ao enviar", async () => {
        const status: MyReviewStatus = {
            can_review: true,
            has_contact: true,
            reason: null,
            review: null,
        };
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce(makeResponse(200, status))
            .mockResolvedValueOnce(
                makeResponse(422, {
                    errors: [
                        {
                            field: "comment",
                            message: "Comentário rejeitado pelo servidor.",
                        },
                    ],
                }),
            )
            .mockResolvedValueOnce(
                makeResponse(403, {
                    detail: "Você precisa entrar em contato com o instrutor via WhatsApp antes de avaliá-lo.",
                }),
            )
            .mockResolvedValueOnce(
                makeResponse(409, {
                    detail: "Você já avaliou este instrutor. Use a opção de editar avaliação.",
                }),
            );
        vi.stubGlobal("fetch", fetchMock);

        renderReviewSection();

        const submitBtn = await screen.findByRole("button", {
            name: "Enviar avaliação",
        });
        fireEvent.click(screen.getByRole("radio", { name: "4 estrelas" }));
        fireEvent.change(screen.getByLabelText(/Comentário/), {
            target: { value: "Teste" },
        });

        // 422
        fireEvent.click(submitBtn);
        expect(
            await screen.findByText("Comentário rejeitado pelo servidor."),
        ).toBeTruthy();

        // 403
        fireEvent.change(screen.getByLabelText(/Comentário/), {
            target: { value: "Teste 2" },
        });
        fireEvent.click(submitBtn);
        expect(
            await screen.findByText(
                "Você precisa entrar em contato com o instrutor via WhatsApp antes de avaliá-lo.",
            ),
        ).toBeTruthy();

        // 409
        fireEvent.click(submitBtn);
        expect(
            await screen.findByText(
                "Você já avaliou este instrutor. Use a opção de editar avaliação.",
            ),
        ).toBeTruthy();
    });

    it("integra com InstrutorPerfilPage e atualiza o RatingSummary após enviar avaliação", async () => {
        let created = false;
        const fetchMock = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
            if (url.endsWith(`/instrutores/${INSTRUCTOR_ID}/avaliacoes/minha`)) {
                return makeResponse(200, {
                    can_review: true,
                    has_contact: true,
                    reason: null,
                    review: null,
                } satisfies MyReviewStatus);
            }
            if (
                url.endsWith(`/instrutores/${INSTRUCTOR_ID}/avaliacoes`) &&
                init?.method === "POST"
            ) {
                created = true;
                return makeResponse(201, {
                    id: 1,
                    instructor_id: INSTRUCTOR_ID,
                    student_id: STUDENT_ID,
                    rating: 5,
                    comment: "Top!",
                    created_at: "2026-11-27T12:00:00Z",
                    updated_at: "2026-11-27T12:00:00Z",
                } satisfies ReviewOut);
            }
            if (url.endsWith(`/instrutores/${INSTRUCTOR_ID}`)) {
                return makeResponse(
                    200,
                    created
                        ? {
                              ...samplePerfil,
                              reviews: { average: 5.0, count: 1, items: [] },
                          }
                        : samplePerfil,
                );
            }
            return makeResponse(404);
        });
        vi.stubGlobal("fetch", fetchMock);

        const client = createTestClient();
        render(
            <QueryClientProvider client={client}>
                <MemoryRouter initialEntries={[`/instrutores/${INSTRUCTOR_ID}`]}>
                    <Routes>
                        <Route
                            path="/instrutores/:id"
                            element={<InstructorProfilePage />}
                        />
                    </Routes>
                </MemoryRouter>
            </QueryClientProvider>,
        );

        expect(await screen.findByText("Avaliar instrutor")).toBeTruthy();
        expect(screen.getByText("Sem avaliações ainda")).toBeTruthy();

        fireEvent.click(await screen.findByRole("radio", { name: "5 estrelas" }));
        fireEvent.change(screen.getByLabelText(/Comentário/), {
            target: { value: "Top!" },
        });
        fireEvent.click(
            screen.getByRole("button", { name: "Enviar avaliação" }),
        );

        expect(
            await screen.findByText("Avaliação enviada com sucesso!"),
        ).toBeTruthy();
        await waitFor(() => {
            expect(screen.getByText("5,0")).toBeTruthy();
            expect(screen.getByText(/1 avaliação/)).toBeTruthy();
        });
    });

    it("reseta feedback, modo de edição e rascunho ao trocar de instrutor", async () => {
        const OTHER_INSTRUCTOR_ID = "22222222-2222-4222-8222-222222222222";
        const THIRD_INSTRUCTOR_ID = "33333333-3333-4333-8333-333333333333";

        const reviewA: ReviewOut = {
            id: 101,
            instructor_id: INSTRUCTOR_ID,
            student_id: STUDENT_ID,
            rating: 5,
            comment: "Instrutor A excelente.",
            created_at: "2026-11-27T12:00:00Z",
            updated_at: "2026-11-27T12:00:00Z",
        };
        const reviewB: ReviewOut = {
            id: 202,
            instructor_id: OTHER_INSTRUCTOR_ID,
            student_id: STUDENT_ID,
            rating: 3,
            comment: "Instrutor B regular.",
            created_at: "2026-11-21T12:00:00Z",
            updated_at: "2026-11-21T12:00:00Z",
        };

        const fetchMock = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
            if (
                url.endsWith(`/instrutores/${INSTRUCTOR_ID}/avaliacoes`) &&
                init?.method === "POST"
            ) {
                return makeResponse(201, reviewA);
            }
            if (url.endsWith(`/instrutores/${INSTRUCTOR_ID}/avaliacoes/minha`)) {
                return makeResponse(200, {
                    can_review: true,
                    has_contact: true,
                    reason: null,
                    review: null,
                } satisfies MyReviewStatus);
            }
            if (url.endsWith(`/instrutores/${OTHER_INSTRUCTOR_ID}/avaliacoes/minha`)) {
                return makeResponse(200, {
                    can_review: true,
                    has_contact: true,
                    reason: null,
                    review: reviewB,
                } satisfies MyReviewStatus);
            }
            if (url.endsWith(`/instrutores/${THIRD_INSTRUCTOR_ID}/avaliacoes/minha`)) {
                return makeResponse(200, {
                    can_review: true,
                    has_contact: true,
                    reason: null,
                    review: null,
                } satisfies MyReviewStatus);
            }
            return makeResponse(404);
        });
        vi.stubGlobal("fetch", fetchMock);

        const client = createTestClient();
        const { rerender } = render(
            <QueryClientProvider client={client}>
                <ReviewSection instructorId={INSTRUCTOR_ID} />
            </QueryClientProvider>,
        );

        // 1. Cria avaliação no instrutor A -> mostra banner de feedback
        await screen.findByRole("button", { name: "Enviar avaliação" });
        fireEvent.click(screen.getByRole("radio", { name: "5 estrelas" }));
        fireEvent.change(screen.getByLabelText(/Comentário/), {
            target: { value: "Instrutor A excelente." },
        });
        fireEvent.click(screen.getByRole("button", { name: "Enviar avaliação" }));
        expect(
            await screen.findByText("Avaliação enviada com sucesso!"),
        ).toBeTruthy();

        // 2. Troca para instrutor B -> feedback limpa e abre em visualização (não em edição)
        rerender(
            <QueryClientProvider client={client}>
                <ReviewSection instructorId={OTHER_INSTRUCTOR_ID} />
            </QueryClientProvider>,
        );
        expect(await screen.findByText("Instrutor B regular.")).toBeTruthy();
        expect(screen.queryByText("Avaliação enviada com sucesso!")).toBeNull();

        // Entra no modo de edição no instrutor B e digita rascunho
        fireEvent.click(screen.getByRole("button", { name: "Editar avaliação" }));
        fireEvent.change(screen.getByLabelText(/Comentário/), {
            target: { value: "Rascunho não salvo de B" },
        });

        // 3. Troca para instrutor C (sem avaliação) -> modo de edição e rascunho resetam
        rerender(
            <QueryClientProvider client={client}>
                <ReviewSection instructorId={THIRD_INSTRUCTOR_ID} />
            </QueryClientProvider>,
        );
        expect(
            await screen.findByRole("button", { name: "Enviar avaliação" }),
        ).toBeTruthy();
        expect(
            (screen.getByLabelText(/Comentário/) as HTMLTextAreaElement).value,
        ).toBe("");
        expect(screen.getByText("Selecione uma nota")).toBeTruthy();
    });
});
