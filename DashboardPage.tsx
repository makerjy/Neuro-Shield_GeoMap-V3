import React, { useEffect, useMemo, useState } from "react";
import { Feature, FeatureCollection, Geometry } from "geojson";
import { KoreaDrilldownMap, Level } from "./KoreaDrilldownMap";
import { generateDummyStats, RegionStat } from "./dummyStats";

const CT_PRVN_URL =
  "https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2018/json/skorea-provinces-2018-geo.json";
const SIG_URL =
  "https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2018/json/skorea-municipalities-2018-geo.json";
const EMD_URL =
  "https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2018/json/skorea-submunicipalities-2018-geo.json";

const levelLabel: Record<Level, string> = {
  ctprvn: "시도",
  sig: "시군구",
  emd: "읍면동",
};

const indicatorLabel = "행정 우선관리 지표";
const indicatorDesc = "센터 업무 부담 추정 (행정용 지표)";

type GeoState = FeatureCollection | null;

function getFeatureName(level: Level, feature: Feature<Geometry, Record<string, any>>): string {
  return String(
    feature.properties?.name ??
      feature.properties?.CTP_KOR_NM ??
      feature.properties?.SIG_KOR_NM ??
      feature.properties?.EMD_KOR_NM ??
      "-"
  );
}

function getFeatureCode(level: Level, feature: Feature<Geometry, Record<string, any>>): string {
  return String(
    feature.properties?.code ??
      feature.properties?.CTPRVN_CD ??
      feature.properties?.SIG_CD ??
      feature.properties?.EMD_CD ??
      ""
  );
}

export function DashboardPage() {
  const [level, setLevel] = useState<Level>("ctprvn");
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [ctprvnGeo, setCtprvnGeo] = useState<GeoState>(null);
  const [sigGeo, setSigGeo] = useState<GeoState>(null);
  const [emdGeo, setEmdGeo] = useState<GeoState>(null);
  const [stats, setStats] = useState<RegionStat[]>([]);

  useEffect(() => {
    const load = async () => {
      const [ctprvnRes, sigRes, emdRes] = await Promise.all([
        fetch(CT_PRVN_URL),
        fetch(SIG_URL),
        fetch(EMD_URL),
      ]);
      const [ctprvnJson, sigJson, emdJson] = await Promise.all([
        ctprvnRes.json(),
        sigRes.json(),
        emdRes.json(),
      ]);
      setCtprvnGeo(ctprvnJson);
      setSigGeo(sigJson);
      setEmdGeo(emdJson);
    };

    load();
  }, []);

  const currentFeatures = useMemo(() => {
    // geo filtering: selectedCode prefix determines which level to show
    if (level === "ctprvn") return (ctprvnGeo?.features ?? []) as Feature<Geometry, any>[];
    if (level === "sig") {
      if (!selectedCode) return [];
      return (sigGeo?.features ?? []).filter(
        (f: Feature<Geometry, any>) => String(f.properties?.code ?? "").startsWith(selectedCode)
      ) as Feature<Geometry, any>[];
    }
    if (!selectedCode) return [];
    return (emdGeo?.features ?? []).filter(
      (f: Feature<Geometry, any>) => String(f.properties?.code ?? "").startsWith(selectedCode)
    ) as Feature<Geometry, any>[];
  }, [level, ctprvnGeo, sigGeo, emdGeo, selectedCode]);

  const codeNameMap = useMemo(() => {
    const map = new Map<string, string>();
    currentFeatures.forEach((f) => {
      const code = getFeatureCode(level, f);
      const name = getFeatureName(level, f);
      if (code) map.set(code, name);
    });
    return map;
  }, [currentFeatures, level]);

  useEffect(() => {
    const codes = currentFeatures.map((f) => getFeatureCode(level, f)).filter(Boolean);
    setStats(generateDummyStats(codes));
  }, [level, selectedCode, currentFeatures]);

  const handleSelect = (nextLevel: Level, code: string) => {
    setLevel(nextLevel);
    setSelectedCode(code);
  };

  const handleBreadcrumb = (nextLevel: Level) => {
    if (nextLevel === "ctprvn") {
      setLevel("ctprvn");
      setSelectedCode(null);
    }
    if (nextLevel === "sig" && selectedCode) {
      setLevel("sig");
    }
  };

  const sortedStats = useMemo(() => {
    return [...stats].sort((a, b) => b.value - a.value);
  }, [stats]);

  const top5 = sortedStats.slice(0, 5);
  const bottom5 = [...sortedStats].reverse().slice(0, 5);

  const selectedParentName = useMemo(() => {
    if (level === "ctprvn" || !selectedCode) return "전국";
    if (level === "sig") {
      const feature = (ctprvnGeo?.features ?? []).find(
        (f: Feature<Geometry, any>) => String(f.properties?.code ?? "") === selectedCode
      ) as Feature<Geometry, any> | undefined;
      return feature ? getFeatureName("ctprvn", feature) : "-";
    }
    const feature = (sigGeo?.features ?? []).find(
      (f: Feature<Geometry, any>) => String(f.properties?.code ?? "") === selectedCode
    ) as Feature<Geometry, any> | undefined;
    return feature ? getFeatureName("sig", feature) : "-";
  }, [level, selectedCode, ctprvnGeo, sigGeo]);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "260px 1fr 260px",
        gap: 16,
        height: "100vh",
        padding: 16,
        boxSizing: "border-box",
        fontFamily: "system-ui, -apple-system, sans-serif",
        background: "#f6f7fb",
      }}
    >
      <section style={{ background: "#fff", borderRadius: 12, padding: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <h3 style={{ marginTop: 0 }}>행정 요약</h3>
        <div style={{ fontSize: 14, color: "#444" }}>
          <div style={{ marginBottom: 8 }}>
            <strong>현재 레벨</strong>: {levelLabel[level]}
          </div>
          <div style={{ marginBottom: 8 }}>
            <strong>선택 상위 지역</strong>: {selectedParentName}
          </div>
          <div style={{ marginBottom: 12 }}>
            <strong>지표</strong>: {indicatorLabel}
          </div>
          <div style={{ color: "#666", lineHeight: 1.5 }}>{indicatorDesc}</div>
        </div>

        <div style={{ marginTop: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>탐색 단계</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", fontSize: 13 }}>
            <button
              onClick={() => handleBreadcrumb("ctprvn")}
              style={{
                padding: "6px 8px",
                borderRadius: 8,
                border: "1px solid #dde2ea",
                background: level === "ctprvn" ? "#ffe3c2" : "#fff",
                cursor: "pointer",
              }}
            >
              전국
            </button>
            {level !== "ctprvn" && selectedParentName !== "전국" && (
              <button
                onClick={() => handleBreadcrumb("sig")}
                style={{
                  padding: "6px 8px",
                  borderRadius: 8,
                  border: "1px solid #dde2ea",
                  background: level === "sig" ? "#ffe3c2" : "#fff",
                  cursor: "pointer",
                }}
              >
                {selectedParentName}
              </button>
            )}
          </div>
        </div>
      </section>

      <section style={{ background: "#fff", borderRadius: 12, padding: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <div style={{ height: "100%" }}>
          <KoreaDrilldownMap
            level={level}
            features={currentFeatures}
            stats={stats}
            onSelect={handleSelect}
          />
        </div>
      </section>

      <section style={{ background: "#fff", borderRadius: 12, padding: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <h3 style={{ marginTop: 0 }}>순위 요약</h3>
        <div style={{ fontSize: 13, color: "#666", marginBottom: 12 }}>
          행정 우선관리 지표 기준
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>상위 5개</div>
          {top5.map((item) => (
            <button
              key={`top-${item.code}`}
              onClick={() => handleSelect(level === "ctprvn" ? "sig" : "emd", item.code)}
              disabled={level === "emd"}
              style={{
                display: "flex",
                justifyContent: "space-between",
                width: "100%",
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid #eef1f6",
                background: "#fff",
                marginBottom: 6,
                cursor: level === "emd" ? "default" : "pointer",
                textAlign: "left",
              }}
            >
              <span>{codeNameMap.get(item.code) ?? item.code}</span>
              <strong>{item.value}</strong>
            </button>
          ))}
        </div>

        <div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>하위 5개</div>
          {bottom5.map((item) => (
            <button
              key={`bottom-${item.code}`}
              onClick={() => handleSelect(level === "ctprvn" ? "sig" : "emd", item.code)}
              disabled={level === "emd"}
              style={{
                display: "flex",
                justifyContent: "space-between",
                width: "100%",
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid #eef1f6",
                background: "#fff",
                marginBottom: 6,
                cursor: level === "emd" ? "default" : "pointer",
                textAlign: "left",
              }}
            >
              <span>{codeNameMap.get(item.code) ?? item.code}</span>
              <strong>{item.value}</strong>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
