export type SampleJob = {
  id: string;
  pickup: string;
  drop: string;
  distanceKm: number;
  payout: number;
  etaMin: number;
  items: number;
};

export const SAMPLE_JOBS: SampleJob[] = [
  {
    id: "SZ-10241",
    pickup: "Koramangala Hub",
    drop: "Indiranagar 12th Main",
    distanceKm: 4.2,
    payout: 85,
    etaMin: 12,
    items: 2,
  },
  {
    id: "SZ-10238",
    pickup: "HSR Warehouse",
    drop: "BTM 2nd Stage",
    distanceKm: 3.1,
    payout: 70,
    etaMin: 9,
    items: 1,
  },
  {
    id: "SZ-10233",
    pickup: "Jayanagar Store",
    drop: "JP Nagar 5th Phase",
    distanceKm: 5.6,
    payout: 110,
    etaMin: 16,
    items: 3,
  },
];

export const SAMPLE_STATS = {
  deliveredToday: 6,
  earningsToday: 540,
  kmToday: 18.4,
};
