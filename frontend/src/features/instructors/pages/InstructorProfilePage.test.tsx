import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { InstrutorPerfil } from "../types";
import InstructorProfilePage from "./InstructorProfilePage";

const perfil: InstrutorPerfil = {
    id: "11111111-1111-4111-8111-111111111111",
    display_name: "Carlos Mendes",
    photo_url: null,
    bio: "12 anos de experiência.",
    training_structure: "Local próprio.",
    phone: "83999990001",
    cities: [{ ibge_code: 2510808, name: "Patos", uf: "PB" }],
    categories: ["A", "B"],
    terrains: ["rodovia", "estrada_terra"],
    availability: [{ weekday: 1, periods: ["manha", "tarde"] }],
    vehicles: [
        {
            type: "moto",
            brand_model: "Moto 160cc",
            year: 2022,
            transmission: "manual",
            dual_control: false,
            category: "A",
        },
    ],
    accreditation: { status: "aprovado", reviewed_at: "2026-11-08T12:00:00Z" },
    reviews: { average: 4.9, count: 23, items: [] },
};

function mockFetch(status: number, body?: unknown) {
    vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
            ok: status >= 200 && status < 300,
            status,
            json: async () => body,
        }),
    );
}

function renderPage() {
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    render(
        <QueryClientProvider client={client}>
            <MemoryRouter initialEntries={["/instrutores/abc"]}>
                <Routes>
                    <Route
                        path="/instrutores/:id"
                        element={<InstructorProfilePage />}
                    />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>,
    );
}

afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
});

describe("BL01 · perfil público do instrutor", () => {
    it("exibe dados, selo de credenciamento verificado, média e telefone", async () => {
        mockFetch(200, perfil);
        renderPage();
        expect(await screen.findByText("Carlos Mendes")).toBeTruthy();
        expect(
            screen.getByText("Credenciamento verificado pela plataforma"),
        ).toBeTruthy();
        expect(screen.getByText(/analisado pela equipe NEXUS AUTO/)).toBeTruthy();
        expect(screen.getByText(/23 avaliações/)).toBeTruthy();
        expect(screen.getByText("4,9")).toBeTruthy();
        expect(screen.getByText("Categoria B")).toBeTruthy();
        expect(screen.getByText("Disponibilidade informada")).toBeTruthy();
        expect(screen.getByText("(83) 99999-0001")).toBeTruthy();
    });

    it("pede login quando o telefone vem nulo", async () => {
        mockFetch(200, { ...perfil, phone: null });
        renderPage();
        expect(
            await screen.findByText("Entre para ver o contato"),
        ).toBeTruthy();
    });

    it("não mostra selo de credenciamento para pendente", async () => {
        mockFetch(200, {
            ...perfil,
            accreditation: { status: "pendente", reviewed_at: null },
            reviews: { average: null, count: 0, items: [] },
        });
        renderPage();

        // espera a página carregar: sem isso, a ausência do selo passaria por engano
        expect(await screen.findByText("Carlos Mendes")).toBeTruthy();

        expect(
            screen.queryByText("Credenciamento verificado pela plataforma"),
        ).toBeNull();
        expect(screen.queryByText("Credenciamento em análise")).toBeNull();
    });

    it("mostra estado de não encontrado no 404", async () => {
        mockFetch(404);
        renderPage();
        expect(
            await screen.findByText("Instrutor não encontrado"),
        ).toBeTruthy();
    });
});