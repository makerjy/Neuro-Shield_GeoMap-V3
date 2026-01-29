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

const indicatorOptions = [
  {
    key: "risk",
    label: "위험군 규모",
    desc: "추정 고위험 인구 수, 인구 1만명당 고위험 비율",
    unit: "명",
    scale: [150000, 850000],
  },
  {
    key: "execution",
    label: "실행 지표",
    desc: "1차 선별 완료율, 재검/정밀 연계율, 미추적(드랍) 비율",
    unit: "%",
    scale: [48, 96],
  },
  {
    key: "burden",
    label: "성과/부담 지표",
    desc: "케이스 관리 소요(대기) 추정, 지역별 병목(수요>공급)",
    unit: "일",
    scale: [3, 28],
  },
  {
    key: "resource",
    label: "자원 지표",
    desc: "치매안심센터/협력병원/검사 가능기관 커버리지(거리/시간 기반)",
    unit: "분",
    scale: [8, 65],
  },
  {
    key: "equity",
    label: "형평성 지표",
    desc: "취약지역(고령·독거·농어촌) 대비 서비스 접근성 격차",
    unit: "점",
    scale: [42, 98],
  },
];

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
  const [indicatorKey, setIndicatorKey] = useState<string>(indicatorOptions[0].key);
  const [year, setYear] = useState<number>(2024);
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
    setStats(generateDummyStats(codes, `${indicatorKey}-${year}`));
  }, [level, selectedCode, currentFeatures, indicatorKey, year]);

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

  const handleGoRoot = () => {
    setLevel("ctprvn");
    setSelectedCode(null);
  };

  const handleGoUp = () => {
    if (level === "emd") {
      setLevel("sig");
    } else if (level === "sig") {
      setLevel("ctprvn");
      setSelectedCode(null);
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

  const selectedIndicator = useMemo(() => {
    return indicatorOptions.find((option) => option.key === indicatorKey) ?? indicatorOptions[0];
  }, [indicatorKey]);

  const formatNumber = useMemo(() => new Intl.NumberFormat("ko-KR"), []);

  const scaleIndicatorValue = (value: number) => {
    const [min, max] = selectedIndicator.scale;
    return min + ((max - min) * value) / 100;
  };

  const formatIndicatorValue = (value: number) => {
    const scaled = scaleIndicatorValue(value);
    if (selectedIndicator.unit === "%") return `${scaled.toFixed(1)}%`;
    if (selectedIndicator.unit === "점") return `${Math.round(scaled)}점`;
    if (selectedIndicator.unit === "일") return `${Math.round(scaled)}일`;
    if (selectedIndicator.unit === "분") return `${Math.round(scaled)}분`;
    return `${formatNumber.format(Math.round(scaled))}명`;
  };

  const values = useMemo(() => stats.map((item) => item.value), [stats]);
  const maxValue = values.length ? Math.max(...values) : 0;
  const minValue = values.length ? Math.min(...values) : 0;
  const avgValue = values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;

  const distribution = useMemo(() => {
    const buckets = new Array(20).fill(0);
    stats.forEach((s) => {
      const idx = Math.min(19, Math.floor(s.value / 5));
      buckets[idx] += 1;
    });
    const maxBucket = Math.max(...buckets, 1);
    return buckets.map((b) => b / maxBucket);
  }, [stats]);

  const legendColors = ["#eff6ff", "#bfdbfe", "#93c5fd", "#60a5fa", "#3b82f6", "#1e3a8a"];
  const legendStops = useMemo(() => {
    if (!values.length) return [] as { value: number; color: string }[];
    const sorted = [...values].sort((a, b) => a - b);
    return legendColors.map((color, idx) => {
      const q = idx / (legendColors.length - 1);
      const position = Math.min(sorted.length - 1, Math.floor(q * (sorted.length - 1)));
      return { value: sorted[position], color };
    });
  }, [values, legendColors]);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("level", level);
    if (selectedCode) params.set("code", selectedCode);
    params.set("indicator", indicatorKey);
    params.set("year", String(year));
    const url = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState(null, "", url);
  }, [level, selectedCode, indicatorKey, year]);

  useEffect(() => {
    const handler = () => {
      const params = new URLSearchParams(window.location.search);
      const nextLevel = (params.get("level") as Level) || "ctprvn";
      const nextCode = params.get("code");
      const nextIndicator = params.get("indicator") || indicatorOptions[0].key;
      const nextYear = Number(params.get("year") || 2024);
      setLevel(nextLevel);
      setSelectedCode(nextLevel === "ctprvn" ? null : nextCode);
      setIndicatorKey(nextIndicator);
      setYear(Number.isNaN(nextYear) ? 2024 : nextYear);
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  const ageDistribution = [
    { label: "0-4", value: 1293 },
    { label: "5-9", value: 1857 },
    { label: "10-14", value: 2271 },
    { label: "15-19", value: 2279 },
    { label: "20-24", value: 2807 },
    { label: "25-29", value: 3496 },
    { label: "30-34", value: 3647 },
    { label: "35-39", value: 3302 },
    { label: "40-44", value: 3972 },
    { label: "45-49", value: 3837 },
    { label: "50-54", value: 4430 },
    { label: "55-59", value: 4283 },
    { label: "60-64", value: 4212 },
    { label: "65-69", value: 3579 },
    { label: "70-74", value: 2369 },
    { label: "75-79", value: 1764 },
    { label: "80-84", value: 1333 },
    { label: "85+", value: 1077 },
  ];

  const migrationStats = [
    { label: "비 이동자", value: 43897396 },
    { label: "시도내 이동자", value: 5632501 },
    { label: "시도내/동 간 이동", value: 1902043 },
    { label: "시도내/읍면동 간 이동", value: 1557668 },
    { label: "시도간 이동자", value: 1825257 },
  ];

  const trendStats = [
    { year: 1990, value: 43390374 },
    { year: 1995, value: 44553710 },
    { year: 2000, value: 45985289 },
    { year: 2005, value: 47041434 },
    { year: 2010, value: 47990761 },
    { year: 2015, value: 49705663 },
    { year: 2020, value: 50133493 },
  ];

  const maxAge = Math.max(...ageDistribution.map((item) => item.value));
  const maxMigration = Math.max(...migrationStats.map((item) => item.value));
  const maxTrend = Math.max(...trendStats.map((item) => item.value));

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "280px minmax(420px, 0.9fr) 340px",
        gap: 16,
        minHeight: "100vh",
        padding: 16,
        boxSizing: "border-box",
        fontFamily: "system-ui, -apple-system, sans-serif",
        background: "#f4f6fb",
        color: "#1f2a37",
      }}
    >
      <section
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: 16,
          boxShadow: "0 8px 20px rgba(15, 23, 42, 0.08)",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 18, fontWeight: 700 }}>{selectedParentName}</span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#1d4ed8",
                background: "#dbeafe",
                padding: "2px 8px",
                borderRadius: 999,
              }}
            >
              {levelLabel[level]}
            </span>
          </div>
          <div style={{ fontSize: 12, color: "#64748b" }}>정책형 드릴다운 대시보드</div>
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", fontSize: 12 }}>
          <button
            onClick={() => handleBreadcrumb("ctprvn")}
            style={{
              padding: "4px 8px",
              borderRadius: 999,
              border: "1px solid #e2e8f0",
              background: level === "ctprvn" ? "#eff6ff" : "#fff",
              color: "#1d4ed8",
              cursor: "pointer",
            }}
          >
            대한민국
          </button>
          {level !== "ctprvn" && (
            <button
              onClick={() => handleBreadcrumb("sig")}
              style={{
                padding: "4px 8px",
                borderRadius: 999,
                border: "1px solid #e2e8f0",
                background: level === "sig" ? "#eff6ff" : "#fff",
                color: "#1d4ed8",
                cursor: "pointer",
              }}
            >
              {selectedParentName}
            </button>
          )}
          {level === "emd" && selectedCode && (
            <span
              style={{
                padding: "4px 8px",
                borderRadius: 999,
                border: "1px solid #e2e8f0",
                background: "#f8fafc",
                color: "#475569",
              }}
            >
              {selectedCode}
            </span>
          )}
        </div>

        <div style={{ display: "grid", gap: 12 }}>
            {[
            { label: "최대값", value: maxValue, color: "#1d4ed8" },
            { label: "평균값", value: avgValue, color: "#0ea5e9" },
            { label: "최소값", value: minValue, color: "#2563eb" },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                background: "#f8fafc",
                borderRadius: 12,
                padding: "12px 14px",
                border: "1px solid #eef2f7",
              }}
            >
              <div style={{ fontSize: 12, color: "#64748b" }}>{item.label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: item.color }}>
                {formatIndicatorValue(item.value)}
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>{selectedIndicator.label}</div>
            </div>
          ))}
        </div>

        <div>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>지표 선택</div>
          <div style={{ display: "grid", gap: 8 }}>
            {indicatorOptions.map((option) => (
              <button
                key={option.key}
                onClick={() => setIndicatorKey(option.key)}
                style={{
                  textAlign: "left",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: option.key === indicatorKey ? "1px solid #2563eb" : "1px solid #e2e8f0",
                  background: option.key === indicatorKey ? "#eff6ff" : "#fff",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 13 }}>{option.label}</div>
                <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.4 }}>{option.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>연도 선택</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[2020, 2021, 2022, 2023, 2024].map((y) => (
              <button
                key={y}
                onClick={() => setYear(y)}
                style={{
                  padding: "6px 10px",
                  borderRadius: 8,
                  border: y === year ? "1px solid #2563eb" : "1px solid #e2e8f0",
                  background: y === year ? "#eff6ff" : "#fff",
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                {y}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleGoUp}
            disabled={level === "ctprvn"}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              background: "#fff",
              cursor: level === "ctprvn" ? "default" : "pointer",
              fontSize: 12,
            }}
          >
            이전 단계로
          </button>
          <button
            onClick={handleGoRoot}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              background: "#eff6ff",
              cursor: "pointer",
              fontSize: 12,
              color: "#1d4ed8",
            }}
          >
            전국으로
          </button>
        </div>

        <div style={{ background: "#eff6ff", borderRadius: 12, padding: 12, border: "1px solid #bfdbfe" }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, color: "#1d4ed8" }}>드릴다운 의미</div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "#1e40af", lineHeight: 1.5 }}>
            <li>시/군/구: 정책 집행 단위(예산/인력/기관 네트워크 운영)</li>
            <li>읍/면/동: 현장 개입 단위(방문, 상담, 추적, 홍보 타겟팅)</li>
            <li>고위험 많고 추적률 낮은 지역 → 인력·홍보 집중</li>
            <li>대기열 긴 지역 → 협력기관 확충·우회 경로 제안</li>
          </ul>
        </div>
      </section>

      <section
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: 12,
          boxShadow: "0 8px 20px rgba(15, 23, 42, 0.08)",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          height: "62vh",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 700 }}>총괄 대시보드</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>
              {selectedIndicator.label} · 클릭하여 상세 확인 (드릴다운)
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <span style={{ fontSize: 11, color: "#1d4ed8", background: "#dbeafe", padding: "4px 8px", borderRadius: 999 }}>
              {selectedParentName}
            </span>
            <span style={{ fontSize: 11, color: "#1e40af", background: "#dbeafe", padding: "4px 8px", borderRadius: 999 }}>
              {levelLabel[level]}
            </span>
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 360, borderRadius: 12, overflow: "hidden", border: "1px solid #eef2f7" }}>
          <KoreaDrilldownMap
            level={level}
            features={currentFeatures}
            stats={stats}
            onSelect={handleSelect}
            indicatorLabel={selectedIndicator.label}
            unit={selectedIndicator.unit}
            year={year}
          />
        </div>

        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>
            범례 · {selectedIndicator.label} ({selectedIndicator.unit}) · {year}년 · 분위수 6구간
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {legendStops.map((stop, idx) => (
              <div key={`legend-${idx}`} style={{ textAlign: "center" }}>
                <div style={{ width: 36, height: 8, borderRadius: 999, background: stop.color }} />
                <div style={{ fontSize: 10, color: "#94a3b8" }}>{formatIndicatorValue(stop.value)}</div>
              </div>
            ))}
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 36, height: 8, borderRadius: 999, background: "#e2e8f0" }} />
              <div style={{ fontSize: 10, color: "#94a3b8" }}>결측</div>
            </div>
          </div>
        </div>
      </section>

      <section
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: 16,
          boxShadow: "0 8px 20px rgba(15, 23, 42, 0.08)",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>상세 통계</div>
          <div style={{ fontSize: 12, color: "#64748b" }}>분포/상하위 지역을 동시에 확인</div>
        </div>

        <div>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>분포도</div>
          <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 46 }}>
            {distribution.map((ratio, idx) => (
              <div
                key={`dist-${idx}`}
                style={{
                  width: 8,
                  height: `${Math.max(6, ratio * 44)}px`,
                  borderRadius: 4,
                  background: "#3b82f6",
                  opacity: 0.4 + ratio * 0.6,
                }}
              />
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#94a3b8" }}>
            <span>{formatIndicatorValue(minValue)}</span>
            <span>{formatIndicatorValue(maxValue)}</span>
          </div>
        </div>

        <div>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>상위 5개 지역</div>
          {top5.map((item, idx) => (
            <button
              key={`top-${item.code}`}
              onClick={() => handleSelect(level === "ctprvn" ? "sig" : "emd", item.code)}
              disabled={level === "emd"}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                padding: "8px 10px",
                borderRadius: 10,
                border: "1px solid #eef2f7",
                background: "#fff",
                marginBottom: 6,
                cursor: level === "emd" ? "default" : "pointer",
                textAlign: "left",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 6,
                  background: "#dbeafe",
                    color: "#1d4ed8",
                    fontSize: 11,
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {idx + 1}
                </span>
                <span>{codeNameMap.get(item.code) ?? item.code}</span>
              </span>
              <strong>{formatIndicatorValue(item.value)}</strong>
            </button>
          ))}
        </div>

        <div>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>하위 5개 지역</div>
          {bottom5.map((item, idx) => (
            <button
              key={`bottom-${item.code}`}
              onClick={() => handleSelect(level === "ctprvn" ? "sig" : "emd", item.code)}
              disabled={level === "emd"}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                padding: "8px 10px",
                borderRadius: 10,
                border: "1px solid #eef2f7",
                background: "#fff",
                marginBottom: 6,
                cursor: level === "emd" ? "default" : "pointer",
                textAlign: "left",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 6,
                    background: "#e0f2fe",
                    color: "#0284c7",
                    fontSize: 11,
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {idx + 1}
                </span>
                <span>{codeNameMap.get(item.code) ?? item.code}</span>
              </span>
              <strong>{formatIndicatorValue(item.value)}</strong>
            </button>
          ))}
        </div>
      </section>

      <section
        style={{
          gridColumn: "1 / -1",
          background: "#fff",
          borderRadius: 16,
          padding: 16,
          boxShadow: "0 8px 20px rgba(15, 23, 42, 0.08)",
          display: "grid",
          gap: 16,
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16 }}>
          <div style={{ border: "1px solid #eef2f7", borderRadius: 14, padding: 14 }}>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>연령 분포</div>
            <div style={{ display: "grid", gap: 6 }}>
              {ageDistribution.map((item) => (
                <div key={item.label} style={{ display: "grid", gridTemplateColumns: "40px 1fr 50px", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, color: "#64748b" }}>{item.label}</span>
                  <div style={{ height: 8, background: "#eef2f7", borderRadius: 999, overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${(item.value / maxAge) * 100}%`,
                        background: "linear-gradient(90deg, #60a5fa, #2563eb)",
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 11, color: "#94a3b8", textAlign: "right" }}>{formatNumber.format(item.value)}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ border: "1px solid #eef2f7", borderRadius: 14, padding: 14 }}>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>구성 비율</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                {
                  title: "내국인",
                  values: [50.2, 49.8],
                  labels: ["남자", "여자"],
                  colors: ["#60a5fa", "#1d4ed8"],
                },
                {
                  title: "외국인",
                  values: [57, 43],
                  labels: ["남자", "여자"],
                  colors: ["#38bdf8", "#1e3a8a"],
                },
              ].map((item) => (
                <div key={item.title} style={{ display: "grid", gap: 8 }}>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{item.title}</div>
                  <div
                    style={{
                      width: 120,
                      height: 120,
                      borderRadius: "50%",
                      background: `conic-gradient(${item.colors[0]} 0 ${item.values[0]}%, ${item.colors[1]} ${item.values[0]}% 100%)`,
                      position: "relative",
                      margin: "0 auto",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: 18,
                        background: "#fff",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#1f2937",
                      }}
                    >
                      {item.values[0]}%
                    </div>
                  </div>
                  <div style={{ display: "grid", gap: 4, fontSize: 11, color: "#64748b" }}>
                    {item.labels.map((label, idx) => (
                      <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 999, background: item.colors[idx] }} />
                        {label} {item.values[idx]}%
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ border: "1px solid #eef2f7", borderRadius: 14, padding: 14 }}>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>거주지 이동</div>
            <div style={{ display: "grid", gap: 8 }}>
              {migrationStats.map((item) => (
                <div key={item.label} style={{ display: "grid", gridTemplateColumns: "90px 1fr 70px", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, color: "#64748b" }}>{item.label}</span>
                  <div style={{ height: 8, background: "#f1f5f9", borderRadius: 999 }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${(item.value / maxMigration) * 100}%`,
                        background: "linear-gradient(90deg, #38bdf8, #2563eb)",
                        borderRadius: 999,
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 11, color: "#94a3b8", textAlign: "right" }}>{formatNumber.format(item.value)}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ border: "1px solid #eef2f7", borderRadius: 14, padding: 14 }}>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>인구 추세</div>
            <div style={{ display: "grid", gap: 8 }}>
              {trendStats.map((item) => (
                <div key={item.year} style={{ display: "grid", gridTemplateColumns: "40px 1fr 70px", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, color: "#64748b" }}>{item.year}</span>
                  <div style={{ height: 8, background: "#f8fafc", borderRadius: 999 }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${(item.value / maxTrend) * 100}%`,
                        background: "linear-gradient(90deg, #60a5fa, #1d4ed8)",
                        borderRadius: 999,
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 11, color: "#94a3b8", textAlign: "right" }}>{formatNumber.format(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
