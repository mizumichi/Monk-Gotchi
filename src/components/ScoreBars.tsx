import { CATEGORY_META, type Category } from "@/data/tasks";

const TOTAL_BLOCKS = 20;

interface Props {
  scores: Record<Category, number>;
  cycleScores?: Record<Category, number>;
}

export default function ScoreBars({ scores, cycleScores }: Props) {
  return (
    <div className="flex-1 bg-zinc-900 border border-zinc-800 px-4 py-3 flex flex-col justify-center gap-3">
      {(
        Object.entries(CATEGORY_META) as [
          Category,
          (typeof CATEGORY_META)[Category],
        ][]
      ).map(([catId, meta]) => {
        const score = scores[catId] ?? 0;
        const cycleScore = cycleScores?.[catId] ?? 0;
        const filled = Math.min(Math.floor(score / 10), TOTAL_BLOCKS);
        return (
          <div key={catId} className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <span className="text-sm leading-none">{meta.icon}</span>
              <span className="font-mono text-xs text-zinc-400">
                {meta.label}
              </span>
              <span className="font-mono text-xs ml-auto flex items-baseline gap-1">
                <span className="text-zinc-500">{score}pt</span>
                {cycleScores && (
                  <span className="text-zinc-700">/ 累計 {cycleScore}pt</span>
                )}
              </span>
            </div>
            <div className="flex gap-px">
              {Array.from({ length: TOTAL_BLOCKS }, (_, i) => (
                <div
                  key={i}
                  className="h-2.5 flex-1"
                  style={{
                    backgroundColor: i < filled ? meta.color : "#27272a",
                  }}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
