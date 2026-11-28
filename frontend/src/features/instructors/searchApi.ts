import { apiGet } from "../../lib/api";
import type { InstructorSearchResult, Terrain } from "./types";

export function searchInstructors(params: URLSearchParams, signal?: AbortSignal) {
    return apiGet<InstructorSearchResult>(`/instrutores?${params.toString()}`, signal);
}

export function listTerrains(signal?: AbortSignal) {
    return apiGet<Terrain[]>("/catalogo/terrenos", signal);
}