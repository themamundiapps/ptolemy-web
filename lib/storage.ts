import type { ChatMessage, SavedChart } from "./types";

const CHARTS_KEY = "ptolemy:charts";
const DEVICE_ID_KEY = "ptolemy:device_id";

export const FREE_MESSAGE_LIMIT = 5;

function readCharts(): Record<string, SavedChart> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(CHARTS_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function writeCharts(charts: Record<string, SavedChart>) {
  window.localStorage.setItem(CHARTS_KEY, JSON.stringify(charts));
}

export function saveChart(chart: SavedChart) {
  const charts = readCharts();
  charts[chart.id] = chart;
  writeCharts(charts);
}

export function getChart(id: string): SavedChart | null {
  return readCharts()[id] ?? null;
}

export function appendMessage(id: string, message: ChatMessage) {
  const charts = readCharts();
  const chart = charts[id];
  if (!chart) return;
  chart.messages = [...chart.messages, message];
  writeCharts(charts);
}

export function userMessageCount(chart: SavedChart): number {
  return chart.messages.filter((m) => m.role === "user").length;
}

/** Locally-generated id used to key the shared free-tier daily AI limit for
 * guests, mirroring the Flutter app's device-id convention -- replaced by
 * the Google account id once a user signs in. */
export function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}
