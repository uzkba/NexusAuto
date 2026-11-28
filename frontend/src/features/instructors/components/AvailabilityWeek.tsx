import type { Availability } from "../types";
import { WEEKDAYS, joinPeriods } from "../format";

function groupByPeriods(availability: Availability[]) {
    const groups = new Map<string, { days: string[]; label: string }>();
    for (const item of availability) {
        const key = item.periods.join("|");
        const group = groups.get(key) ?? {
            days: [],
            label: joinPeriods(item.periods),
        };
        group.days.push(WEEKDAYS[item.weekday].abbr);
        groups.set(key, group);
    }
    return [...groups.values()];
}

export function AvailabilityWeek({
    availability,
}: {
    availability: Availability[];
}) {
    if (availability.length === 0) {
        return <p className="text-sm text-muted">Não informada.</p>;
    }
    const byDay = new Map(availability.map((a) => [a.weekday, a.periods]));

    return (
        <div>
            <ul className="flex flex-wrap gap-2">
                {WEEKDAYS.map((day, i) => {
                    const periods = byDay.get(i);
                    return (
                        <li
                            key={day.name}
                            aria-label={
                                periods
                                    ? `${day.name}: ${joinPeriods(periods)}`
                                    : `${day.name}: indisponível`
                            }
                            className={`grid size-11 place-items-center rounded-2xl text-sm font-bold ${
                                periods
                                    ? "bg-ink text-white"
                                    : "bg-chip text-muted"
                            }`}
                        >
                            {day.short}
                        </li>
                    );
                })}
            </ul>
            <ul className="mt-3.5 space-y-0.5 text-sm font-medium text-muted">
                {groupByPeriods(availability).map((g) => (
                    <li key={g.label}>
                        {g.days.join(", ")} · {g.label}
                    </li>
                ))}
            </ul>
        </div>
    );
}
