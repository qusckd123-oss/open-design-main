import { statusClass, statusLabel } from "@/lib/format";
import type { TrendStatus } from "@/types/trend";

export function StatusBadge({ status }: { status: TrendStatus }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded border px-2 py-1 text-xs font-medium ${statusClass(status)}`}>
      {statusLabel(status)}
    </span>
  );
}
