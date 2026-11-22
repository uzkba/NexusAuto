export const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
    status: number;

    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}

export async function apiGet<T>(
    path: string,
    signal?: AbortSignal,
): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
        signal,
        headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new ApiError(res.status, `Erro ${res.status}`);
    return (await res.json()) as T;
}