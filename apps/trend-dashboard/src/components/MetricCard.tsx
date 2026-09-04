type MetricCardProps = {
  label: string;
  value: string;
  note?: string;
};

export function MetricCard({ label, value, note }: MetricCardProps) {
  return (
    <div className="rounded border border-line bg-panel p-5 shadow-subtle">
      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{label}</div>
      <div className="mt-4 text-3xl font-semibold text-ink">{value}</div>
      {note ? <div className="mt-2 text-sm text-muted">{note}</div> : null}
    </div>
  );
}
