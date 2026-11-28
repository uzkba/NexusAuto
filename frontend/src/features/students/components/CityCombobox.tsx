import { useEffect, useId, useState } from "react";
import type { KeyboardEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchCities } from "../api";
import type { City } from "../schema";

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

type Props = {
  id?: string;
  value: City | null;
  onChange: (city: City) => void;
  onClear?: () => void;
  invalid?: boolean;
  describedBy?: string;
  placeholder?: string;
  variant?: "default" | "hero"; // novo
};

export function CityCombobox({
  id,
  value,
  onChange,
  onClear,
  invalid,
  describedBy,
  placeholder,
  variant = "default",
}: Props) {
  const hero = variant === "hero";
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const term = useDebounced(query.trim(), 300);
  const { data: results = [], isFetching } = useQuery({
    queryKey: ["cities", term],
    queryFn: ({ signal }) => searchCities(term, signal),
    enabled: open && term.length >= 2,
    staleTime: 5 * 60_000,
  });

  const label = value ? `${value.name} - ${value.uf}` : "";

  function select(city: City) {
    onChange(city);
    setOpen(false);
    setQuery("");
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && open && results[active]) {
      e.preventDefault(); // não envia o formulário
      select(results[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const showEmpty = open && term.length >= 2 && !isFetching && results.length === 0;

  const inputClass = hero
    ? "h-14 w-full rounded-2xl border-0 bg-white pl-12 pr-12 text-base font-medium text-ink shadow-lg shadow-black/25 outline-none placeholder:font-normal placeholder:text-soft focus:ring-4 focus:ring-accent/70"
    : `w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${
        invalid ? "border-red-500" : "border-gray-300"
      }`;

  const listClass = hero
    ? "absolute z-10 mt-2 max-h-64 w-full overflow-auto rounded-2xl border border-line bg-white py-1 text-ink shadow-xl"
    : "absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg";

  const optionClass = (i: number) =>
    `cursor-pointer text-sm ${hero ? "px-4 py-3" : "px-3 py-2"} ${
      i === active ? (hero ? "bg-chip" : "bg-blue-50") : ""
    }`;

  return (
    <div className="relative">
      {hero && (
        <svg
          viewBox="0 0 24 24"
          className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-soft"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          aria-hidden="true"
        >
          <path d="M20 10.2c0 5.6-8 11.8-8 11.8S4 15.8 4 10.2a8 8 0 0 1 16 0Z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      )}

      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-invalid={invalid}
        aria-describedby={describedBy}
        autoComplete="off"
        placeholder={placeholder ?? "Digite pelo menos 2 letras da sua cidade"}
        value={open ? query : label}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
        className={inputClass}
      />

      {hero && onClear && value && !open && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Limpar cidade"
          className="absolute right-2 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full text-soft hover:bg-chip hover:text-ink"
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
      )}

      {open && term.length >= 2 && (
        <ul id={listId} role="listbox" className={listClass}>
          {isFetching && (
            <li className={`${hero ? "px-4 py-3" : "px-3 py-2"} text-sm text-gray-500`}>
              Buscando...
            </li>
          )}
          {showEmpty && (
            <li className={`${hero ? "px-4 py-3" : "px-3 py-2"} text-sm text-gray-500`}>
              Nenhuma cidade encontrada.
            </li>
          )}
          {results.map((city, i) => (
            <li
              key={city.ibge_code}
              role="option"
              aria-selected={value?.ibge_code === city.ibge_code}
              // mouseDown + preventDefault evita o blur do input antes do clique
              onMouseDown={(e) => {
                e.preventDefault();
                select(city);
              }}
              onMouseEnter={() => setActive(i)}
              className={optionClass(i)}
            >
              {city.name} - {city.uf}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}