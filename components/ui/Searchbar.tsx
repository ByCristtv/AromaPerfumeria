"use client";

import { useState, useEffect, useRef } from "react";

const DEBOUNCE_MS = 350;

type Props = {
  onSearch?: (query: string) => void;
  placeholder?: string;
};

export default function Searchbar({
  onSearch,
  placeholder = "Buscar perfumes...",
}: Props) {
  const [query, setQuery] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Edge case: if the input is completely empty, reset immediately
    // without waiting for the debounce timer.
    if (query.trim() === "") {
      if (timerRef.current) clearTimeout(timerRef.current);
      onSearch?.("");
      return;
    }

    // Debounce: wait DEBOUNCE_MS after the user stops typing before
    // firing the search callback. Each keystroke resets the timer.
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onSearch?.(query.trim());
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, onSearch]);

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow duration-300 focus-within:ring-2 focus-within:ring-black focus-within:ring-offset-1">
        {/* Search Icon (decorative) */}
        <div className="pl-4 text-gray-400">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </div>

        {/* Input */}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-2 py-3 text-sm text-gray-900 placeholder-gray-500 outline-none bg-transparent"
        />

        {/* Clear button — visible only when there's text */}
        {query.length > 0 && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="flex items-center justify-center px-3 py-3 text-gray-400 hover:text-gray-700 transition-colors"
            aria-label="Limpiar búsqueda"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
