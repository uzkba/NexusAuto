import { ApiError, BASE_URL, apiGet } from "../../lib/api";
import type { City, Objective, VehicleInterest } from "./schema";

export type StudentProfile = {
  city: City | null;
  vehicle_interest: VehicleInterest | null;
  objectives: Objective[];
};

export type StudentProfilePayload = {
  city: City;
  vehicle_interest: VehicleInterest;
  objectives: Objective[];
};

export class ApiValidationError extends Error {
  fields: Record<string, string>;

  constructor(fields: Record<string, string>) {
    super("Dados inválidos.");
    this.fields = fields;
  }
}

export function getStudentProfile(signal?: AbortSignal) {
  return apiGet<StudentProfile>("/students/me/profile", signal);
}

export function searchCities(q: string, signal?: AbortSignal) {
  return apiGet<City[]>(`/catalogo/cidades?q=${encodeURIComponent(q)}`, signal);
}

export async function saveStudentProfile(
  values: StudentProfilePayload,
): Promise<StudentProfile> {
  const res = await fetch(`${BASE_URL}/students/me/profile`, {
    method: "PUT",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      city_ibge: values.city.ibge_code,
      vehicle_interest: values.vehicle_interest,
      objectives: values.objectives,
    }),
  });

  if (res.status === 422) {
    const body = (await res.json().catch(() => null)) as {
      errors?: { field: string; message: string }[];
    } | null;
    const fields: Record<string, string> = {};
    for (const err of body?.errors ?? []) {
      // o backend chama de city_ibge; o formulário guarda em "city"
      fields[err.field === "city_ibge" ? "city" : err.field] = err.message;
    }
    throw new ApiValidationError(fields);
  }
  if (!res.ok) throw new ApiError(res.status, `Erro ${res.status}`);
  return (await res.json()) as StudentProfile;
}