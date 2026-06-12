import { forwardRef } from "react";

type ButtonVariant = "primary" | "outline" | "ghost" | "destructive";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary-500 text-white active:bg-primary-600 disabled:bg-primary-300",
  outline:
    "border border-border text-foreground active:bg-gray-50 disabled:opacity-50",
  ghost:
    "text-foreground active:bg-gray-50 disabled:opacity-50",
  destructive:
    "bg-error text-white active:bg-red-600 disabled:bg-red-300",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = "primary", loading, fullWidth = true, className = "", children, disabled, ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
          fullWidth ? "w-full" : ""
        } ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {loading ? (
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          children
        )}
      </button>
    );
  },
);
