"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import type { ComboboxOption } from "./Combobox";

type Props = {
  options: ComboboxOption[];
  values: string[];
  onValuesChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

export function MultiCombobox({
  options,
  values,
  onValuesChange,
  placeholder = "Sélectionner…",
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

  const selectedOptions = useMemo(() => {
    const map = new Map(options.map((o) => [o.value, o]));
    return values
      .map((v) => map.get(v))
      .filter((o): o is ComboboxOption => Boolean(o));
  }, [options, values]);

  const availableOptions = useMemo(() => {
    const set = new Set(values);
    return options.filter((o) => !set.has(o.value));
  }, [options, values]);

  const filtered = query.trim()
    ? availableOptions.filter((o) =>
        o.label.toLowerCase().includes(query.toLowerCase()),
      )
    : availableOptions;

  useEffect(() => {
    setActiveIndex(-1);
  }, [query, values.length]);

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
  }, [open, values.length]);

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

  function handleSelect(option: ComboboxOption) {
    onValuesChange([...values, option.value]);
    setQuery("");
    setActiveIndex(-1);
    inputRef.current?.focus();
  }

  function removeValue(value: string) {
    onValuesChange(values.filter((v) => v !== value));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (
      e.key === "Backspace" &&
      query === "" &&
      values.length > 0
    ) {
      e.preventDefault();
      onValuesChange(values.slice(0, -1));
      return;
    }
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

  const dropdown = open ? (
    <ul
      ref={listRef}
      style={dropdownStyle}
      className="max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg py-1"
    >
      {filtered.length === 0 ? (
        <li className="px-3 py-2 text-sm text-gray-400">
          {availableOptions.length === 0
            ? "Toutes les options sont sélectionnées"
            : "Aucun résultat"}
        </li>
      ) : (
        filtered.map((option, i) => {
          const isActive = i === activeIndex;
          return (
            <li
              key={option.value}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(option);
              }}
              onMouseEnter={() => setActiveIndex(i)}
              className={`flex items-center px-3 py-2 text-sm cursor-pointer ${
                isActive ? "bg-amber-600 text-white" : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {option.label}
            </li>
          );
        })
      )}
    </ul>
  ) : null;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div
        className={`flex flex-wrap gap-1.5 items-center rounded-lg border bg-white transition px-2 py-1 cursor-text ${
          open
            ? "border-amber-500 ring-2 ring-amber-200"
            : "border-gray-300"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        onClick={() => {
          if (!disabled) inputRef.current?.focus();
        }}
      >
        {selectedOptions.map((opt) => (
          <span
            key={opt.value}
            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-amber-700 text-amber-50"
          >
            {opt.label}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeValue(opt.value);
              }}
              className="cursor-pointer hover:text-amber-100 leading-none text-sm disabled:cursor-not-allowed"
              aria-label={`Retirer ${opt.label}`}
              disabled={disabled}
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onMouseDown={() => {
            if (!disabled) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={values.length === 0 ? placeholder : ""}
          disabled={disabled}
          className="flex-1 min-w-20 bg-transparent py-0.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none disabled:cursor-not-allowed"
        />
      </div>
      {typeof window !== "undefined" &&
        dropdown &&
        createPortal(dropdown, document.body)}
    </div>
  );
}
