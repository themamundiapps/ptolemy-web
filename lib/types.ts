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

export interface Transit {
  transiting_planet: string;
  natal_planet: string;
  aspect: string;
  aspect_symbol: string;
  orb: number;
  is_applying: boolean;
  interpretation_key: string;
  is_harmonious: boolean;
}

export interface MoonPosition {
  sign: string;
  house: number;
  phase_name: string;
  phase_angle: number;
  voc: boolean;
  via_combusta: boolean;
}

export interface TransitsResponse {
  transits: Transit[];
  moon_position: MoonPosition;
  moon_natal_aspect: Transit | null;
}

export interface Interpretation {
  body: string;
  citation: string;
}

export interface HouseLordEntry {
  house_number: number;
  sign: string;
  lord: string;
  lord_house: number;
  lord_sign: string;
  lord_dignity: string | null;
  interpretation_key: string;
}

export interface TemperamentFactor {
  label: string;
  detail: string;
}

export interface TemperamentResult {
  temperament: string;
  qualities: string;
  net_heat: number;
  net_moisture: number;
  description: string;
  citation: string;
  factors: TemperamentFactor[];
}

export interface ElectionalHit {
  planet: string;
  house: number;
  house_name: string;
  aspect: string;
  mode: string;
  orb: number;
  score: number;
  is_supporting: boolean;
  is_cazimi: boolean;
}

export interface ElectionalDay {
  date: string;
  best_time: string;
  quality_label: string;
  reasons: string[];
  hits: ElectionalHit[];
  moon_voc: boolean;
  via_combusta: boolean;
  caution: string | null;
}

export interface ElectionalResult {
  theme: string;
  theme_label: string;
  banner: string | null;
  note: string | null;
  days: ElectionalDay[];
}

export interface SynastryPersonInput {
  name?: string;
  date: string;
  time: string;
  latitude: number;
  longitude: number;
  tz_offset?: number;
}

export interface SynastryHouseOverlay {
  planet: string;
  from_chart: "A" | "B";
  sign: string;
  house: number;
}

export interface SynastryAspect {
  planet_a: string;
  from_chart: "A" | "B";
  planet_b: string;
  is_angle: boolean;
  aspect: string;
  angle: number;
  orb: number;
}

export interface SynastryResult {
  person_a_name: string;
  person_b_name: string;
  house_overlays: SynastryHouseOverlay[];
  aspects: SynastryAspect[];
  analysis: string;
}

export interface SavedChart {
  id: string;
  birthData: BirthData;
  chart: ChartResponse;
  analysis?: string;
  messages: ChatMessage[];
  createdAt: string;
}
