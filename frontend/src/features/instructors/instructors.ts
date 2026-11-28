import { useQuery } from "@tanstack/react-query";

import type { InstrutorPerfil } from "./types";
import { ApiError, apiGet } from "../../lib/api";

export function isNotFound(error: unknown): boolean {
    return (
        error instanceof ApiError &&
        (error.status === 404 || error.status === 422)
    );
}

export function useInstrutorPerfil(id: string) {
    return useQuery({
        queryKey: ["instrutor", id],
        queryFn: ({ signal }) =>
            apiGet<InstrutorPerfil>(`/instrutores/${id}`, signal),
        retry: (count, error) => !isNotFound(error) && count < 2,
    });
}
