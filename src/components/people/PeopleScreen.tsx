"use client";

import { useSearchParams } from "next/navigation";
import { PeopleList } from "@/components/people/PeopleList";
import { SearchBar } from "@/components/topics/SearchBar";

/**
 * Pantalla Personas (TKT-038, HU-13): buscador + lista, conectados por el
 * texto de búsqueda (vacío → todas, con texto → filtradas por nombre).
 */
export function PeopleScreen() {
  const initialQuery = useSearchParams().get("q")?.trim().slice(0, 100) ?? "";
  const q = initialQuery || undefined;

  return (
    <div className="flex flex-1 flex-col">
      <SearchBar
        initialValue={initialQuery}
        placeholder="Buscar personas…"
        ariaLabel="Buscar personas"
      />
      <PeopleList
        q={q}
        emptyMessage={
          q
            ? "No se han encontrado personas con ese texto."
            : "Todavía no hay personas que mostrar."
        }
      />
    </div>
  );
}
