import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ label, error, helperText, className = "", id, ...props }, ref) {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-foreground"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full rounded-xl border px-3.5 py-3.5 text-sm transition-colors placeholder:text-muted focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 ${
            error ? "border-error" : "border-border"
          } ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-error">{error}</p>}
        {helperText && !error && (
          <p className="text-xs text-muted">{helperText}</p>
        )}
      </div>
    );
  },
);
