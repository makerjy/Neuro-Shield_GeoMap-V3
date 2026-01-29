import { Feature, Geometry } from "geojson";
import { Indicator, indicatorById } from "../config/indicators";
import { getFeatureCode, getFeatureName } from "./boundaries";

export type MetricPoint = {
  code: string;
  name: string;
  value: number;
  yoy: number;
  rank: number;
};

export type RegionSeriesPoint = {
  year: number;
  value: number;
};

const hashSeed = (input: string) => {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
};

const valueFromHash = (hash: number, indicator: Indicator) => {
  const [min, max] = indicator.scale;
  const ratio = (hash % 1000) / 1000;
  return min + (max - min) * ratio;
};

export const buildMetrics = (
  features: Feature<Geometry, Record<string, any>>[],
  indicatorId: string,
  year: number
): MetricPoint[] => {
  const indicator = indicatorById(indicatorId);
  const points = features.map((feature) => {
    const code = getFeatureCode(feature);
    const name = getFeatureName(feature);
    const hash = hashSeed(`${code}-${indicatorId}-${year}`);
    const prevHash = hashSeed(`${code}-${indicatorId}-${year - 1}`);
    const value = valueFromHash(hash, indicator);
    const prevValue = valueFromHash(prevHash, indicator);
    const yoy = value - prevValue;
    return { code, name, value, yoy, rank: 0 };
  });

  const sorted = [...points].sort((a, b) => b.value - a.value);
  sorted.forEach((item, idx) => {
    item.rank = idx + 1;
  });
  return points;
};

export const buildRegionSeries = (code: string, indicatorId: string, years: number[]) => {
  const indicator = indicatorById(indicatorId);
  return years.map((year) => {
    const hash = hashSeed(`${code}-${indicatorId}-${year}`);
    return {
      year,
      value: valueFromHash(hash, indicator),
    } satisfies RegionSeriesPoint;
  });
};

export const buildComposition = (code: string) => {
  const hash = hashSeed(code);
  const primary = 40 + (hash % 40);
  const secondary = 100 - primary;
  return [
    { name: "위험군", value: primary },
    { name: "관찰군", value: secondary },
  ];
};
