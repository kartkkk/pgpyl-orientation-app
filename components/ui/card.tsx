interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  interactive?: boolean;
}

export function Card({
  className = "",
  children,
  interactive = false,
  ...props
}: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-border bg-white p-4 shadow-sm ${
        interactive
          ? "transition-[transform,background-color,box-shadow] duration-150 active:scale-[0.995] active:bg-gray-50"
          : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
