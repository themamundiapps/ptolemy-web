import type {
  BirthData,
  ChartResponse,
  ChatMessage,
  CityResult,
  ElectionalResult,
  HouseLordEntry,
  Interpretation,
  SynastryPersonInput,
  SynastryResult,
  TemperamentResult,
  TransitsResponse,
} from "./types";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://ptolemy-production.up.railway.app";

class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiError("Could not reach the Ptolemy server. Check your connection and try again.");
  }

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = await response.json();
      detail = body.detail ?? detail;
    } catch {
      // response had no JSON body -- fall back to statusText
    }
    throw new ApiError(detail, response.status);
  }

  return response.json() as Promise<T>;
}

export function searchCities(query: string): Promise<{ results: CityResult[] }> {
  return request(`/api/v1/geocode/search?q=${encodeURIComponent(query)}`);
}

function birthPayload(birth: BirthData) {
  return {
    date: birth.date,
    time: birth.time,
    latitude: birth.latitude,
    longitude: birth.longitude,
    tz_offset: birth.tz_offset ?? null,
  };
}

export function fetchChartPositions(birth: BirthData): Promise<ChartResponse> {
  return request("/api/v1/chart/positions", {
    method: "POST",
    body: JSON.stringify(birthPayload(birth)),
  });
}

export function fetchTransits(birth: BirthData): Promise<TransitsResponse> {
  return request("/api/v1/chart/transits", {
    method: "POST",
    body: JSON.stringify(birthPayload(birth)),
  });
}

export function fetchHouseLords(birth: BirthData): Promise<{ entries: HouseLordEntry[] }> {
  return request("/api/v1/chart/house-lords", {
    method: "POST",
    body: JSON.stringify(birthPayload(birth)),
  });
}

export function fetchTemperament(birth: BirthData): Promise<TemperamentResult> {
  return request("/api/v1/temperament", {
    method: "POST",
    body: JSON.stringify(birthPayload(birth)),
  });
}

export function fetchElectional(
  birth: BirthData,
  startDate: string,
  endDate: string,
  theme: string,
): Promise<ElectionalResult> {
  return request("/api/v1/electional", {
    method: "POST",
    body: JSON.stringify({ ...birthPayload(birth), start_date: startDate, end_date: endDate, theme }),
  });
}

export function fetchSynastry(
  personA: SynastryPersonInput,
  personB: SynastryPersonInput,
  userId?: string,
): Promise<SynastryResult> {
  return request("/api/v1/chart/synastry", {
    method: "POST",
    body: JSON.stringify({ person_a: personA, person_b: personB, user_id: userId ?? null }),
  });
}

export function fetchPlanetInSign(planet: string, sign: string): Promise<Interpretation> {
  return request(`/api/v1/interpretations/planet-sign?planet=${encodeURIComponent(planet)}&sign=${encodeURIComponent(sign)}`);
}

export function fetchPlanetInHouse(planet: string, house: number): Promise<Interpretation> {
  return request(`/api/v1/interpretations/planet-house?planet=${encodeURIComponent(planet)}&house=${house}`);
}

export function fetchLotInterpretation(lot: string, sign: string, house: number): Promise<Interpretation> {
  return request(
    `/api/v1/interpretations/lot?lot=${encodeURIComponent(lot)}&sign=${encodeURIComponent(sign)}&house=${house}`,
  );
}

export function fetchAspectInterpretation(
  planetA: string,
  planetB: string,
  aspectType: string,
): Promise<Interpretation> {
  return request(
    `/api/v1/interpretations/aspect?planet_a=${encodeURIComponent(planetA)}&planet_b=${encodeURIComponent(planetB)}&aspect_type=${encodeURIComponent(aspectType)}`,
  );
}

export function fetchHouseLordInterpretation(fromHouse: number, toHouse: number): Promise<Interpretation> {
  return request(`/api/v1/interpretations/house-lord?from_house=${fromHouse}&to_house=${toHouse}`);
}

export function fetchChartAnalysis(birth: BirthData, userId?: string): Promise<{ analysis: string }> {
  return request("/api/v1/chart/analysis", {
    method: "POST",
    body: JSON.stringify({ ...birthPayload(birth), user_id: userId ?? null }),
  });
}

export function chatWithAstrologer(
  birth: BirthData,
  messages: ChatMessage[],
  userId?: string,
): Promise<{ reply: string }> {
  return request("/api/v1/chat/astrologer", {
    method: "POST",
    body: JSON.stringify({ ...birthPayload(birth), messages, user_id: userId ?? null }),
  });
}

export { ApiError };
