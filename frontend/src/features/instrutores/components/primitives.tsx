import type { ReactNode } from "react";

export function Section({
    title,
    children,
    className = "",
}: {
    title: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <section
            className={`md:rounded-[28px] md:bg-white md:p-7 md:ring-1 md:ring-line ${className}`}
        >
            <h2 className="mb-3.5 text-xs font-bold uppercase tracking-[0.16em] text-muted">
                {title}
            </h2>
            {children}
        </section>
    );
}

export function Chip({
    children,
    tone = "light",
}: {
    children: ReactNode;
    tone?: "light" | "dark";
}) {
    const styles = tone === "dark" ? "bg-ink text-accent" : "bg-chip text-ink";
    return (
        <span
            className={`rounded-full px-5 py-3 text-[15px] font-semibold ${styles}`}
        >
            {children}
        </span>
    );
}

export function ChipList({ children }: { children: ReactNode }) {
    return <div className="flex flex-wrap gap-2.5">{children}</div>;
}