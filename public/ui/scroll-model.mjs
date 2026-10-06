/** One reversible, pixel-based clock. There are no page sections or timed playback. */
export const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
export const letterWindow = index => ({ start: .006 + index * .0035, turn: .049, reveal: .021 });
export function wheelPixels(delta, mode, height) {
  return delta * (mode === 1 ? 16 : mode === 2 ? height : 1);
}
export function cameraPose(width, height, progress, manualOrbit = 0) {
  const aspect = width / height;
  const portrait = aspect < 1;
  const target = [-1.202680182821469, portrait ? 66 : 82.01817408535366, 2.9718346269194775];
  let position;
  if (portrait) position = [-10.9, 126.4, -90];
  else {
    const distance = aspect < 1.333 ? 97 : aspect < 1.778
      ? 97 + (aspect - 1.333) / .445 * 38.83 : 76.4047 * aspect;
    const vertical = aspect < 1.778 ? Math.max(0, (1.778 - aspect) / .445 * 10.6) : 0;
    position = [target[0] - .094629484 * distance, target[1] + .424707888 * distance + vertical, target[2] - .9003713 * distance];
  }
  // Six degrees over the ENTIRE narrative, preserving the cover's look-at and radius.
  const angle = (clamp(progress) * 6 + manualOrbit) * Math.PI / 180;
  const x = position[0] - target[0], z = position[2] - target[2];
  position[0] = target[0] + x * Math.cos(angle) + z * Math.sin(angle);
  position[2] = target[2] - x * Math.sin(angle) + z * Math.cos(angle);
  return { position, target, fov: 98 };
}
export function createScrollClock(length = 1) {
  let distance = Math.max(1, length), position = 0;
  return {
    get progress() { return position / distance; },
    get length() { return distance; },
    resize(nextLength) { const progress = position / distance; distance = Math.max(1, nextLength); position = progress * distance; },
    seek(progress) { position = clamp(progress) * distance; return this.progress; },
    advance(delta) { position = clamp(position + delta, 0, distance); return this.progress; },
  };
}
