import { theme } from "./theme";

export type Indicator = {
  id: string;
  label: string;
  description: string;
  unit: string;
  format: (value: number) => string;
  colors: string[];
  scale: [number, number];
};

const numberFormat = new Intl.NumberFormat("ko-KR");

export const INDICATORS: Indicator[] = [
  {
    id: "high_risk_rate",
    label: "고위험군 비율",
    description: "인구 1만명당 추정 고위험군 비율",
    unit: "명/1만",
    format: (value) => `${value.toFixed(1)}명`,
    colors: theme.map.fillScale,
    scale: [12, 68],
  },
  {
    id: "screening_coverage",
    label: "1차 선별 완료율",
    description: "고위험 추정 인구 대비 1차 선별 완료율",
    unit: "%",
    format: (value) => `${value.toFixed(1)}%`,
    colors: theme.map.fillScale,
    scale: [45, 92],
  },
  {
    id: "followup_dropout",
    label: "추적 이탈 비율",
    description: "재검/정밀 연계 과정 중 미추적 비율",
    unit: "%",
    format: (value) => `${value.toFixed(1)}%`,
    colors: theme.map.fillScale,
    scale: [6, 28],
  },
  {
    id: "waitlist_pressure",
    label: "대기/병목 지수",
    description: "수요 대비 공급 병목을 지수화한 추정 값",
    unit: "점",
    format: (value) => `${Math.round(value)}점`,
    colors: theme.map.fillScale,
    scale: [30, 95],
  },
  {
    id: "accessibility_score",
    label: "접근성 점수",
    description: "기관까지 평균 이동시간 기반 접근성 점수",
    unit: "점",
    format: (value) => `${Math.round(value)}점`,
    colors: theme.map.fillScale,
    scale: [40, 98],
  },
];

export const indicatorById = (id: string) => INDICATORS.find((item) => item.id === id) ?? INDICATORS[0];

export const formatValue = (indicatorId: string, value: number) => {
  const indicator = indicatorById(indicatorId);
  return indicator.format(value);
};

export const formatWithUnit = (value: number, unit: string) => {
  if (unit === "%") return `${value.toFixed(1)}%`;
  if (unit === "점") return `${Math.round(value)}점`;
  if (unit === "명") return `${numberFormat.format(Math.round(value))}명`;
  return `${value.toFixed(1)}${unit}`;
};
