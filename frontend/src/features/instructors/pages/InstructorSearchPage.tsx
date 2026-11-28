// src/features/instructors/pages/InstructorSearchPage.tsx
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { PageFrame } from "../components/PageFrame";
import { CityCombobox } from "../../students/components/CityCombobox";
import { FiltersPanel } from "../components/FiltersPanel";
import {
    InstructorCardSkeleton,
    InstructorResultCard,
} from "../components/InstructorResultCard";
import { listTerrains, searchInstructors } from "../searchApi";
import {
    EMPTY_FILTERS,
    activeFilterCount,
    buildChips,
    terrainLabel,
    toParams,
    type Filters,
} from "../searchOptions";

const LABEL = "text-[11px] font-bold uppercase tracking-[0.18em] text-soft";

export function InstructorSearchPage() {
    const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
    const [page, setPage] = useState(1);
    const [sheetOpen, setSheetOpen] = useState(false);
    const resultsRef = useRef<HTMLDivElement>(null);
    const sheetRef = useRef<HTMLDialogElement>(null);

    function update(patch: Partial<Filters>) {
        setPage(1);
        setFilters((f) => ({ ...f, ...patch }));
    }

    function clearFilters() {
        update({
            categories: [],
            vehicle: "",
            terrains: [],
            weekdays: [],
            periods: [],
        });
    }

    function goToPage(next: number) {
        setPage(next);
        resultsRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });
    }

    useEffect(() => {
        const el = sheetRef.current;
        if (!el) return;
        if (sheetOpen && !el.open) el.showModal();
        if (!sheetOpen && el.open) el.close();
    }, [sheetOpen]);

    useEffect(() => {
        document.body.style.overflow = sheetOpen ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [sheetOpen]);

    const params = toParams(filters, page);
    const { data, isPending, isFetching, isError, refetch } = useQuery({
        queryKey: ["instructor-search", params.toString()],
        queryFn: ({ signal }) => searchInstructors(params, signal),
        placeholderData: keepPreviousData,
    });

    const { data: terrains = [] } = useQuery({
        queryKey: ["terrains"],
        queryFn: ({ signal }) => listTerrains(signal),
        staleTime: Infinity,
    });
    const terrainOptions = terrains.map((t) => ({
        value: String(t.id),
        label: terrainLabel(t.code),
    }));
    const terrainName = (id: string) =>
        terrainOptions.find((o) => o.value === id)?.label ?? id;

    const count = activeFilterCount(filters);
    const chips = buildChips(filters, terrainName);
    const noLocation = !filters.city && !filters.uf;
    const totalPages = data
        ? Math.max(1, Math.ceil(data.total / data.page_size))
        : 1;
    const refreshing = isFetching && !isPending;

    const showStateHint = !filters.city && !!filters.uf;
    const showDefaultHint = noLocation && !!data?.default_city;

    const hero = (
        <div className="relative z-30 mx-auto max-w-6xl px-5 pb-8 pt-4 md:px-8 md:pb-10 md:pt-6">
            <div className="rise">
                <h1 className="text-balance text-[1.9rem] font-extrabold leading-[1.1] tracking-tight md:text-4xl">
                    Encontre um instrutor{" "}
                    <span className="text-accent">perto de você</span>
                </h1>

                <div className="mt-5 max-w-xl">
                    <label htmlFor="busca-cidade" className="sr-only">
                        Cidade
                    </label>
                    <CityCombobox
                        variant="hero"
                        id="busca-cidade"
                        value={filters.city}
                        placeholder="Em qual cidade você quer aprender?"
                        onChange={(c) => update({ city: c, uf: "" })}
                        onClear={() => update({ city: null })}
                    />

                    {(showStateHint || showDefaultHint) && (
                        <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/70">
                            {showStateHint && (
                                <>
                                    <span>Todo o estado ({filters.uf})</span>
                                    <button
                                        type="button"
                                        className="font-semibold text-white underline underline-offset-2 hover:text-accent"
                                        onClick={() => update({ uf: "" })}
                                    >
                                        Remover
                                    </button>
                                </>
                            )}
                            {showDefaultHint && data?.default_city && (
                                <>
                                    <span>
                                        Mostrando {data.default_city.name} -{" "}
                                        {data.default_city.uf}
                                    </span>
                                    <button
                                        type="button"
                                        className="font-semibold text-white underline underline-offset-2 hover:text-accent"
                                        onClick={() =>
                                            update({
                                                uf: data.default_city!.uf,
                                            })
                                        }
                                    >
                                        Ver todo o estado
                                    </button>
                                    <Link
                                        to="/aluno/perfil"
                                        className="font-semibold text-white underline underline-offset-2 hover:text-accent"
                                    >
                                        Alterar região padrão
                                    </Link>
                                </>
                            )}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <PageFrame hero={hero} title="Buscar instrutor" back={false}>
            <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
                {/* filtros no desktop */}
                <aside
                    aria-label="Filtros"
                    className="hidden lg:sticky lg:top-6 lg:block"
                >
                    <div className="rounded-[28px] border border-line bg-white p-5 shadow-sm">
                        <div className="mb-5 flex items-center justify-between">
                            <h2 className={LABEL}>Filtros</h2>
                            {count > 0 && (
                                <button
                                    type="button"
                                    className="text-sm font-semibold underline"
                                    onClick={clearFilters}
                                >
                                    Limpar
                                </button>
                            )}
                        </div>
                        <FiltersPanel
                            filters={filters}
                            terrainOptions={terrainOptions}
                            onChange={update}
                        />
                    </div>
                </aside>

                <section aria-label="Resultados">
                    <div
                        ref={resultsRef}
                        className="sticky top-0 z-20 -mx-5 bg-cream/95 px-5 py-3 backdrop-blur md:-mx-8 md:px-8 lg:static lg:mx-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none"
                    >
                        <div className="flex items-center justify-between gap-3">
                            <p
                                aria-live="polite"
                                className="text-sm font-semibold"
                            >
                                {data
                                    ? `${data.total} ${data.total === 1 ? "instrutor" : "instrutores"}`
                                    : "Buscando..."}
                            </p>
                            <button
                                type="button"
                                aria-haspopup="dialog"
                                onClick={() => setSheetOpen(true)}
                                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-4 text-sm font-semibold text-white lg:hidden"
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    className="size-4"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    aria-hidden="true"
                                >
                                    <path d="M7 4v6M7 14v6M17 4v2M17 10v10" />
                                    <circle cx="7" cy="12" r="2" />
                                    <circle cx="17" cy="8" r="2" />
                                </svg>
                                Filtros
                                {count > 0 && (
                                    <span className="grid size-5 place-items-center rounded-full bg-accent text-xs font-bold text-ink">
                                        {count}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    {chips.length > 0 && (
                        <ul className="mt-3 flex flex-wrap items-center gap-2">
                            {chips.map((c) => (
                                <li key={c.key}>
                                    <button
                                        type="button"
                                        aria-label={`Remover filtro ${c.label}`}
                                        onClick={() => update(c.patch)}
                                        className="inline-flex items-center gap-1.5 rounded-full bg-chip px-3 py-1.5 text-xs font-semibold hover:bg-sand"
                                    >
                                        {c.label}
                                        <svg
                                            viewBox="0 0 24 24"
                                            className="size-3"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            aria-hidden="true"
                                        >
                                            <path d="m6 6 12 12M18 6 6 18" />
                                        </svg>
                                    </button>
                                </li>
                            ))}
                            <li>
                                <button
                                    type="button"
                                    className="px-2 text-xs font-semibold underline"
                                    onClick={clearFilters}
                                >
                                    Limpar tudo
                                </button>
                            </li>
                        </ul>
                    )}

                    {isError && !data && (
                        <div
                            role="alert"
                            className="mt-4 rounded-[28px] border border-warn-border bg-warn-bg p-6 text-warn"
                        >
                            <p className="font-bold text-ink">
                                Não foi possível carregar os instrutores.
                            </p>
                            <button
                                type="button"
                                onClick={() => refetch()}
                                className="mt-3 min-h-11 rounded-2xl bg-ink px-5 text-sm font-bold text-white"
                            >
                                Tentar novamente
                            </button>
                        </div>
                    )}

                    {isPending && !isError && (
                        <ul className="mt-4 grid gap-3 md:gap-4">
                            {Array.from({ length: 5 }, (_, n) => (
                                <InstructorCardSkeleton key={n} />
                            ))}
                        </ul>
                    )}

                    {data && data.items.length === 0 && (
                        // placeholder: a 03.2 troca por "Ampliar filtros" e "Buscar em cidades vizinhas"
                        <div className="mt-4 rounded-[28px] bg-chip p-8 text-center">
                            <p className="text-lg font-bold">
                                Nenhum instrutor encontrado
                            </p>
                            <p className="mx-auto mt-1 max-w-sm text-sm text-soft">
                                Nenhum perfil atende a todos os filtros
                                escolhidos.
                            </p>
                            {count > 0 && (
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="mt-4 min-h-11 rounded-2xl bg-ink px-5 text-sm font-bold text-white"
                                >
                                    Limpar filtros
                                </button>
                            )}
                        </div>
                    )}

                    {data && data.items.length > 0 && (
                        <ul
                            className={`mt-4 grid gap-3 transition-opacity motion-reduce:transition-none md:gap-4 ${
                                refreshing ? "opacity-60" : ""
                            }`}
                        >
                            {data.items.map((i) => (
                                <InstructorResultCard
                                    key={i.id}
                                    instructor={i}
                                />
                            ))}
                        </ul>
                    )}

                    {data && data.total > data.page_size && (
                        <nav
                            aria-label="Paginação"
                            className="mt-6 flex items-center justify-between gap-3"
                        >
                            <button
                                type="button"
                                disabled={page <= 1}
                                onClick={() => goToPage(page - 1)}
                                className="min-h-11 rounded-2xl bg-ink px-5 text-sm font-bold text-white disabled:bg-chip disabled:text-muted"
                            >
                                Anterior
                            </button>
                            <span className="text-sm font-semibold">
                                Página {page} de {totalPages}
                            </span>
                            <button
                                type="button"
                                disabled={page >= totalPages}
                                onClick={() => goToPage(page + 1)}
                                className="min-h-11 rounded-2xl bg-ink px-5 text-sm font-bold text-white disabled:bg-chip disabled:text-muted"
                            >
                                Próxima
                            </button>
                        </nav>
                    )}
                </section>
            </div>

            {/* filtros no celular: folha vinda de baixo */}
            <dialog
                ref={sheetRef}
                aria-labelledby="filters-title"
                onClose={() => setSheetOpen(false)}
                onClick={(e) => {
                    if (e.target === e.currentTarget) setSheetOpen(false);
                }}
                className="fixed inset-x-0 bottom-0 top-auto m-0 max-h-none w-full max-w-none rounded-t-[28px] border-0 bg-cream p-0 text-ink backdrop:bg-black/50 lg:hidden"
            >
                <div className="flex max-h-[88dvh] flex-col">
                    <div className="flex items-center justify-between px-5 pb-2 pt-5">
                        <h2
                            id="filters-title"
                            className="text-lg font-extrabold"
                        >
                            Filtros
                        </h2>
                        <button
                            type="button"
                            aria-label="Fechar filtros"
                            onClick={() => setSheetOpen(false)}
                            className="grid size-10 place-items-center rounded-full bg-chip"
                        >
                            <svg
                                viewBox="0 0 24 24"
                                className="size-4"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.4"
                                strokeLinecap="round"
                                aria-hidden="true"
                            >
                                <path d="m6 6 12 12M18 6 6 18" />
                            </svg>
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto px-5 py-4">
                        <FiltersPanel
                            filters={filters}
                            terrainOptions={terrainOptions}
                            onChange={update}
                        />
                    </div>
                    <div className="flex items-center gap-3 border-t border-line bg-cream px-5 py-4">
                        <button
                            type="button"
                            onClick={clearFilters}
                            disabled={count === 0}
                            className="text-sm font-semibold underline disabled:text-muted disabled:no-underline"
                        >
                            Limpar
                        </button>
                        <button
                            type="button"
                            onClick={() => setSheetOpen(false)}
                            className="ml-auto min-h-12 flex-1 rounded-2xl bg-ink px-5 text-sm font-bold text-accent"
                        >
                            {data
                                ? `Ver ${data.total} ${data.total === 1 ? "instrutor" : "instrutores"}`
                                : "Ver resultados"}
                        </button>
                    </div>
                </div>
            </dialog>
        </PageFrame>
    );
}
