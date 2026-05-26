import type { SelectHTMLAttributes } from "react";

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  placeholder?: string;
};

export function Select({
  placeholder,
  value,
  children,
  className = "",
  ...props
}: Props) {
  const isEmpty = value === "" || value === undefined;
  return (
    <div className="relative">
      <select
        value={value}
        className={`w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-1.5 pr-8 text-sm transition
          focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200
          ${isEmpty ? "text-gray-400" : "text-gray-700"}
          ${className}`}
        {...props}
      >
        {placeholder ? (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        ) : null}
        {children}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
        <svg
          className="w-4 h-4"
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
      </div>
    </div>
  );
}
