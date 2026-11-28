import { z } from "zod";

export const OBJECTIVES = [
  { value: "first_license", label: "Primeira habilitação" },
  { value: "highway_practice", label: "Prática em rodovia" },
  { value: "resume_driving", label: "Retomada da direção" },
] as const;

export const VEHICLES = [
  { value: "car", label: "Carro" },
  { value: "motorcycle", label: "Moto" },
] as const;

export type Objective = (typeof OBJECTIVES)[number]["value"];
export type VehicleInterest = (typeof VEHICLES)[number]["value"];

export const citySchema = z.object({
  ibge_code: z.number(),
  name: z.string(),
  uf: z.string(),
});
export type City = z.infer<typeof citySchema>;

export type StudentProfileForm = {
  city: City | null;
  vehicle_interest: VehicleInterest | null;
  objectives: Objective[];
};

export const studentProfileSchema = z.object({
  city: citySchema
    .nullable()
    .refine((v) => v !== null, "Selecione sua cidade."),
  vehicle_interest: z
    .enum(["car", "motorcycle"])
    .nullable()
    .refine((v) => v !== null, "Selecione o tipo de veículo."),
  objectives: z
    .array(z.enum(["first_license", "highway_practice", "resume_driving"]))
    .min(1, "Selecione pelo menos um objetivo."),
});