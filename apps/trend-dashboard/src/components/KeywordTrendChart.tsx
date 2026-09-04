import { searchTrendConfig } from "@/lib/search-trend-config";
import type { SearchTrendAgeGroup } from "@/types/search-trend";

type ChartData = Record<SearchTrendAgeGroup, { period: Date; ratio: number }[]>;

export function KeywordTrendChart({ data }: { data: ChartData }) {
  const width = 920;
  const height = 320;
  const padding = 38;
  const colors: Record<SearchTrendAgeGroup, string> = {
    ALL: "#111827",
    "13-18": "#0D9488",
    "19-24": "#2563EB",
    "25-29": "#C2410C"
  };

  return (
    <div className="overflow-hidden rounded border border-line bg-white p-5 shadow-subtle">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold">Recent Search History</h2>
        <div className="flex gap-3 text-xs text-muted">
          {searchTrendConfig.ageGroups.map((ageGroup) => (
            <span key={ageGroup} className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ background: colors[ageGroup] }} />
              {ageGroup}
            </span>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[320px] w-full">
        <line x1={padding} x2={width - padding} y1={height - padding} y2={height - padding} stroke="#E6E8EC" />
        <line x1={padding} x2={width - padding} y1={padding} y2={padding} stroke="#E6E8EC" />
        {searchTrendConfig.ageGroups.map((ageGroup) => {
          const series = data[ageGroup];
          const xStep = series.length > 1 ? (width - padding * 2) / (series.length - 1) : 0;
          const points = series.map((point, index) => ({
            x: padding + index * xStep,
            y: padding + ((100 - point.ratio) / 100) * (height - padding * 2),
            ...point
          }));
          const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
          return (
            <g key={ageGroup}>
              <path d={path} fill="none" stroke={colors[ageGroup]} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
              {points.map((point, index) =>
                index === points.length - 1 ? <circle key={point.period.toISOString()} cx={point.x} cy={point.y} r="4" fill={colors[ageGroup]} /> : null
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
