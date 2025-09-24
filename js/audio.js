export function createAudio(src) {
  const a = new Audio(src);
  a.preload = "auto";
  a.volume = 0.5;
  return a;
}
