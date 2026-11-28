import type { ReactNode } from "react";
import {
    CATEGORIES,
    DAYS,
    PERIODS,
    VEHICLES,
    toggle,
    type Filters,
} from "../searchOptions";
import { FilterPill } from "./FilterPill";

type Props = {
    filters: Filters;
    terrainOptions: { value: string; label: string }[];
    onChange: (patch: Partial<Filters>) => void;
};

function Group({ title, children }: { title: string; children: ReactNode }) {
    return (
        <fieldset className="min-w-0">
            <legend className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-soft">
                {title}
            </legend>
            {children}
        </fieldset>
    );
}

export function FiltersPanel({ filters, terrainOptions, onChange }: Props) {
    return (
        <div className="space-y-7">
            <Group title="Categoria">
                <div className="flex gap-2">
                    {CATEGORIES.map((c) => (
                        <FilterPill
                            key={c}
                            variant="circle"
                            label={`Categoria ${c}`}
                            active={filters.categories.includes(c)}
                            onClick={() =>
                                onChange({
                                    categories: toggle(filters.categories, c),
                                })
                            }
                        >
                            {c}
                        </FilterPill>
                    ))}
                </div>
                {filters.categories.length > 1 && (
                    <p className="mt-2 text-xs text-soft">
                        Instrutores que ensinam as duas.
                    </p>
                )}
            </Group>

            <Group title="Veículo">
                <div className="flex flex-wrap gap-2">
                    {VEHICLES.map((v) => (
                        <FilterPill
                            key={v.value}
                            active={filters.vehicle === v.value}
                            onClick={() =>
                                onChange({
                                    vehicle:
                                        filters.vehicle === v.value
                                            ? ""
                                            : v.value,
                                })
                            }
                        >
                            {v.label}
                        </FilterPill>
                    ))}
                </div>
            </Group>

            <Group title="Terreno">
                <div className="flex flex-wrap gap-2">
                    {terrainOptions.map((t) => (
                        <FilterPill
                            key={t.value}
                            active={filters.terrains.includes(t.value)}
                            onClick={() =>
                                onChange({
                                    terrains: toggle(filters.terrains, t.value),
                                })
                            }
                        >
                            {t.label}
                        </FilterPill>
                    ))}
                </div>
            </Group>

            <Group title="Disponibilidade">
                <div className="grid grid-cols-7 gap-1">
                    {DAYS.map((d) => (
                        <FilterPill
                            key={d.value}
                            variant="day"
                            label={d.label}
                            active={filters.weekdays.includes(d.value)}
                            onClick={() =>
                                onChange({
                                    weekdays: toggle(filters.weekdays, d.value),
                                })
                            }
                        >
                            {d.short}
                        </FilterPill>
                    ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                    {PERIODS.map((p) => (
                        <FilterPill
                            key={p.value}
                            active={filters.periods.includes(p.value)}
                            onClick={() =>
                                onChange({
                                    periods: toggle(filters.periods, p.value),
                                })
                            }
                        >
                            {p.label}
                        </FilterPill>
                    ))}
                </div>
            </Group>
        </div>
    );
}
