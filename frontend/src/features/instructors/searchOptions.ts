import type { City } from "./types";

export type Filters = {
    city: City | null;
    uf: string;
    categories: string[];
    vehicle: string;
    terrains: string[];
    weekdays: string[];
    periods: string[];
};

export const EMPTY_FILTERS: Filters = {
    city: null,
    uf: "",
    categories: [],
    vehicle: "",
    terrains: [],
    weekdays: [],
    periods: [],
};

type Option = { value: string; label: string };

export const CATEGORIES = ["A", "B"];

export const VEHICLES: Option[] = [
    { value: "moto", label: "Moto" },
    { value: "carro_manual", label: "Carro manual" },
    { value: "carro_automatico", label: "Carro automático" },
    { value: "duplo_comando", label: "Duplo comando" },
];

export const DAYS = [
    { value: "0", short: "S", label: "Segunda" },
    { value: "1", short: "T", label: "Terça" },
    { value: "2", short: "Q", label: "Quarta" },
    { value: "3", short: "Q", label: "Quinta" },
    { value: "4", short: "S", label: "Sexta" },
    { value: "5", short: "S", label: "Sábado" },
    { value: "6", short: "D", label: "Domingo" },
];

export const PERIODS: Option[] = [
    { value: "manha", label: "Manhã" },
    { value: "tarde", label: "Tarde" },
    { value: "noite", label: "Noite" },
];

// o catálogo devolve o código do terreno; aqui vira o rótulo do protótipo
const TERRAIN_LABELS: Record<string, string> = {
    urbano: "Área urbana",
    rodovia: "Rodovia",
    estrada_terra: "Estrada de terra",
};
export const terrainLabel = (code: string) => TERRAIN_LABELS[code] ?? code;

export const toggle = (list: string[], value: string) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

function applyVehicle(params: URLSearchParams, vehicle: string) {
    if (vehicle === "moto") {
        params.set("vehicle_type", "moto");
    } else if (vehicle === "carro_manual") {
        params.set("vehicle_type", "carro");
        params.set("transmission", "manual");
    } else if (vehicle === "carro_automatico") {
        params.set("vehicle_type", "carro");
        params.set("transmission", "automatico");
    } else if (vehicle === "duplo_comando") {
        params.set("dual_control", "true");
    }
}

export function toParams(f: Filters, page: number): URLSearchParams {
    const params = new URLSearchParams({ page: String(page) });
    if (f.city) params.set("city_ibge", String(f.city.ibge_code));
    if (f.uf) params.set("uf", f.uf);
    f.categories.forEach((c) => params.append("category", c));
    applyVehicle(params, f.vehicle);
    f.terrains.forEach((t) => params.append("terrain_id", t));
    f.weekdays.forEach((d) => params.append("weekday", d));
    f.periods.forEach((p) => params.append("period", p));
    return params;
}

export function activeFilterCount(f: Filters): number {
    return (
        f.categories.length +
        (f.vehicle ? 1 : 0) +
        f.terrains.length +
        f.weekdays.length +
        f.periods.length
    );
}

export type FilterChip = { key: string; label: string; patch: Partial<Filters> };

export function buildChips(f: Filters, terrainName: (id: string) => string): FilterChip[] {
    const chips: FilterChip[] = [];
    f.categories.forEach((c) =>
        chips.push({
            key: `category-${c}`,
            label: `Categoria ${c}`,
            patch: { categories: f.categories.filter((x) => x !== c) },
        }),
    );
    if (f.vehicle) {
        const label = VEHICLES.find((v) => v.value === f.vehicle)?.label ?? f.vehicle;
        chips.push({ key: "vehicle", label, patch: { vehicle: "" } });
    }
    f.terrains.forEach((id) =>
        chips.push({
            key: `terrain-${id}`,
            label: terrainName(id),
            patch: { terrains: f.terrains.filter((x) => x !== id) },
        }),
    );
    f.weekdays.forEach((d) =>
        chips.push({
            key: `day-${d}`,
            label: DAYS.find((x) => x.value === d)?.label ?? d,
            patch: { weekdays: f.weekdays.filter((x) => x !== d) },
        }),
    );
    f.periods.forEach((p) =>
        chips.push({
            key: `period-${p}`,
            label: PERIODS.find((x) => x.value === p)?.label ?? p,
            patch: { periods: f.periods.filter((x) => x !== p) },
        }),
    );
    return chips;
}