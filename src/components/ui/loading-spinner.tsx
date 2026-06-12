interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-[3px]",
};

export function LoadingSpinner({ size = "md", className = "" }: LoadingSpinnerProps) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-primary-500 border-t-transparent ${sizeClasses[size]} ${className}`}
    />
  );
}

export function FullScreenLoader() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}
