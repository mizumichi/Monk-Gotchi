export type SpriteFrame = string[];

export function PixelSprite({
  frame,
  pixelSize = 4,
  colorMap,
}: {
  frame: SpriteFrame;
  pixelSize?: number;
  colorMap: Record<string, string>;
}) {
  const rows = frame.length;
  const cols = frame[0]?.length ?? 0;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, ${pixelSize}px)`,
        gridAutoRows: `${pixelSize}px`,
        width: cols * pixelSize,
        imageRendering: 'pixelated',
      }}
    >
      {frame.flatMap((row, y) =>
        row.split('').map((char, x) => (
          <div
            key={`${y}-${x}`}
            style={{ backgroundColor: colorMap[char] ?? 'transparent' }}
          />
        ))
      )}
    </div>
  );
}
