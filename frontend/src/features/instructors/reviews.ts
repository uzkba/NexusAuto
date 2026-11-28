import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, BASE_URL } from "../../lib/api";
import type { MyReviewStatus, ReviewOut, ReviewPayload } from "./types";

export class ApiValidationError extends Error {
    fields: Record<string, string>;

    constructor(fields: Record<string, string>, message = "Dados inválidos.") {
        super(message);
        this.fields = fields;
    }
}

export const minhaAvaliacaoQueryKey = (instructorId: string) =>
    ["instrutor", instructorId, "minha-avaliacao"] as const;

interface ErrorPayload {
    detail?: unknown;
    errors?: { field?: unknown; message?: unknown }[];
}

async function parseErrorResponse(res: Response): Promise<Error> {
    const body = (await res.json().catch(() => null)) as ErrorPayload | null;

    if (res.status === 422 && Array.isArray(body?.errors) && body.errors.length > 0) {
        const fields: Record<string, string> = {};
        let firstMessage = "Dados inválidos.";
        for (const err of body.errors) {
            if (typeof err?.field === "string" && typeof err?.message === "string") {
                if (!(err.field in fields)) {
                    fields[err.field] = err.message;
                }
                if (firstMessage === "Dados inválidos.") {
                    firstMessage = err.message;
                }
            }
        }
        if (Object.keys(fields).length > 0) {
            return new ApiValidationError(fields, firstMessage);
        }
    }

    const detail =
        typeof body?.detail === "string" && body.detail.trim().length > 0
            ? body.detail
            : `Erro ${res.status}`;

    return new ApiError(res.status, detail);
}

export async function getMinhaAvaliacao(
    instructorId: string,
    signal?: AbortSignal,
): Promise<MyReviewStatus | null> {
    const res = await fetch(
        `${BASE_URL}/instrutores/${instructorId}/avaliacoes/minha`,
        {
            signal,
            headers: { Accept: "application/json" },
        },
    );
    if (!res.ok) throw await parseErrorResponse(res);

    const data = (await res.json()) as Partial<MyReviewStatus> | null;
    if (typeof data?.can_review !== "boolean") {
        return null;
    }
    return data as MyReviewStatus;
}

export async function createAvaliacao(
    instructorId: string,
    payload: ReviewPayload,
): Promise<ReviewOut> {
    const res = await fetch(
        `${BASE_URL}/instrutores/${instructorId}/avaliacoes`,
        {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        },
    );
    if (!res.ok) throw await parseErrorResponse(res);
    return (await res.json()) as ReviewOut;
}

export async function updateAvaliacao(
    instructorId: string,
    payload: ReviewPayload,
): Promise<ReviewOut> {
    const res = await fetch(
        `${BASE_URL}/instrutores/${instructorId}/avaliacoes/minha`,
        {
            method: "PUT",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        },
    );
    if (!res.ok) throw await parseErrorResponse(res);
    return (await res.json()) as ReviewOut;
}

function isTerminalStatus(error: unknown): boolean {
    return (
        error instanceof ApiError &&
        (error.status === 401 || error.status === 403 || error.status === 404)
    );
}

export function useMinhaAvaliacao(instructorId: string, enabled = true) {
    return useQuery({
        queryKey: minhaAvaliacaoQueryKey(instructorId),
        queryFn: ({ signal }) => getMinhaAvaliacao(instructorId, signal),
        enabled: enabled && Boolean(instructorId),
        retry: (count, error) => !isTerminalStatus(error) && count < 2,
    });
}

export function useCreateAvaliacao(instructorId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: ReviewPayload) =>
            createAvaliacao(instructorId, payload),
        onSuccess: (saved) => {
            queryClient.setQueryData<MyReviewStatus>(
                minhaAvaliacaoQueryKey(instructorId),
                {
                    can_review: true,
                    has_contact: true,
                    reason: null,
                    review: saved,
                },
            );
            void queryClient.invalidateQueries({
                queryKey: ["instrutor", instructorId],
                exact: true,
            });
        },
    });
}

export function useUpdateAvaliacao(instructorId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: ReviewPayload) =>
            updateAvaliacao(instructorId, payload),
        onSuccess: (saved) => {
            queryClient.setQueryData<MyReviewStatus>(
                minhaAvaliacaoQueryKey(instructorId),
                {
                    can_review: true,
                    has_contact: true,
                    reason: null,
                    review: saved,
                },
            );
            void queryClient.invalidateQueries({
                queryKey: ["instrutor", instructorId],
                exact: true,
            });
        },
    });
}
