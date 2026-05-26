"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";

export type ComboboxOption = {
  value: string;
  label: string;
  parts?: string[];
};

type Props = {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Rechercher…",
  className = "",
  disabled = false,
}: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = options.find((o) => o.value === value) ?? null;

  const filtered = query.trim()
    ? options.filter((o) =>
        o.label.toLowerCase().includes(query.toLowerCase()),
      )
    : options;

  useEffect(() => {
    setActiveIndex(-1);
  }, [query]);

  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const el = listRef.current.children[activeIndex] as HTMLElement;
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  useEffect(() => {
    if (open && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: "fixed",
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      });
    }
  }, [open]);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node) &&
        listRef.current &&
        !listRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    setOpen(true);
    if (!e.target.value) onChange("");
  }

  function handleFocus() {
    setOpen(true);
    if (selected) setQuery("");
  }

  function handleSelect(option: ComboboxOption) {
    onChange(option.value);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") setOpen(true);
      return;
    }
    if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
      inputRef.current?.blur();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && filtered[activeIndex]) {
        handleSelect(filtered[activeIndex]);
      }
    }
  }

  const displayValue = selected && !open ? selected.label : query;

  const dropdown = open ? (
    <ul
      ref={listRef}
      style={dropdownStyle}
      className="max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg py-1"
    >
      {filtered.length === 0 ? (
        <li className="px-3 py-2 text-sm text-gray-400">Aucun résultat</li>
      ) : (
        filtered.map((option, i) => {
          const isSelected = option.value === value;
          const isActive = i === activeIndex;
          return (
            <li
              key={option.value}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(option);
              }}
              onMouseEnter={() => setActiveIndex(i)}
              className={`flex items-center justify-between px-3 py-2 text-sm cursor-pointer ${
                isActive
                  ? "bg-amber-600 text-white"
                  : isSelected
                    ? "bg-amber-50 text-amber-700"
                    : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span>
                {option.parts ? (
                  option.parts.map((part, pi) => (
                    <span key={pi}>
                      {pi > 0 && (
                        <span
                          className={`mx-1 text-xs ${isActive ? "text-amber-200" : "text-gray-300"}`}
                        >
                          ·
                        </span>
                      )}
                      <span
                        className={
                          pi === 0
                            ? ""
                            : `text-xs ${isActive ? "text-amber-100" : "text-gray-400"}`
                        }
                      >
                        {part}
                      </span>
                    </span>
                  ))
                ) : (
                  option.label
                )}
              </span>
              {isSelected && (
                <svg
                  className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-amber-600"}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </li>
          );
        })
      )}
    </ul>
  ) : null;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div
        className={`flex items-center rounded-lg border bg-white transition ${
          open
            ? "border-amber-500 ring-2 ring-amber-200"
            : "border-gray-300"
        } ${disabled ? "opacity-50" : ""}`}
      >
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 min-w-0 bg-transparent pl-3 pr-1 py-1.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none disabled:cursor-not-allowed"
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onMouseDown={(e) => {
            e.preventDefault();
            if (open) {
              setOpen(false);
              setQuery("");
              inputRef.current?.blur();
            } else {
              inputRef.current?.focus();
              setOpen(true);
            }
          }}
          className="px-2 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
        >
          <svg
            className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>

      {typeof window !== "undefined" &&
        dropdown &&
        createPortal(dropdown, document.body)}
    </div>
  );
}
