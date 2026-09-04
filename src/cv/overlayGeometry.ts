export type ViewSize = { width: number; height: number };
export type SourceSize = { width: number; height: number };

/**
 * Maps a normalized landmark onto a preview that uses "cover" scaling.
 * Without source dimensions we assume the view exactly fits the image.
 */
export function keypointToViewPx(
  point: { x: number; y: number },
  view: ViewSize,
  source: SourceSize | null | undefined,
  mirrorX: boolean
): { x: number; y: number } {
  const width = view.width || 1;
  const height = view.height || 1;

  let drawX = 0;
  let drawY = 0;
  let drawWidth = width;
  let drawHeight = height;

  if (source && source.width > 0 && source.height > 0) {
    const scale = Math.max(width / source.width, height / source.height);
    drawWidth = source.width * scale;
    drawHeight = source.height * scale;
    drawX = (width - drawWidth) / 2;
    drawY = (height - drawHeight) / 2;
  }

  const xFraction = mirrorX ? 1 - point.x : point.x;
  return {
    x: drawX + xFraction * drawWidth,
    y: drawY + point.y * drawHeight
  };
}
