import { useRef, useState, type KeyboardEvent } from "react";

const STARS = [1, 2, 3, 4, 5] as const;

const RATING_LABELS: Record<number, string> = {
    1: "1 - Muito ruim",
    2: "2 - Ruim",
    3: "3 - Regular",
    4: "4 - Bom",
    5: "5 - Excelente",
};

function StarIcon({ filled, className }: { filled: boolean; className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            className={`${className ?? "size-8"} transition-colors ${
                filled ? "text-accent" : "text-sand"
            }`}
            fill="currentColor"
            aria-hidden="true"
        >
            <path d="M12 2.5l2.9 5.88 6.5.94-4.7 4.58 1.11 6.47L12 17.31l-5.81 3.06 1.11-6.47-4.7-4.58 6.5-.94L12 2.5z" />
        </svg>
    );
}

export function StarRatingDisplay({ rating }: { rating: number }) {
    const label = RATING_LABELS[rating] ?? `${rating} estrelas`;
    return (
        <div className="flex flex-wrap items-center gap-2.5">
            <div
                className="inline-flex items-center gap-0.5"
                role="img"
                aria-label={`Nota ${rating} de 5 estrelas`}
            >
                {STARS.map((star) => (
                    <StarIcon
                        key={star}
                        filled={star <= rating}
                        className="size-6"
                    />
                ))}
            </div>
            <span className="text-sm font-semibold text-ink">{label}</span>
        </div>
    );
}

export interface StarRatingInputProps {
    value: number | null;
    onChange: (value: number) => void;
    disabled?: boolean;
    invalid?: boolean;
    describedBy?: string;
    labelledBy?: string;
}

export function StarRatingInput({
    value,
    onChange,
    disabled = false,
    invalid = false,
    describedBy,
    labelledBy,
}: StarRatingInputProps) {
    const [hovered, setHovered] = useState<number | null>(null);
    const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

    const activeRating = hovered ?? value ?? 0;

    function selectAndFocus(next: number) {
        if (disabled) return;
        onChange(next);
        buttonRefs.current[next - 1]?.focus();
    }

    function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>, star: number) {
        if (disabled) return;

        switch (e.key) {
            case "ArrowRight":
            case "ArrowUp": {
                e.preventDefault();
                const next = value === null ? star : Math.min(5, star + 1);
                selectAndFocus(next);
                break;
            }
            case "ArrowLeft":
            case "ArrowDown": {
                e.preventDefault();
                const prev = Math.max(1, star - 1);
                selectAndFocus(prev);
                break;
            }
            case "Home": {
                e.preventDefault();
                selectAndFocus(1);
                break;
            }
            case "End": {
                e.preventDefault();
                selectAndFocus(5);
                break;
            }
            default:
                break;
        }
    }

    return (
        <div className="flex flex-wrap items-center gap-3">
            <div
                role="radiogroup"
                aria-label={labelledBy ? undefined : "Nota de 1 a 5 estrelas"}
                aria-labelledby={labelledBy}
                aria-describedby={describedBy}
                aria-invalid={invalid || undefined}
                aria-required="true"
                onMouseLeave={() => setHovered(null)}
                className={`inline-flex items-center gap-1 rounded-2xl bg-cream px-2.5 py-1.5 ring-1 transition ${
                    invalid ? "ring-red-400" : "ring-line"
                }`}
            >
                {STARS.map((star) => {
                    const checked = value === star;
                    const tabIndex =
                        checked || (value === null && star === 1) ? 0 : -1;
                    return (
                        <button
                            key={star}
                            ref={(el) => {
                                buttonRefs.current[star - 1] = el;
                            }}
                            type="button"
                            role="radio"
                            aria-checked={checked}
                            aria-label={
                                star === 1 ? "1 estrela" : `${star} estrelas`
                            }
                            tabIndex={disabled ? -1 : tabIndex}
                            disabled={disabled}
                            onClick={() => !disabled && onChange(star)}
                            onMouseEnter={() => !disabled && setHovered(star)}
                            onKeyDown={(e) => handleKeyDown(e, star)}
                            className="cursor-pointer rounded-xl p-1 transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <StarIcon filled={star <= activeRating} />
                        </button>
                    );
                })}
            </div>

            <span className="text-sm font-medium text-soft">
                {activeRating > 0
                    ? RATING_LABELS[activeRating]
                    : "Selecione uma nota"}
            </span>
        </div>
    );
}
