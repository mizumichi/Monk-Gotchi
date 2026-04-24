import { CATEGORIES } from "@/data/tasks";

const TOTAL_BLOCKS = 20;

export default function ScoreBars() {
  return (
    <div className="flex-1 bg-zinc-900 border border-zinc-800 px-4 py-3 flex flex-col justify-center gap-3">
      {CATEGORIES.map((cat) => {
        const filled = 0; // placeholder — will be wired to real data in stage 2
        return (
          <div key={cat.id} className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <span className="text-sm leading-none">{cat.icon}</span>
              <span className="font-mono text-xs text-zinc-400">{cat.name}</span>
              <span className="font-mono text-xs text-zinc-600 ml-auto">
                {filled}
              </span>
            </div>
            <div className="flex gap-px">
              {Array.from({ length: TOTAL_BLOCKS }, (_, i) => (
                <div
                  key={i}
                  className={`h-2.5 flex-1 ${
                    i < filled ? "bg-violet-500" : "bg-zinc-800"
                  }`}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
