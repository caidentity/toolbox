export const formatValue = (value: number): string => {
  if (value >= 1000000000) {
    return `$${(value / 1000000000).toFixed(1)}B`;
  } else if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  return `$${(value / 1000).toFixed(1)}K`;
};

export const FUNDING_ROUNDS = {
  seed: { name: 'Seed', dilution: 20 },
  seriesA: { name: 'Series A', dilution: 20 },
  seriesB: { name: 'Series B', dilution: 15 },
  seriesC: { name: 'Series C', dilution: 12 },
  seriesD: { name: 'Series D', dilution: 12 },
  seriesE: { name: 'Series E', dilution: 12 },
  seriesF: { name: 'Series F', dilution: 12 }
} as const; 