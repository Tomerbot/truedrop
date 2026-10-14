// The simulation runs here, in a Web Worker, so the page never freezes.
// Each pretend player keeps pulling until they get the item `copies` times.
importScripts("rng.js");

const BINS = 44;
const CHUNKS = 24; // the page draws the crowd chunk by chunk, so you can watch it fill up

self.onmessage = (event) => {
  const { chance, pity, copies, players, seed } = event.data;
  const random = makeRandom(seed);
  const logMiss = Math.log(1 - chance);
  const pulls = new Uint32Array(players);
  let pityHits = 0;

  for (let i = 0; i < players; i++) {
    let total = 0;
    for (let c = 0; c < copies; c++) {
      // Pulls until the first win follow a geometric distribution.
      // Drawing it directly (inverse transform) is exact and much faster than flipping a coin every pull.
      let n = chance >= 1 ? 1 : Math.max(1, Math.ceil(Math.log(1 - random()) / logMiss));
      if (pity && n >= pity) {
        n = pity;
        pityHits++;
      }
      total += n;
    }
    pulls[i] = total;
  }

  const sorted = pulls.slice().sort();
  const at = (q) => sorted[Math.min(players - 1, Math.floor(q * players))];
  let sum = 0;
  for (let i = 0; i < players; i++) sum += pulls[i];

  // The exact average from probability, to check the simulation against:
  // E[min(G, pity)] = (1 - (1 - p)^pity) / p, and copies add up.
  const exactPerCopy = pity ? (1 - Math.pow(1 - chance, pity)) / chance : 1 / chance;

  // Columns for the crowd chart: from the luckiest player to the 99.5th percentile.
  // Players beyond that go into the last column ("and more").
  const low = sorted[0];
  const high = Math.max(at(0.995), low + 1);
  const width = Math.max(1, Math.ceil((high - low + 1) / BINS));
  const bins = Math.ceil((high - low + 1) / width);
  const chunkSize = Math.ceil(players / CHUNKS);
  const chunks = [];
  for (let start = 0; start < players; start += chunkSize) {
    const counts = new Uint32Array(bins);
    for (let i = start; i < Math.min(players, start + chunkSize); i++) {
      counts[Math.min(bins - 1, Math.floor((pulls[i] - low) / width))]++;
    }
    chunks.push(counts);
  }

  self.postMessage({
    players,
    chunks,
    bins: { low, width, count: bins, overflow: sorted[players - 1] > low + bins * width - 1 },
    stats: {
      min: sorted[0],
      p10: at(0.10),
      median: at(0.5),
      p90: at(0.90),
      p99: at(0.99),
      max: sorted[players - 1],
      mean: sum / players,
      exactMean: exactPerCopy * copies,
      pityShare: pity ? pityHits / (players * copies) : 0,
    },
  });
};
