"use client";

import { useSearchParams } from "next/navigation";
import { SearchBar } from "@/components/topics/SearchBar";
import { StoriesBar } from "@/components/topics/StoriesBar";
import { TopicList } from "@/components/topics/TopicList";

/**
 * Pantalla principal (TKT-013, TKT-014, TKT-057): buscador, historias de
 * amigos (solo sin búsqueda activa) y lista, conectados por el texto de
 * búsqueda (vacío → tendencias, con texto → resultados).
 */
export function HomeScreen() {
  const initialQuery = useSearchParams().get("q")?.trim() ?? "";
  const q = initialQuery || undefined;

  return (
    <div className="flex flex-1 flex-col">
      <SearchBar initialValue={initialQuery} />
      {q ? null : <StoriesBar />}
      <TopicList
        q={q}
        emptyMessage={
          q ? "No se han encontrado temas con ese texto." : "Todavía no hay temas que mostrar."
        }
      />
    </div>
  );
}
