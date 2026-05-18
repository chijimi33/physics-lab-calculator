"use client";

import { useMemo, useRef } from "react";
import type { GraphDefinition, GraphSeriesData } from "@/src/experiments";

type GraphCardProps = {
  definition: GraphDefinition;
  data?: GraphSeriesData;
};

const WIDTH = 640;
const HEIGHT = 360;
const PADDING = 48;
const COLORS = ["#2563eb", "#dc2626", "#16a34a", "#9333ea"];

function finitePoints(data: GraphSeriesData | undefined, keys: string[]) {
  return keys.flatMap((key) =>
    (data?.[key] ?? []).filter(
      (point) => Number.isFinite(point.x) && Number.isFinite(point.y),
    ),
  );
}

function pathFor(
  points: Array<{ x: number; y: number }>,
  scaleX: (value: number) => number,
  scaleY: (value: number) => number,
) {
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${scaleX(point.x)} ${scaleY(point.y)}`)
    .join(" ");
}

export function GraphCard({ definition, data }: GraphCardProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const seriesKeys = definition.series.map((series) => series.key);
  const allPoints = finitePoints(data, seriesKeys);
  const scales = useMemo(() => {
    if (allPoints.length === 0) {
      return null;
    }

    const xValues = allPoints.map((point) => point.x);
    const yValues = allPoints.map((point) => point.y);
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const minY = Math.min(...yValues);
    const maxY = Math.max(...yValues);
    const xSpan = maxX - minX || 1;
    const ySpan = maxY - minY || 1;

    return {
      minX,
      maxX,
      minY,
      maxY,
      scaleX: (value: number) => PADDING + ((value - minX) / xSpan) * (WIDTH - PADDING * 1.6),
      scaleY: (value: number) => HEIGHT - PADDING - ((value - minY) / ySpan) * (HEIGHT - PADDING * 1.6),
    };
  }, [allPoints]);

  const exportPng = () => {
    const svg = svgRef.current;
    if (!svg) {
      return;
    }

    const source = new XMLSerializer().serializeToString(svg);
    const image = new Image();
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = WIDTH;
      canvas.height = HEIGHT;
      const context = canvas.getContext("2d");
      if (!context) {
        URL.revokeObjectURL(url);
        return;
      }
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, WIDTH, HEIGHT);
      context.drawImage(image, 0, 0);
      URL.revokeObjectURL(url);
      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = pngUrl;
      link.download = `${definition.id}.png`;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      link.remove();
    };
    image.src = url;
  };

  return (
    <section className="rounded border border-rule bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-ink">{definition.title}</h3>
          <p className="mt-1 text-xs text-slate-600">
            {definition.xLabel}
            {definition.xUnit ? ` [${definition.xUnit}]` : ""} / {definition.yLabel}
            {definition.yUnit ? ` [${definition.yUnit}]` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={exportPng}
          disabled={allPoints.length === 0}
          className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent disabled:opacity-40"
        >
          PNG出力
        </button>
      </div>
      <div className="mt-3 overflow-x-auto">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="min-w-[520px] rounded border border-slate-200 bg-white"
          role="img"
          aria-label={definition.title}
        >
          <line x1={PADDING} y1={HEIGHT - PADDING} x2={WIDTH - PADDING / 2} y2={HEIGHT - PADDING} stroke="#94a3b8" />
          <line x1={PADDING} y1={PADDING / 2} x2={PADDING} y2={HEIGHT - PADDING} stroke="#94a3b8" />
          <text x={WIDTH / 2} y={HEIGHT - 12} textAnchor="middle" fontSize="13" fill="#334155">
            {definition.xLabel}{definition.xUnit ? ` [${definition.xUnit}]` : ""}
          </text>
          <text x={18} y={HEIGHT / 2} textAnchor="middle" fontSize="13" fill="#334155" transform={`rotate(-90 18 ${HEIGHT / 2})`}>
            {definition.yLabel}{definition.yUnit ? ` [${definition.yUnit}]` : ""}
          </text>
          {scales ? (
            <>
              <text x={PADDING} y={HEIGHT - PADDING + 18} fontSize="11" fill="#64748b">{scales.minX.toPrecision(3)}</text>
              <text x={WIDTH - PADDING} y={HEIGHT - PADDING + 18} fontSize="11" fill="#64748b" textAnchor="end">{scales.maxX.toPrecision(3)}</text>
              <text x={PADDING - 8} y={HEIGHT - PADDING} fontSize="11" fill="#64748b" textAnchor="end">{scales.minY.toPrecision(3)}</text>
              <text x={PADDING - 8} y={PADDING / 2 + 4} fontSize="11" fill="#64748b" textAnchor="end">{scales.maxY.toPrecision(3)}</text>
              {definition.series.map((series, index) => {
                const points = (data?.[series.key] ?? []).filter(
                  (point) => Number.isFinite(point.x) && Number.isFinite(point.y),
                );
                const kind = series.kind ?? definition.kind;
                const color = COLORS[index % COLORS.length];
                return (
                  <g key={series.key}>
                    {kind === "line" || kind === "regression" || kind === "residual" ? (
                      <path d={pathFor(points, scales.scaleX, scales.scaleY)} fill="none" stroke={color} strokeWidth="2" />
                    ) : null}
                    {points.map((point, pointIndex) => (
                      <circle
                        key={`${series.key}-${pointIndex}`}
                        cx={scales.scaleX(point.x)}
                        cy={scales.scaleY(point.y)}
                        r={kind === "regression" ? 0 : 3.5}
                        fill={color}
                      />
                    ))}
                  </g>
                );
              })}
            </>
          ) : (
            <text x={WIDTH / 2} y={HEIGHT / 2} textAnchor="middle" fontSize="14" fill="#64748b">
              グラフ表示には有効な測定値が必要です
            </text>
          )}
        </svg>
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-600">
        {definition.series.map((series, index) => (
          <span key={series.key} className="inline-flex items-center gap-1">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            {series.label}
          </span>
        ))}
      </div>
    </section>
  );
}
