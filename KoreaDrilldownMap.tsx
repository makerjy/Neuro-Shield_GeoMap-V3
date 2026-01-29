import React, { useMemo, useState } from "react";
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

export function KoreaDrilldownMap({ level, features, stats, onSelect }: KoreaDrilldownMapProps) {
  const { ref, width, height } = useResizeObserver<HTMLDivElement>();
  const [tooltip, setTooltip] = useState<{ x: number; y: number; name: string; value: number } | null>(null);

  const statsMap = useMemo(() => {
    return new Map(stats.map((s) => [s.code, s.value]));
  }, [stats]);

  const featureCollection: FeatureCollection = useMemo(() => {
    return { type: "FeatureCollection", features } as FeatureCollection;
  }, [features]);

  const colorScale = useMemo(() => {
    // scale calculation: domain uses min/max of current level values
    const values = stats.map((s) => s.value);
    const min = values.length ? Math.min(...values) : 0;
    const max = values.length ? Math.max(...values) : 100;
    const domain = min === max ? [min - 1, max + 1] : [min, max];
    return d3.scaleSequential(d3.interpolateOrRd).domain(domain as [number, number]);
  }, [stats]);

  const projection = useMemo(() => {
    if (width < MIN_SIZE || height < MIN_SIZE || !features.length) return null;

    // geoIdentity + fitSize keeps projected coordinates stable for local Korean boundary data
    return d3.geoIdentity().reflectY(true).fitSize([width, height], featureCollection);
  }, [width, height, featureCollection, features.length]);

  const path = useMemo(() => {
    if (!projection) return null;
    return d3.geoPath(projection);
  }, [projection]);

  const handleClick = (feature: Feature<Geometry, Record<string, any>>) => {
    const code = getFeatureCode(level, feature);
    if (!code) return;

    // drilldown logic: 시도 -> 시군구 -> 읍면동
    if (level === "ctprvn") onSelect("sig", code);
    else if (level === "sig") onSelect("emd", code);
  };

  return (
    <div ref={ref} style={{ position: "relative", width: "100%", height: "100%" }}>
      {width < MIN_SIZE || height < MIN_SIZE || !path ? (
        <div style={{ padding: 12, color: "#666" }}>지도 영역이 작아 렌더링을 생략합니다.</div>
      ) : (
        <svg width={width} height={height} style={{ display: "block" }}>
          <g>
            {features.map((feature) => {
              const code = getFeatureCode(level, feature);
              const value = statsMap.get(code) ?? 0;
              const fill = colorScale(value);
              const d = path(feature) || undefined;
              return (
                <path
                  key={code}
                  d={d}
                  fill={fill}
                  stroke="#ffffff"
                  strokeWidth={0.7}
                  onMouseMove={(e) => {
                    setTooltip({
                      x: e.clientX + 12,
                      y: e.clientY + 12,
                      name: getFeatureName(level, feature),
                      value,
                    });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                  onClick={() => handleClick(feature)}
                  style={{ cursor: level === "emd" ? "default" : "pointer" }}
                />
              );
            })}
          </g>
        </svg>
      )}

      {tooltip && (
        <div
          style={{
            position: "fixed",
            left: tooltip.x,
            top: tooltip.y,
            background: "rgba(0, 0, 0, 0.75)",
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
            {levelLabel[level]} 지표: <strong>{tooltip.value}</strong>
          </div>
        </div>
      )}
    </div>
  );
}
