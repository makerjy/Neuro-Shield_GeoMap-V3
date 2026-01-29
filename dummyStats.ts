export type RegionStat = {
  code: string;
  value: number; // 0-100
};

// Generates deterministic-ish random values per code so UI is stable per render
export function generateDummyStats(codes: string[], salt = ""): RegionStat[] {
  return codes.map((code) => {
    // simple hash to keep values stable per code
    let hash = 0;
    const seed = `${code}-${salt}`;
    for (let i = 0; i < seed.length; i += 1) {
      hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    }
    const value = hash % 101; // 0-100
    return { code, value };
  });
}
