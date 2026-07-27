import type { BirthData, ChartResponse, ChatMessage, CityResult, TransitsResponse } from "./types";

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
