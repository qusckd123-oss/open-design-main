import type { TrendStatus } from "@/types/trend";

export function formatCurrency(value: number | null | undefined) {
  if (value == null) return "-";
  return `${value.toLocaleString("ko-KR")}원`;
}

export function formatNumber(value: number | null | undefined) {
  if (value == null) return "-";
  return value.toLocaleString("ko-KR");
}

export function formatPercentValue(value: number | null | undefined, digits = 1) {
  if (value == null || Number.isNaN(value)) return "-";
  return `${value.toFixed(digits)}%`;
}

export function formatChange(value: number | null | undefined) {
  if (value == null) return "-";
  if (value > 0) return `▲ ${value}`;
  if (value < 0) return `▼ ${Math.abs(value)}`;
  return "0";
}

export function formatPercentChange(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "-";
  if (value > 0) return `+${value.toFixed(1)}%`;
  return `${value.toFixed(1)}%`;
}

export function formatDateTime(value: Date | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(value);
}

export function formatDate(value: Date | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(value);
}

export function statusLabel(status: TrendStatus) {
  const labels: Record<TrendStatus, string> = {
    SURGING: "급상승",
    NEW_ENTRY: "신규진입",
    STEADY_RISING: "지속상승",
    STABLE: "유지",
    DECLINING: "하락",
    INSUFFICIENT_DATA: "데이터 부족"
  };
  return labels[status];
}

export function statusClass(status: TrendStatus) {
  const classes: Record<TrendStatus, string> = {
    SURGING: "bg-emerald-50 text-emerald-700 border-emerald-200",
    NEW_ENTRY: "bg-blue-50 text-blue-700 border-blue-200",
    STEADY_RISING: "bg-teal-50 text-teal-700 border-teal-200",
    STABLE: "bg-slate-50 text-slate-700 border-slate-200",
    DECLINING: "bg-orange-50 text-orange-700 border-orange-200",
    INSUFFICIENT_DATA: "bg-zinc-50 text-zinc-700 border-zinc-200"
  };
  return classes[status];
}
