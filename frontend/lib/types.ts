export interface Owner {
  id: string;
  name: string;
  createdAt: string;
  isLocalOnly?: boolean;
}

export interface Farm {
  id: string;
  ownerId: string;
  name: string;
  notes?: string;
  createdAt: string;
  isLocalOnly?: boolean;
}

export interface Paddock {
  id: string;
  farmId: string;
  ownerId: string;
  name: string;
  areaHectares?: number;
  gpsPoint?: GPSCoordinate;
  gpsAccuracyM?: number;
  gpsCapturedAt?: string;
  createdAt?: string;
  isLocalOnly?: boolean;
}

export interface GPSCoordinate {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface MixItem {
  id: string;
  chemical: string;
  rateLPerHa: number;
  notes?: string;
}

export interface Mix {
  id: string;
  ownerId: string;
  name: string;
  totalWaterL: number;
  items: MixItem[];
  createdAt: string;
  isLocalOnly?: boolean;
}

export interface WeatherSnapshot {
  windSpeedMs: number | null;
  windDirectionDeg: number | null;
  temperatureC: number | null;
  humidityPct: number | null;
  capturedAt?: string;
}

export interface ApplicationSummary {
  id: string;
  ownerId: string;
  mixId: string;
  paddockIds: string[];
  startedAt: string;
  finishedAt?: string;
  finalized: boolean;
  weather?: WeatherSnapshot;
  isLocalOnly?: boolean;
}

export interface ApplicationDraft {
  ownerId: string | null;
  farmId: string | null;
  paddockIds: string[];
  mixId: string | null;
  startedAt: string;
  finishedAt?: string;
  operatorName: string;
  waterSource?: string;
  notes?: string;
  gpsSnapshots: Array<{ paddockId: string; coordinate: GPSCoordinate; capturedAt: string; withinBoundary?: boolean }>;
  weather?: WeatherSnapshot;
}

export const emptyApplicationDraft: ApplicationDraft = {
  ownerId: null,
  farmId: null,
  paddockIds: [],
  mixId: null,
  startedAt: new Date().toISOString(),
  operatorName: '',
  gpsSnapshots: []
};
