export function slideProductRail(
  rail: HTMLElement,
  direction: -1 | 1,
  itemSelector: string,
): void {
  const item = rail.querySelector<HTMLElement>(itemSelector);
  const styles = getComputedStyle(rail);
  const gap = Number.parseFloat(styles.columnGap || styles.gap) || 16;
  const step = (item?.offsetWidth ?? rail.clientWidth) + gap;
  const visible = Math.max(1, Math.floor((rail.clientWidth + gap) / step));
  const rtl = styles.direction === 'rtl';
  rail.scrollBy({
    left: (rtl ? -1 : 1) * direction * visible * step,
    behavior: 'smooth',
  });
}

export function productRailEdges(rail: HTMLElement): { canPrev: boolean; canNext: boolean } {
  const max = Math.max(0, rail.scrollWidth - rail.clientWidth);
  const pos = normalizedScroll(rail, max);
  return {
    canPrev: pos > 4,
    canNext: max > 4 && pos < max - 4,
  };
}

function normalizedScroll(rail: HTMLElement, max: number): number {
  const left = rail.scrollLeft;
  if (getComputedStyle(rail).direction !== 'rtl') {
    return left;
  }

  // Chromium: 0 at the start, negative as the track moves toward the end.
  if (left <= 0) {
    return -left;
  }

  return Math.max(0, max - left);
}
