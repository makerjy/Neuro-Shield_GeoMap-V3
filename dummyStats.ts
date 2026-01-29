export type RegionStat = {
  code: string;
  value: number; // 0-100
};

// Generates deterministic-ish random values per code so UI is stable per render
export function generateDummyStats(codes: string[]): RegionStat[] {
  return codes.map((code) => {
    // simple hash to keep values stable per code
    let hash = 0;
    for (let i = 0; i < code.length; i += 1) {
      hash = (hash * 31 + code.charCodeAt(i)) >>> 0;
    }
    const value = (hash % 101); // 0-100
    return { code, value };
  });
}
