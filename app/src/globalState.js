// Shared state between Landing and Play pages
const getMidnight = () => {
  const now = new Date();
  const m = new Date(now);
  m.setHours(0,0,0,0);
  return m.getTime();
};
const secondsToday = () => Math.floor((Date.now() - getMidnight()) / 1000);

export const getInitialJackpot = () => Math.max(520, parseFloat((520 + secondsToday() * 0.0019).toFixed(2)));
export const getInitialVolume = () => Math.max(28000, Math.floor(28000 + secondsToday() * 0.38));

let jackpot = getInitialJackpot();
let volume = getInitialVolume();
const listeners = new Set();

setInterval(() => {
  jackpot = parseFloat((jackpot + 0.0019 + Math.abs(Math.random() * 0.001)).toFixed(2));
  volume = volume + Math.floor(Math.random() * 3) + 1;
  listeners.forEach(fn => fn({ jackpot, volume }));
}, 1000);

export function subscribeStats(fn) {
  listeners.add(fn);
  fn({ jackpot, volume });
  return () => listeners.delete(fn);
}
