// A small seeded random number generator (mulberry32).
// The same seed always gives the same "luck", so a demo or a shared link can be replayed.
// Used by the page and by the Web Worker (through importScripts).
function makeRandom(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomSeed() {
  return (Math.random() * 4294967296) >>> 0;
}
