import React, { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { Feature, FeatureCollection, Geometry } from "geojson";
import { RegionStat } from "./dummyStats";
import { useResizeObserver } from "./useResizeObserver";

export type Level = "ctprvn" | "sig" | "emd";

export type KoreaDrilldownMapProps = {
  level: Level;
  features: Feature<Geometry, Record<string, any>>[];
  stats: RegionStat[];
  onSelect: (nextLevel: Level, code: string) => void;
  indicatorLabel?: string;
  unit?: string;
  year?: number;
  valueFormatter?: (value: number) => string;
};

const MIN_SIZE = 50;

const levelLabel: Record<Level, string> = {
  ctprvn: "시도",
  sig: "시군구",
  emd: "읍면동",
};

function getFeatureCode(level: Level, feature: Feature<Geometry, Record<string, any>>): string {
  return String(
    feature.properties?.code ??
      feature.properties?.CTPRVN_CD ??
      feature.properties?.SIG_CD ??
      feature.properties?.EMD_CD ??
      ""
  );
}

function getFeatureName(level: Level, feature: Feature<Geometry, Record<string, any>>): string {
  return String(
    feature.properties?.name ??
      feature.properties?.CTP_KOR_NM ??
      feature.properties?.SIG_KOR_NM ??
      feature.properties?.EMD_KOR_NM ??
      "-"
  );
}

export function KoreaDrilldownMap({
  level,
  features,
  stats,
  onSelect,
  indicatorLabel = "지표",
  unit = "",
  year,
  valueFormatter,
}: KoreaDrilldownMapProps) {
  const { ref, width, height } = useResizeObserver<HTMLDivElement>();
  const [tooltip, setTooltip] = useState<{ x: number; y: number; name: string; value: number; code: string } | null>(null);
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const gRef = useRef<SVGGElement | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [zoomState, setZoomState] = useState(d3.zoomIdentity);

  const statsMap = useMemo(() => {
    return new Map(stats.map((s) => [s.code, s.value]));
  }, [stats]);

  const featureCollection: FeatureCollection = useMemo(() => {
    return { type: "FeatureCollection", features } as FeatureCollection;
  }, [features]);

  const colorScale = useMemo(() => {
    const values = stats.map((s) => s.value);
    const min = values.length ? Math.min(...values) : 0;
    const max = values.length ? Math.max(...values) : 100;
    const domain = min === max ? [min - 1, max + 1] : [min, max];
    return d3
      .scaleSequential((t) => d3.interpolateBlues(0.25 + 0.75 * t))
      .domain(domain as [number, number]);
  }, [stats]);

  const projection = useMemo(() => {
    if (width < MIN_SIZE || height < MIN_SIZE || !features.length) return null;
    return d3.geoIdentity().reflectY(true).fitSize([width, height], featureCollection);
  }, [width, height, featureCollection, features.length]);

  const path = useMemo(() => {
    if (!projection) return null;
    return d3.geoPath(projection);
  }, [projection]);

  const rankedMap = useMemo(() => {
    const sorted = [...stats].sort((a, b) => b.value - a.value);
    return new Map(sorted.map((item, idx) => [item.code, idx + 1]));
  }, [stats]);

  const yoyMap = useMemo(() => {
    const map = new Map<string, number>();
    stats.forEach((item) => {
      let hash = 0;
      for (let i = 0; i < item.code.length; i += 1) {
        hash = (hash * 31 + item.code.charCodeAt(i)) >>> 0;
      }
      const delta = ((hash % 200) - 100) / 10;
      map.set(item.code, delta);
    });
    return map;
  }, [stats]);

  const labelData = useMemo(() => {
    if (!path) return [];
    return features.map((feature) => {
      const code = getFeatureCode(level, feature);
      const name = getFeatureName(level, feature);
      const [x, y] = path.centroid(feature);
      return { code, name, x, y };
    });
  }, [features, level, path]);

  const showLabels = level === "ctprvn" || level === "sig" || level === "emd";

  const applyTransform = (next: d3.ZoomTransform) => {
    if (gRef.current) {
      d3.select(gRef.current).attr("transform", next.toString());
    }
    setZoomState(next);
  };

  useEffect(() => {
    if (!svgRef.current) return;
    const zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 5])
      .on("zoom", (event) => {
        applyTransform(event.transform);
      });
    const selection = d3.select(svgRef.current);
    selection.call(zoomBehavior as any);
    zoomRef.current = zoomBehavior;
  }, [width, height]);

  const handleZoom = (direction: "in" | "out") => {
    if (!svgRef.current || !zoomRef.current) return;
    const scale = direction === "in" ? 1.2 : 0.8;
    const nextK = Math.max(1, Math.min(5, zoomState.k * scale));
    const next = d3.zoomIdentity.translate(zoomState.x, zoomState.y).scale(nextK);
    applyTransform(next);
  };

  const handleClick = (feature: Feature<Geometry, Record<string, any>>) => {
    const code = getFeatureCode(level, feature);
    if (!code) return;
    if (level === "ctprvn") onSelect("sig", code);
    else if (level === "sig") onSelect("emd", code);
  };

  return (
    <div ref={ref} style={{ position: "relative", width: "100%", height: "100%" }}>
      {width < MIN_SIZE || height < MIN_SIZE || !path ? (
        <div style={{ padding: 12, color: "#666" }}>지도 영역이 작아 렌더링을 생략합니다.</div>
      ) : (
        <svg
          ref={svgRef}
          width={width}
          height={height}
          style={{ display: "block", touchAction: "none", cursor: "grab" }}
          onWheel={(e) => {
            e.preventDefault();
            const direction = e.deltaY > 0 ? 0.9 : 1.1;
            const nextK = Math.max(1, Math.min(5, zoomState.k * direction));
            const point = d3.pointer(e, svgRef.current);
            const newX = point[0] - ((point[0] - zoomState.x) / zoomState.k) * nextK;
            const newY = point[1] - ((point[1] - zoomState.y) / zoomState.k) * nextK;
            applyTransform(d3.zoomIdentity.translate(newX, newY).scale(nextK));
          }}
        >
          <rect width={width} height={height} fill="transparent" style={{ pointerEvents: "all" }} />
          <g ref={gRef} transform={`translate(${zoomState.x}, ${zoomState.y}) scale(${zoomState.k})`}>
            {features.map((feature) => {
              const code = getFeatureCode(level, feature);
              const value = statsMap.get(code) ?? 0;
              const fill = colorScale(value);
              const d = path(feature) || undefined;
              const isHovered = hoveredCode === code;
              return (
                <path
                  key={code}
                  d={d}
                  fill={fill}
                  stroke={isHovered ? "#0f172a" : "#111827"}
                  strokeWidth={isHovered ? 1.6 : 0.8}
                  fillOpacity={hoveredCode && !isHovered ? 0.75 : 0.95}
                  onMouseMove={(e) => {
                    setTooltip({
                      x: e.clientX + 12,
                      y: e.clientY + 12,
                      name: getFeatureName(level, feature),
                      value,
                      code,
                    });
                    setHoveredCode(code);
                  }}
                  onMouseLeave={() => {
                    setTooltip(null);
                    setHoveredCode(null);
                  }}
                  onClick={() => handleClick(feature)}
                  style={{ cursor: level === "emd" ? "default" : "pointer" }}
                />
              );
            })}
            {showLabels &&
              labelData.map((label) => (
                <text
                  key={`label-${label.code}`}
                  x={label.x}
                  y={label.y}
                  fontSize={level === "ctprvn" ? 12 : 10}
                  fill="#1e3a8a"
                  textAnchor="middle"
                  pointerEvents="none"
                  style={{ paintOrder: "stroke", stroke: "#fff", strokeWidth: 3 }}
                >
                  {label.name}
                </text>
              ))}
          </g>
        </svg>
      )}

      {tooltip && (
        <div
          style={{
            position: "fixed",
            left: tooltip.x,
            top: tooltip.y,
            background: "rgba(15, 23, 42, 0.92)",
            color: "#fff",
            padding: "10px 12px",
            borderRadius: 10,
            fontSize: 12,
            pointerEvents: "none",
            zIndex: 1000,
            whiteSpace: "nowrap",
            boxShadow: "0 10px 20px rgba(15, 23, 42, 0.35)",
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>{tooltip.name}</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: "#cbd5f5" }}>{indicatorLabel}</span>
            <span style={{ fontSize: 16, fontWeight: 700 }}>
              {valueFormatter ? valueFormatter(tooltip.value) : tooltip.value}
              {!valueFormatter && unit && <span style={{ fontSize: 11, fontWeight: 500, marginLeft: 4 }}>({unit})</span>}
            </span>
          </div>
          {typeof year === "number" && <div style={{ fontSize: 11, color: "#cbd5f5" }}>기준연도: {year}년</div>}
          <div style={{ fontSize: 11, color: "#cbd5f5" }}>
            전년 대비: {yoyMap.get(tooltip.code)?.toFixed(1) ?? "-"}
          </div>
          <div style={{ fontSize: 11, color: "#cbd5f5" }}>
            랭크: {rankedMap.get(tooltip.code) ?? "-"}
          </div>
        </div>
      )}
    </div>
  );
}
