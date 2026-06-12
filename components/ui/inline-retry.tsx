import { Button } from "@/components/ui/button";

interface InlineRetryProps {
  message: string;
  onRetry: () => void | Promise<unknown>;
  retryLabel?: string;
}

export function InlineRetry({
  message,
  onRetry,
  retryLabel = "Retry",
}: InlineRetryProps) {
  return (
    <div className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-4">
      <p className="text-sm font-medium text-red-800">{message}</p>
      <Button fullWidth={false} variant="outline" onClick={onRetry}>
        {retryLabel}
      </Button>
    </div>
  );
}
