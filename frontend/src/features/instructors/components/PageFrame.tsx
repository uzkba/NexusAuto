import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

// TODO: mover para src/components/ quando o grupo combinar o layout global.

function SiteHeader({ title, back }: { title: string; back: boolean }) {
    const navigate = useNavigate();

    function goBack() {
        const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
        if (idx > 0) navigate(-1);
        else navigate("/instrutores"); // link aberto direto: não sai do site
    }

    return (
        <header className="border-b border-white/10">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 md:px-8">
                <div className="flex items-center gap-3">
                    {back && (
                        <button
                            type="button"
                            onClick={goBack}
                            aria-label="Voltar"
                            className="-ml-2 grid size-10 place-items-center rounded-full transition hover:bg-white/10"
                        >
                            <svg
                                viewBox="0 0 24 24"
                                className="size-6"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                            >
                                <path d="m14.5 6-6 6 6 6" />
                            </svg>
                        </button>
                    )}
                    <span className="text-lg font-extrabold leading-none tracking-tight">
                        NEXUS <span className="text-accent">AUTO</span>
                    </span>
                </div>
                <span className="hidden text-sm font-medium text-white/50 md:block">
                    {title}
                </span>
            </div>
        </header>
    );
}

function SiteFooter() {
    return (
        <footer className="border-t border-line">
            <div className="mx-auto flex max-w-6xl flex-col gap-1 px-5 py-6 text-xs text-muted max-md:pb-32 md:flex-row md:items-center md:justify-between md:px-8">
                <span className="font-bold text-ink">NEXUS AUTO</span>
                <span>
                    Aproxima alunos e instrutores autônomos de direção. Sem
                    vínculo com o Detran.
                </span>
            </div>
        </footer>
    );
}

export function PageFrame({
    hero,
    children,
    title = "Perfil do instrutor",
    back = true,
}: {
    hero?: ReactNode;
    children: ReactNode;
    title?: string;
    back?: boolean;
}) {
    return (
        <div className="flex min-h-dvh flex-col bg-cream">
            <div className="bg-dark text-white">
                <SiteHeader title={title} back={back} />
                {hero}
                <div aria-hidden="true" className="road h-1.5" />
            </div>
            <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-12 pt-8 md:px-8 md:pb-14 md:pt-10">
                {children}
            </main>
            <SiteFooter />
        </div>
    );
}