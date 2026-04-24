export default function CharacterDisplay() {
  return (
    <div className="border-2 border-violet-500 bg-zinc-900 p-5 flex flex-col items-center gap-2 sm:min-w-[160px]">
      <div
        className="text-7xl leading-none select-none"
        role="img"
        aria-label="キャラクター: たまご"
      >
        🐣
      </div>
      <p className="font-mono font-bold text-zinc-100 text-sm tracking-wide">
        たまご
      </p>
      <p className="font-mono text-xs text-violet-400 tracking-widest">
        Day 1 / 7
      </p>
    </div>
  );
}
