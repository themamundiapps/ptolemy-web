export interface BirthData {
  name?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM (24h)
  latitude: number;
  longitude: number;
  tz_offset?: number;
  place_name?: string;
}

export interface ZodiacPosition {
  longitude: number;
  sign: string;
  sign_longitude: number;
  house: number;
  retrograde: boolean;
  dignities: string[];
}

export interface Aspect {
  planet_a: string;
  planet_b: string;
  aspect: string;
  angle: number;
  orb: number;
}

export interface ChartResponse {
  julian_day_ut: number;
  sect: "diurnal" | "nocturnal";
  timezone_id: string | null;
  utc_offset_used: number;
  tz_source: string;
  ascendant: ZodiacPosition;
  midheaven: ZodiacPosition;
  planets: Record<string, ZodiacPosition>;
  lot_of_fortune: ZodiacPosition;
  lot_of_spirit: ZodiacPosition;
  aspects: Aspect[];
}

export interface CityResult {
  name: string;
  latitude: number;
  longitude: number;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface SavedChart {
  id: string;
  birthData: BirthData;
  chart: ChartResponse;
  analysis?: string;
  messages: ChatMessage[];
  createdAt: string;
}
