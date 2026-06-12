import { Button } from "@/components/ui/button";
import { haptics } from "@/lib/haptics";

interface ClearSearchButtonProps {
  onClear: () => void;
  label?: string;
}

export function ClearSearchButton({
  onClear,
  label = "Clear Search",
}: ClearSearchButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      fullWidth={false}
      className="px-3 py-2 text-xs"
      onClick={() => {
        haptics.light();
        onClear();
      }}
    >
      {label}
    </Button>
  );
}