import type { ChatMessage, SavedChart } from "./types";

const CHARTS_KEY = "ptolemy:charts";
const DEVICE_ID_KEY = "ptolemy:device_id";
const ACTIVE_CHART_KEY = "ptolemy:active_chart_id";

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

/** Every chart saved on this device, most recently cast first -- used to
 * offer "compare with a saved chart" instead of re-typing birth details
 * (e.g. Synastry). */
export function listCharts(): SavedChart[] {
  return Object.values(readCharts()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
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

/** Totals user-sent chat messages across every saved chart on this device,
 * mirroring the shared daily free-tier limit rather than a per-chart one. */
export function totalUserMessageCount(): number {
  return Object.values(readCharts()).reduce((sum, chart) => sum + userMessageCount(chart), 0);
}

/** The most recently cast chart, used by the Hub to know which natal chart
 * to read transits and dignities against. */
export function setActiveChartId(id: string) {
  window.localStorage.setItem(ACTIVE_CHART_KEY, id);
}

export function getActiveChartId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTIVE_CHART_KEY);
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
