import ChartWheel from "@/components/ChartWheel";
import PlanetList from "@/components/PlanetList";
import ChartFactStrip from "@/components/ChartFactStrip";
import AspectsSection from "@/components/AspectsSection";
import ReadingSections from "@/components/ReadingSections";
import ChatPanel from "@/components/ChatPanel";
import type { BirthData, ChartResponse, ChatMessage } from "@/lib/types";

export default function ChartResults({
  birth,
  chart,
  analysis,
  analysisLoading,
  analysisError,
  messages,
  onMessagesChange,
  userId,
  onUpgradeClick,
}: {
  birth: BirthData;
  chart: ChartResponse;
  analysis?: string;
  analysisLoading: boolean;
  analysisError: string | null;
  messages: ChatMessage[];
  onMessagesChange: (messages: ChatMessage[]) => void;
  userId: string;
  onUpgradeClick: () => void;
}) {
  return (
    <div>
      <div className="mb-8 text-center">
        <ChartFactStrip chart={chart} />
      </div>

      <div className="grid gap-10 lg:grid-cols-[340px_1fr]">
        <div className="space-y-6 lg:sticky lg:top-8 lg:self-start">
          <ChartWheel chart={chart} />
          <PlanetList chart={chart} />
        </div>

        <div className="space-y-5">
          <div className="mb-1 flex items-center gap-2">
            <span className="font-cinzel text-[11px] uppercase tracking-[0.14em] text-bronze-dark">Reading</span>
          </div>

          {analysisLoading && (
            <div className="border border-line bg-parchment-2 p-6">
              <p className="font-cormorant italic text-ink-2">Casting your reading…</p>
            </div>
          )}
          {analysisError && (
            <div className="border border-terracotta bg-parchment-2 p-6">
              <p className="font-crimson text-sm text-terracotta">{analysisError}</p>
            </div>
          )}
          {analysis && <ReadingSections analysis={analysis} />}

          <AspectsSection chart={chart} />

          <div className="border border-line bg-parchment-2 p-6">
            <h2 className="mb-1 font-cormorant text-lg font-medium text-ink">Ask the Astrologer</h2>
            <p className="mb-4 font-crimson text-sm text-ink-2">
              About your sect, your ruling planet, or any aspect above worth going deeper on.
            </p>
            <ChatPanel
              birth={birth}
              userId={userId}
              messages={messages}
              onMessagesChange={onMessagesChange}
              onUpgradeClick={onUpgradeClick}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
