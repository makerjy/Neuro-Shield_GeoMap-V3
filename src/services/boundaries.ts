import { Feature, FeatureCollection, Geometry } from "geojson";
import { Level } from "../../KoreaDrilldownMap";

const URLS: Record<Level, string> = {
  sido: "https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2018/json/skorea-provinces-2018-geo.json",
  sigungu: "https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2018/json/skorea-municipalities-2018-geo.json",
  emd: "https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2018/json/skorea-submunicipalities-2018-geo.json",
};

export const levelLabel: Record<Level, string> = {
  sido: "시/도",
  sigungu: "시/군/구",
  emd: "읍/면/동",
};

export const getFeatureName = (feature: Feature<Geometry, Record<string, any>>) => {
  return String(
    feature.properties?.name ??
      feature.properties?.CTP_KOR_NM ??
      feature.properties?.SIG_KOR_NM ??
      feature.properties?.EMD_KOR_NM ??
      "-"
  );
};

export const getFeatureCode = (feature: Feature<Geometry, Record<string, any>>) => {
  return String(
    feature.properties?.code ??
      feature.properties?.CTPRVN_CD ??
      feature.properties?.SIG_CD ??
      feature.properties?.EMD_CD ??
      ""
  );
};

export type BoundariesResponse = FeatureCollection<Geometry, Record<string, any>>;

export async function fetchBoundaries(level: Level, code?: string): Promise<BoundariesResponse> {
  const res = await fetch(URLS[level]);
  if (!res.ok) {
    throw new Error("경계 데이터를 불러오지 못했습니다.");
  }
  const json = (await res.json()) as BoundariesResponse;
  const features = (json.features ?? []) as Feature<Geometry, Record<string, any>>[];

  const filtered = level === "sido" || !code
    ? features
    : features.filter((feature) => {
        const featureCode = getFeatureCode(feature);
        return featureCode.startsWith(code);
      });

  const normalized = filtered.map((feature) => {
    const codeValue = getFeatureCode(feature);
    const nameValue = getFeatureName(feature);
    return {
      ...feature,
      id: codeValue,
      properties: {
        ...feature.properties,
        code: codeValue,
        name: nameValue,
      },
    } as Feature<Geometry, Record<string, any>>;
  });

  return {
    type: "FeatureCollection",
    features: normalized,
  } as BoundariesResponse;
}
