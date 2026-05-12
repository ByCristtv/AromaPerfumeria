"use client";

import { useState } from "react";

type Props = {
  onSearch?: (query: string) => void;
  placeholder?: string;
};

export default function Searchbar({
  onSearch,
  placeholder = "Buscar perfumes...",
}: Props) {
  const [query, setQuery] = useState("");

  const handleSearch = () => {
    if (onSearch) {
      onSearch(query);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow duration-300 focus-within:ring-2 focus-within:ring-black focus-within:ring-offset-1">
        {/* Input */}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="flex-1 px-4 py-3 text-sm text-gray-900 placeholder-gray-500 outline-none bg-transparent"
        />

        {/* Search Button */}
        <button
          onClick={handleSearch}
          className="flex items-center justify-center px-4 py-3 bg-black text-white hover:bg-gray-800 transition duration-200 active:scale-95"
          aria-label="Buscar"
        >
          {/* Magnifying Glass Icon */}
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
        </button>
      </div>
    </div>
  );
}
