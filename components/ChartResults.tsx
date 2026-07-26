import ChartWheel from "@/components/ChartWheel";
import PlanetList from "@/components/PlanetList";
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
    <div className="grid gap-10 lg:grid-cols-2">
      <div className="space-y-8">
        <ChartWheel chart={chart} />
        <PlanetList chart={chart} />
      </div>

      <div className="space-y-6">
        <div className="border border-ink bg-parchment-2 p-6">
          <h2 className="mb-3 border-b border-line pb-3 font-cinzel text-sm uppercase tracking-[0.1em] text-ink">
            Reading
          </h2>
          {analysisLoading && <p className="font-cormorant italic text-ink-2">Casting your reading…</p>}
          {analysisError && <p className="font-crimson text-sm text-terracotta">{analysisError}</p>}
          {analysis && (
            <p className="whitespace-pre-line font-crimson text-[15px] leading-relaxed text-ink">{analysis}</p>
          )}
        </div>

        <div>
          <h2 className="mb-3 font-cinzel text-sm uppercase tracking-[0.1em] text-ink">Ask the Astrologer</h2>
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
  );
}
