"use client";

import { useState } from "react";

type AuthFieldProps = {
  id: string;
  name: string;
  label: string;
  type?: "email" | "password" | "text";
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  minLength?: number;
  hint?: string;
};

function EnvelopeIcon() {
  return (
    <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="4" width="16" height="12" rx="2" />
      <path d="M2 6l8 5 8-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="4" y="9" width="12" height="9" rx="2" />
      <path d="M7 9V6a3 3 0 0 1 6 0v3" strokeLinecap="round" />
    </svg>
  );
}

export default function AuthField({
  id,
  name,
  label,
  type = "text",
  placeholder,
  required,
  autoComplete,
  minLength,
  hint,
}: AuthFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-neutral-700 mb-2">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
          {type === "email" ? <EnvelopeIcon /> : isPassword ? <LockIcon /> : null}
        </span>
        <input
          id={id}
          name={name}
          type={inputType}
          required={required}
          autoComplete={autoComplete}
          minLength={minLength}
          placeholder={placeholder}
          className={`w-full pl-10 ${isPassword ? "pr-16" : "pr-4"} py-3 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-flow-blue/30 focus:border-flow-blue transition placeholder:text-neutral-400`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold uppercase tracking-wide text-flow-blue hover:text-flow-blue/80 transition"
          >
            {showPassword ? "Masquer" : "Voir"}
          </button>
        )}
      </div>
      {hint && <p className="text-xs text-neutral-500 mt-1.5">{hint}</p>}
    </div>
  );
}
