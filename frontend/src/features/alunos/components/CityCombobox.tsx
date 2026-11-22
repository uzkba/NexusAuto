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
  invalid?: boolean;
  describedBy?: string;
};

export function CityCombobox({ id, value, onChange, invalid, describedBy }: Props) {
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

  return (
    <div className="relative">
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
        placeholder="Digite pelo menos 2 letras da sua cidade"
        value={open ? query : label}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
        className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${
          invalid ? "border-red-500" : "border-gray-300"
        }`}
      />

      {open && term.length >= 2 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg"
        >
          {isFetching && (
            <li className="px-3 py-2 text-sm text-gray-500">Buscando...</li>
          )}
          {showEmpty && (
            <li className="px-3 py-2 text-sm text-gray-500">
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
              className={`cursor-pointer px-3 py-2 text-sm ${
                i === active ? "bg-blue-50" : ""
              }`}
            >
              {city.name} - {city.uf}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}