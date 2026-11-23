import { formatPhone } from "../format";

const PhoneIcon = () => (
    <svg
        viewBox="0 0 24 24"
        className="size-5 text-accent md:text-ink"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
    </svg>
);

const LockIcon = () => (
    <svg
        viewBox="0 0 24 24"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        <rect x="5" y="11" width="14" height="9" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
);

/**
 * Celular: botão escuro fixo no rodapé (como no protótipo).
 * md+: fica na faixa escura do topo, em amarelo.
 * TODO(09.1): trocar/complementar com o botão "Chamar no WhatsApp" (só aluno logado e telefone válido).
 * TODO(07.3): linkar "Entre" para o login quando existir.
 */
export function ContactCta({ phone }: { phone: string | null }) {
    return (
        <div className="max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-20 max-md:bg-linear-to-t max-md:from-cream max-md:from-75% max-md:to-transparent max-md:px-5 max-md:pb-[max(1rem,env(safe-area-inset-bottom))] max-md:pt-8 md:mt-4">
            <div className="mx-auto max-w-xl md:max-w-none">
                {phone ? (
                    <a
                        href={`tel:+55${phone.replace(/\D/g, "")}`}
                        className="flex w-full items-center justify-center gap-2.5 rounded-[20px] bg-dark px-6 py-4.5 text-base text-white shadow-lg shadow-ink/20 transition hover:bg-ink active:scale-[0.98] md:bg-accent md:text-ink md:shadow-none md:hover:brightness-95"
                    >
                        <PhoneIcon />
                        <span className="font-medium opacity-70">Ligar</span>
                        <b>{formatPhone(phone)}</b>
                    </a>
                ) : (
                    <div className="flex w-full items-center justify-center gap-2.5 rounded-[20px] bg-chip px-6 py-4.5 text-base font-semibold text-ink md:bg-white/10 md:text-white">
                        <LockIcon />
                        <span>Entre para ver o contato</span>
                    </div>
                )}
                <p className="mt-3 text-center text-xs text-muted md:text-white/50">
                    Valores e horários você combina direto com o instrutor.
                </p>
            </div>
        </div>
    );
}
