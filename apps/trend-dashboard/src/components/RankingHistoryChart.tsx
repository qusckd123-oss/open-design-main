type RankingHistoryChartProps = {
  data: {
    rank: number;
    collectedAt: Date;
  }[];
};

export function RankingHistoryChart({ data }: RankingHistoryChartProps) {
  if (data.length === 0) return null;

  const width = 920;
  const height = 300;
  const padding = 36;
  const maxRank = Math.max(...data.map((point) => point.rank), 100);
  const minRank = Math.min(...data.map((point) => point.rank), 1);
  const rankRange = Math.max(maxRank - minRank, 1);
  const xStep = data.length > 1 ? (width - padding * 2) / (data.length - 1) : 0;

  const points = data.map((point, index) => {
    const x = padding + index * xStep;
    const y = padding + ((point.rank - minRank) / rankRange) * (height - padding * 2);
    return { ...point, x, y };
  });
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");

  return (
    <div className="overflow-hidden rounded border border-line bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold">Ranking History</h2>
        <span className="text-sm text-muted">낮은 숫자일수록 상위 랭킹</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[300px] w-full">
        <line x1={padding} x2={width - padding} y1={padding} y2={padding} stroke="#E6E8EC" />
        <line x1={padding} x2={width - padding} y1={height - padding} y2={height - padding} stroke="#E6E8EC" />
        <path d={path} fill="none" stroke="#0D9488" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((point) => (
          <g key={point.collectedAt.toISOString()}>
            <circle cx={point.x} cy={point.y} r="4" fill="#0D9488" />
            <text x={point.x} y={height - 12} textAnchor="middle" fontSize="11" fill="#667085">
              {new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric" }).format(point.collectedAt)}
            </text>
            <text x={point.x} y={point.y - 10} textAnchor="middle" fontSize="11" fill="#17202A">
              {point.rank}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
