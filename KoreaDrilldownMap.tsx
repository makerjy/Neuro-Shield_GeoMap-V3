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
}: KoreaDrilldownMapProps) {
  const { ref, width, height } = useResizeObserver<HTMLDivElement>();
  const [tooltip, setTooltip] = useState<{ x: number; y: number; name: string; value: number; code: string } | null>(null);
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
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
    return d3.scaleSequential(d3.interpolateBlues).domain(domain as [number, number]);
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

  const showLabels =
    level === "ctprvn" ||
    (level === "sig" && zoomState.k >= 1.2) ||
    (level === "emd" && zoomState.k >= 1.8);

  useEffect(() => {
    if (!svgRef.current) return;
    const zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 5])
      .on("zoom", (event) => {
        setZoomState(event.transform);
      });
    d3.select(svgRef.current).call(zoomBehavior as any);
    zoomRef.current = zoomBehavior;
  }, [width, height]);

  const handleZoom = (direction: "in" | "out") => {
    if (!svgRef.current || !zoomRef.current) return;
    const scale = direction === "in" ? 1.2 : 0.8;
    d3.select(svgRef.current).transition().call(zoomRef.current.scaleBy as any, scale);
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
        <svg ref={svgRef} width={width} height={height} style={{ display: "block" }}>
          <g transform={`translate(${zoomState.x}, ${zoomState.y}) scale(${zoomState.k})`}>
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
                  stroke={isHovered ? "#2563eb" : "#ffffff"}
                  strokeWidth={isHovered ? 2 : 0.7}
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

      <div
        style={{
          position: "absolute",
          right: 10,
          top: 10,
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <button
          type="button"
          onClick={() => handleZoom("in")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") handleZoom("in");
          }}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            background: "#ffffff",
            cursor: "pointer",
            fontWeight: 700,
          }}
          aria-label="줌인"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => handleZoom("out")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") handleZoom("out");
          }}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            background: "#ffffff",
            cursor: "pointer",
            fontWeight: 700,
          }}
          aria-label="줌아웃"
        >
          -
        </button>
      </div>

      {tooltip && (
        <div
          style={{
            position: "fixed",
            left: tooltip.x,
            top: tooltip.y,
            background: "rgba(15, 23, 42, 0.85)",
            color: "#fff",
            padding: "6px 8px",
            borderRadius: 6,
            fontSize: 12,
            pointerEvents: "none",
            zIndex: 1000,
            whiteSpace: "nowrap",
          }}
        >
          <div style={{ fontWeight: 600 }}>{tooltip.name}</div>
          <div>
            코드: {tooltip.code}
          </div>
          <div>
            {indicatorLabel}: <strong>{tooltip.value}</strong> {unit && <span>({unit})</span>}
          </div>
          {typeof year === "number" && <div>기준연도: {year}년</div>}
          <div>
            전년 대비: {yoyMap.get(tooltip.code)?.toFixed(1) ?? "-"}
          </div>
          <div>
            랭크: {rankedMap.get(tooltip.code) ?? "-"}
          </div>
        </div>
      )}
    </div>
  );
}
