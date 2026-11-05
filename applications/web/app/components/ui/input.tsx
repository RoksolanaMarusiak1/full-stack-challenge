import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

export function Input({ invalid = false, className = "", ...props }: InputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={`block w-full rounded-lg border-0 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm ring-1 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-inset dark:bg-gray-900 dark:text-gray-100 ${
        invalid
          ? "ring-red-400 focus:ring-red-500"
          : "ring-gray-300 focus:ring-indigo-600 dark:ring-gray-700"
      } ${className}`}
      {...props}
    />
  );
}
