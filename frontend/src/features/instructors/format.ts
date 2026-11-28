export const TERRAIN_LABEL: Record<string, string> = {
    urbano: "Área urbana",
    rodovia: "Rodovia",
    estrada_terra: "Estrada de terra",
};

export const PERIOD_LABEL: Record<string, string> = {
    manha: "manhã",
    tarde: "tarde",
    noite: "noite",
};

export const WEEKDAYS = [
    { short: "S", abbr: "Seg", name: "Segunda" },
    { short: "T", abbr: "Ter", name: "Terça" },
    { short: "Q", abbr: "Qua", name: "Quarta" },
    { short: "Q", abbr: "Qui", name: "Quinta" },
    { short: "S", abbr: "Sex", name: "Sexta" },
    { short: "S", abbr: "Sáb", name: "Sábado" },
    { short: "D", abbr: "Dom", name: "Domingo" },
];

const listFormat = new Intl.ListFormat("pt-BR", {
    style: "long",
    type: "conjunction",
});

export const joinPeriods = (periods: string[]) =>
    listFormat.format(periods.map((p) => PERIOD_LABEL[p] ?? p));

export const formatRating = (n: number) =>
    n.toLocaleString("pt-BR", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
    });

export const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("pt-BR");

export function formatPhone(raw: string): string {
    const d = raw.replace(/\D/g, "");
    if (d.length === 11)
        return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    if (d.length === 10)
        return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return raw;
}

export function initials(name: string): string {
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? "";
    const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
    return (first + last).toUpperCase();
}
