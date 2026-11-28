import { useParams } from "react-router-dom";

import { TERRAIN_LABEL } from "../format";

import { PageFrame } from "../components/PageFrame";
import { Avatar } from "../components/Avatar";
import { RatingSummary } from "../components/RatingSummary";
import { AccreditationBadge } from "../components/AccreditationBadge";
import { ContactCta } from "../components/ContactCta";
import { Chip, ChipList, Section } from "../components/primitives";
import { AvailabilityWeek } from "../components/AvailabilityWeek";
import { VehicleList } from "../components/VehicleList";
import { isNotFound, useInstrutorPerfil } from "../instructors";

const HERO_BOX = "mx-auto max-w-6xl px-5 pb-10 pt-6 md:px-8 md:pb-14 md:pt-10";

function Loading() {
    return (
        <PageFrame
            hero={
                <div
                    aria-busy="true"
                    aria-label="Carregando perfil"
                    className={`${HERO_BOX} animate-pulse`}
                >
                    <div className="flex items-center gap-5 md:gap-7">
                        <div className="size-24 rounded-[26px] bg-white/10 md:size-32 md:rounded-[34px]" />
                        <div className="flex-1 space-y-3">
                            <div className="h-3 w-32 rounded bg-white/10" />
                            <div className="h-9 w-2/3 rounded bg-white/10" />
                            <div className="h-7 w-40 rounded-full bg-white/10" />
                        </div>
                    </div>
                </div>
            }
        >
            <div className="grid animate-pulse gap-5 md:grid-cols-2 lg:grid-cols-3">
                <div className="h-40 rounded-[28px] bg-chip md:col-span-2" />
                <div className="h-40 rounded-[28px] bg-chip" />
                <div className="h-40 rounded-[28px] bg-chip" />
                <div className="h-40 rounded-[28px] bg-chip md:col-span-2" />
            </div>
        </PageFrame>
    );
}

export default function InstructorProfilePage() {
    const { id = "" } = useParams();
    const {
        data: p,
        error,
        isPending,
        isError,
        refetch,
    } = useInstrutorPerfil(id);

    if (isPending) return <Loading />;

    if (isError) {
        const notFound = isNotFound(error);
        return (
            <PageFrame>
                <div role="alert" className="max-w-md rounded-3xl bg-chip p-6">
                    <p className="text-lg font-bold">
                        {notFound
                            ? "Instrutor não encontrado"
                            : "Não foi possível carregar o perfil"}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                        {notFound
                            ? "Este perfil não existe ou não está disponível."
                            : "Verifique sua conexão e tente de novo."}
                    </p>
                    {!notFound && (
                        <button
                            type="button"
                            onClick={() => refetch()}
                            className="mt-4 rounded-2xl bg-ink px-5 py-3 text-sm font-bold text-white"
                        >
                            Tentar novamente
                        </button>
                    )}
                </div>
            </PageFrame>
        );
    }

    const hero = (
        <div className={HERO_BOX}>
            <div className="grid gap-7 lg:grid-cols-[1fr_25rem] lg:items-center lg:gap-12">
                <div className="rise">
                    <div className="flex items-center gap-5 md:gap-7">
                        <Avatar
                            name={p.display_name}
                            photoUrl={p.photo_url}
                            verified={p.accreditation.status === "aprovado"}
                        />
                        <div className="min-w-0">
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/50">
                                Instrutor de direção
                            </p>
                            <h1 className="mt-1.5 text-[1.9rem] font-extrabold leading-[1.05] tracking-tight md:text-5xl">
                                {p.display_name}
                            </h1>
                            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-sm text-white/70">
                                <RatingSummary
                                    average={p.reviews.average}
                                    count={p.reviews.count}
                                />
                            </p>
                        </div>
                    </div>
                </div>

                <div>
                    <div className="rise">
                        <AccreditationBadge accreditation={p.accreditation} />
                    </div>
                    <ContactCta phone={p.phone} />
                </div>
            </div>
        </div>
    );

    return (
        <PageFrame hero={hero}>
            <div className="rise grid gap-x-5 gap-y-9 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
                {p.bio && (
                    <Section title="Sobre" className="md:col-span-2">
                        <p className="text-[15px] leading-relaxed">{p.bio}</p>
                    </Section>
                )}

                <Section title="Categorias">
                    <ChipList>
                        {p.categories.map((c) => (
                            <Chip key={c} tone="dark">
                                Categoria {c}
                            </Chip>
                        ))}
                    </ChipList>
                </Section>

                <Section title="Terrenos">
                    <ChipList>
                        {p.terrains.map((t) => (
                            <Chip key={t}>{TERRAIN_LABEL[t] ?? t}</Chip>
                        ))}
                    </ChipList>
                </Section>

                <Section title="Atende em" className="md:col-span-2">
                    <ChipList>
                        {p.cities.map((c) => (
                            <Chip key={c.ibge_code}>{c.name}</Chip>
                        ))}
                    </ChipList>
                </Section>

                <Section
                    title="Disponibilidade informada"
                    className="md:col-span-2"
                >
                    <AvailabilityWeek availability={p.availability} />
                </Section>

                {p.training_structure && (
                    <Section
                        title="Estrutura de treino"
                        className="md:col-span-2 lg:col-span-1"
                    >
                        <p className="text-[15px] leading-relaxed">
                            {p.training_structure}
                        </p>
                    </Section>
                )}

                <Section
                    title="Veículos"
                    className="md:col-span-2 lg:col-span-3"
                >
                    <VehicleList vehicles={p.vehicles} />
                </Section>

            </div>
        </PageFrame>
    );
}