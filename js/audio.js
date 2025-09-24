export function createAudio(src, volume = 0.5) {
  const a = new Audio(src);
  a.preload = "auto";
  a.volume = volume;
  return a;
}
