import { Link } from "react-router-dom";
import type { InstructorCard } from "../types";

const VEHICLE_LABEL: Record<string, string> = { moto: "Moto", carro: "Carro" };

function initials(name: string) {
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? "";
    const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return (first + last).toUpperCase();
}

export function InstructorResultCard({ instructor: i }: { instructor: InstructorCard }) {
    const shown = i.cities.slice(0, 2).map((c) => c.name).join(", ");
    const extra = i.cities.length - 2;
    const uf = i.cities[0]?.uf;

    return (
        <li>
            <Link
                to={`/instrutores/${i.id}`}
                className="group flex gap-4 rounded-[28px] border border-line bg-white p-4 shadow-sm transition motion-reduce:transition-none hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink sm:p-5"
            >
                <div className="relative shrink-0 self-start">
                    {i.photo_url ? (
                        <img
                            src={i.photo_url}
                            alt=""
                            className="size-16 rounded-[18px] object-cover ring-1 ring-black/10 sm:size-18 sm:rounded-[22px]"
                        />
                    ) : (
                        <span
                            aria-hidden="true"
                            className="grid size-16 place-items-center rounded-[18px] bg-dark text-lg font-extrabold text-accent sm:size-18 sm:rounded-[22px] sm:text-xl"
                        >
                            {initials(i.display_name)}
                        </span>
                    )}
                    <span className="absolute -bottom-0.5 -right-0.5 grid size-6 place-items-center rounded-full bg-ok text-white ring-2 ring-white">
                        <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor"
                            strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="m5 12.5 4.5 4.5L19 7.5" />
                        </svg>
                        <span className="sr-only">Verificado pela plataforma</span>
                    </span>
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                        <h3 className="min-w-0 truncate text-base font-extrabold tracking-tight sm:text-lg">
                            {i.display_name}
                        </h3>
                        {i.rating_average !== null ? (
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-dark px-2.5 py-1 text-xs font-bold text-white">
                                <span className="text-accent" aria-hidden="true">★</span>
                                {i.rating_average.toLocaleString("pt-BR", {
                                    minimumFractionDigits: 1,
                                    maximumFractionDigits: 1,
                                })}
                                <span className="font-medium text-white/60">({i.rating_count})</span>
                            </span>
                        ) : (
                            <span className="shrink-0 rounded-full bg-chip px-2.5 py-1 text-xs font-semibold text-soft">
                                Sem avaliações
                            </span>
                        )}
                    </div>

                    {i.cities.length > 0 && (
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-soft">
                            <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" stroke="currentColor"
                                strokeWidth="1.9" aria-hidden="true">
                                <path d="M20 10.2c0 5.6-8 11.8-8 11.8S4 15.8 4 10.2a8 8 0 0 1 16 0Z" />
                                <circle cx="12" cy="10" r="3" />
                            </svg>
                            <span className="truncate">
                                {shown}
                                {extra > 0 && ` +${extra}`}
                                {uf && ` · ${uf}`}
                            </span>
                        </p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-2">
                        {i.categories.map((c) => (
                            <span key={c} className="rounded-full bg-dark px-3 py-1 text-xs font-bold text-accent">
                                Categoria {c}
                            </span>
                        ))}
                        {i.vehicle_types.map((v) => (
                            <span key={v} className="rounded-full bg-chip px-3 py-1 text-xs font-semibold">
                                {VEHICLE_LABEL[v] ?? v}
                            </span>
                        ))}
                    </div>
                </div>
            </Link>
        </li>
    );
}

export function InstructorCardSkeleton() {
    return (
        <li
            aria-hidden="true"
            className="flex animate-pulse gap-4 rounded-3xl border border-line bg-white p-4 motion-reduce:animate-none sm:p-5"
        >
            <div className="size-16 shrink-0 rounded-full bg-chip sm:size-18" />
            <div className="flex-1 space-y-3 pt-1">
                <div className="h-4 w-2/5 rounded-full bg-chip" />
                <div className="h-3 w-3/5 rounded-full bg-chip" />
                <div className="flex gap-2">
                    <div className="h-6 w-24 rounded-full bg-chip" />
                    <div className="h-6 w-16 rounded-full bg-chip" />
                </div>
            </div>
        </li>
    );
}