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
const COLORS = ["#1f4e79", "#4b5563", "#111827", "#9ca3af"];

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
  return [...points]
    .sort((a, b) => a.x - b.x)
    .map((point, index) => `${index === 0 ? "M" : "L"} ${scaleX(point.x)} ${scaleY(point.y)}`)
    .join(" ");
}

function paddedDomain(min: number, max: number): { min: number; max: number } {
  if (min === max) {
    const padding = Math.abs(min) > 0 ? Math.abs(min) * 0.1 : 1;
    return { min: min - padding, max: max + padding };
  }

  const padding = (max - min) * 0.08;
  return { min: min - padding, max: max + padding };
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
    const xDomain = paddedDomain(Math.min(...xValues), Math.max(...xValues));
    const yDomain = paddedDomain(Math.min(...yValues), Math.max(...yValues));
    const minX = xDomain.min;
    const maxX = xDomain.max;
    const minY = yDomain.min;
    const maxY = yDomain.max;
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

    if (!svg.getAttribute("xmlns")) {
      svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
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
    image.onerror = () => {
      URL.revokeObjectURL(url);
    };
    image.src = url;
  };

  return (
    <section className="min-w-0 border border-rule bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-ink">{definition.title}</h3>
          <p className="mt-1 text-xs text-slate-600">
            {definition.xLabel}
            {definition.xUnit ? ` [${definition.xUnit}]` : ""} / {definition.yLabel}
            {definition.yUnit ? ` [${definition.yUnit}]` : ""}
          </p>
          {definition.description ? (
            <p className="mt-1 text-sm leading-5 text-slate-600">
              {definition.description}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          aria-label={`${definition.title}をPNGで出力`}
          onClick={exportPng}
          disabled={allPoints.length === 0}
          className="border border-rule bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent focus:outline-none focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent disabled:opacity-40"
        >
          PNG出力
        </button>
      </div>
      <div className="mt-3 overflow-x-auto">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="min-w-[520px] border border-rule bg-white"
          role="img"
          aria-label={`${definition.title}: ${definition.xLabel}${definition.xUnit ? ` ${definition.xUnit}` : ""} と ${definition.yLabel}${definition.yUnit ? ` ${definition.yUnit}` : ""} のグラフ${definition.description ? `。${definition.description}` : ""}`}
        >
          <title>{definition.title}</title>
          <desc>
            {definition.xLabel}
            {definition.xUnit ? ` [${definition.xUnit}]` : ""} と {definition.yLabel}
            {definition.yUnit ? ` [${definition.yUnit}]` : ""} のグラフ
            {definition.description ? `。${definition.description}` : ""}
          </desc>
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
                      <path
                        d={pathFor(points, scales.scaleX, scales.scaleY)}
                        fill="none"
                        stroke={color}
                        strokeWidth="2"
                        strokeDasharray={kind === "regression" ? "5 4" : undefined}
                      />
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
        {definition.series.map((series, index) => {
          const kind = series.kind ?? definition.kind;
          const color = COLORS[index % COLORS.length];

          return (
            <span key={series.key} className="inline-flex items-center gap-1">
              {kind === "regression" ? (
                <span
                  className="inline-block h-0 w-5 border-t-2"
                  style={{ borderColor: color, borderTopStyle: "dashed" }}
                />
              ) : (
                <span
                  className="h-2.5 w-2.5 border border-rule"
                  style={{ backgroundColor: color }}
                />
              )}
              {series.label}
            </span>
          );
        })}
      </div>
    </section>
  );
}
