import type { Vehicle } from "../types";

const Moto = () => (
    <svg
        viewBox="0 0 24 24"
        className="size-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        <circle cx="5.3" cy="16.7" r="2.7" />
        <circle cx="18.7" cy="16.7" r="2.7" />
        <path d="M8 16.7h4.6l1.9-4.2H17" />
        <path d="M14.5 12.5 12.8 9h-3" />
        <path d="M5.3 16.7 8.6 10H6.5" />
        <path d="M14.5 6.5h2.2l2 6.9" />
    </svg>
);

const Carro = () => (
    <svg
        viewBox="0 0 24 24"
        className="size-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        <path d="M5 11 6.6 7.2A2 2 0 0 1 8.5 6h7a2 2 0 0 1 1.9 1.2L19 11" />
        <path d="M4 11h16a1 1 0 0 1 1 1v4h-1.5M4 12v4h1.5" />
        <circle cx="7.5" cy="16.5" r="2" />
        <circle cx="16.5" cy="16.5" r="2" />
        <path d="M9.5 16.5h5" />
    </svg>
);

export function VehicleList({ vehicles }: { vehicles: Vehicle[] }) {
    if (vehicles.length === 0) {
        return <p className="text-sm text-muted">Nenhum veículo informado.</p>;
    }
    return (
        <ul className="grid gap-3 sm:grid-cols-2">
            {vehicles.map((v) => (
                <li
                    key={`${v.brand_model}-${v.year}`}
                    className="flex items-center gap-3.5 rounded-[22px] bg-white p-4 ring-1 ring-line md:bg-cream md:ring-0"
                >
                    <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-cream">
                        {v.type === "moto" ? <Moto /> : <Carro />}
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-bold">
                            {v.brand_model}
                        </p>
                        <p className="text-[13px] text-muted">
                            {v.year} ·{" "}
                            {v.transmission === "manual"
                                ? "manual"
                                : "automático"}
                            {v.dual_control && " · dup. comando"}
                        </p>
                    </div>
                    <span
                        aria-label={`Categoria ${v.category}`}
                        className="rounded-full bg-ink px-2.5 py-1 text-xs font-bold text-accent"
                    >
                        {v.category}
                    </span>
                </li>
            ))}
        </ul>
    );
}
