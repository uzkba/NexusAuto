import { formatRating } from "../format";

export function RatingSummary({
    average,
    count,
}: {
    average: number | null;
    count: number;
}) {
    if (average === null) return <span>Sem avaliações ainda</span>;
    return (
        <>
            <span
                className="text-base leading-none text-accent"
                aria-hidden="true"
            >
                ★
            </span>
            <b className="text-white">{formatRating(average)}</b>
            <span>
                · {count} {count === 1 ? "avaliação" : "avaliações"}
            </span>
        </>
    );
}
