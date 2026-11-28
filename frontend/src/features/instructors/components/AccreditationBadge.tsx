import type { InstrutorPerfil } from "../types"; // ADAPTAR: mantenha o import que o arquivo já usa
import { formatDate } from "../format";

const SELO_APROVADO = "Credenciamento verificado pela plataforma";

function IconCircle({ children }: { children: React.ReactNode }) {
    return (
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-white/70">
            {children}
        </span>
    );
}

const Shield = () => (
    <svg
        viewBox="0 0 24 24"
        className="size-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        <path d="M12 22s8-3.6 8-10V5.2L12 2 4 5.2V12c0 6.4 8 10 8 10Z" />
        <path d="m8.8 11.8 2.2 2.2 4.2-4.2" />
    </svg>
);

export function AccreditationBadge({
    accreditation,
}: {
    accreditation: InstrutorPerfil["accreditation"];
}) {
    // Pendente ou rejeitado: nenhum selo (04.2)
    if (accreditation.status !== "aprovado") return null;

    return (
        <div
            role="status"
            className="flex items-center gap-3.5 rounded-3xl border border-ok-border bg-ok-bg p-4 text-ok"
        >
            <IconCircle>
                <Shield />
            </IconCircle>
            <div>
                <p className="font-bold leading-snug text-ink">{SELO_APROVADO}</p>
                <p className="mt-0.5 text-[13px] font-medium leading-snug">
                    Comprovante analisado pela equipe NEXUS AUTO
                    {accreditation.reviewed_at &&
                        ` em ${formatDate(accreditation.reviewed_at)}`}
                    .
                </p>
            </div>
        </div>
    );
}
