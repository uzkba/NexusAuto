import type { ReactNode } from "react";

type Variant = "pill" | "circle" | "day";

const SHAPE: Record<Variant, string> = {
    pill: "min-h-11 px-4",
    circle: "size-11",
    day: "aspect-square w-full",
};
const ACTIVE: Record<Variant, string> = {
    pill: "bg-ink text-accent",
    circle: "bg-ink text-accent",
    day: "bg-ink text-white",
};
const IDLE: Record<Variant, string> = {
    pill: "bg-chip text-ink hover:bg-sand",
    circle: "bg-chip text-ink hover:bg-sand",
    day: "bg-chip text-soft hover:bg-sand",
};

type Props = {
    active: boolean;
    onClick: () => void;
    children: ReactNode;
    label?: string;
    variant?: Variant;
};

export function FilterPill({ active, onClick, children, label, variant = "pill" }: Props) {
    return (
        <button
            type="button"
            aria-pressed={active}
            aria-label={label}
            title={label}
            onClick={onClick}
            className={`inline-flex select-none items-center justify-center rounded-full text-sm font-semibold transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${SHAPE[variant]} ${
                active ? ACTIVE[variant] : IDLE[variant]
            }`}
        >
            {children}
        </button>
    );
}