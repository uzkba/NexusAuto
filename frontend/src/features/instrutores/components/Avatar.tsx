import { useState } from "react";
import { initials } from "../format";

interface Props {
    name: string;
    photoUrl: string | null;
    verified?: boolean;
}

export function Avatar({ name, photoUrl, verified = false }: Props) {
    const [failed, setFailed] = useState(false);
    const size = "size-24 rounded-[26px] md:size-32 md:rounded-[34px]";

    return (
        <div className="relative shrink-0">
            {photoUrl && !failed ? (
                <img
                    src={photoUrl}
                    alt={`Foto de ${name}`}
                    onError={() => setFailed(true)}
                    className={`${size} object-cover ring-4 ring-white/10`}
                />
            ) : (
                <div
                    aria-hidden="true"
                    className={`${size} grid place-items-center bg-accent text-3xl font-extrabold text-ink md:text-5xl`}
                >
                    {initials(name)}
                </div>
            )}
            {verified && (
                <span
                    aria-hidden="true"
                    className="absolute -bottom-1.5 -right-1.5 grid size-8 place-items-center rounded-full bg-ok text-white ring-4 ring-dark md:size-9"
                >
                    <svg
                        viewBox="0 0 24 24"
                        className="size-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="m5 12.5 4.5 4.5L19 7.5" />
                    </svg>
                </span>
            )}
        </div>
    );
}
