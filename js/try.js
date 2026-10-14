// "Try pulling for free": feel the grind with pretend money, using the same odds.
const TryMode = (() => {
  const SHOW = 10;
  const NAMES = { legendary: "Legendary", epic: "Epic", rare: "Rare", common: "Common" };
  let els, odds, random;
  let state;

  function setup(elements) {
    els = elements;
    els.pull1.addEventListener("click", () => pull(1));
    els.pull10.addEventListener("click", () => pull(10));
    els.reset.addEventListener("click", reset);
  }

  function setOdds(newOdds, seed) {
    odds = newOdds;
    random = makeRandom(seed);
    els.odds.textContent =
      `Your odds: ${odds.chanceText}% per pull, ` +
      (odds.pity ? `guaranteed at ${odds.pity} pulls, ` : "no guarantee, ") +
      `${odds.moneyLong(1)} per pull. Change them on the other tab.`;
    els.pityBox.hidden = !odds.pity;
    reset();
  }

  function reset() {
    state = { pulls: 0, since: 0, legends: 0, log: [] };
    els.verdict.hidden = true;
    render(0);
  }

  function pullOne() {
    state.pulls++;
    state.since++;
    const r = random();
    let rarity;
    if ((odds.pity && state.since >= odds.pity) || r < odds.chance) {
      rarity = "legendary";
    } else {
      const rest = (r - odds.chance) / (1 - odds.chance); // the other rarities are only for show
      rarity = rest < 0.05 ? "epic" : rest < 0.3 ? "rare" : "common";
    }
    state.log.push({ n: state.pulls, rarity });
    if (rarity === "legendary") {
      state.legends++;
      verdict(state.since);
      state.since = 0;
    }
  }

  async function pull(times) {
    els.pull1.disabled = els.pull10.disabled = true;
    for (let i = 0; i < times; i++) {
      pullOne();
      render(1);
      if (i < times - 1) await new Promise((done) => setTimeout(done, 140));
    }
    els.pull1.disabled = els.pull10.disabled = false;
  }

  function verdict(after) {
    // Exact: the chance the item came in fewer pulls is 1 - (1 - p)^(after - 1)
    const cheaper = Math.round((1 - Math.pow(1 - odds.chance, after - 1)) * 100);
    const guaranteed = odds.pity && after >= odds.pity;
    els.verdict.innerHTML = "";
    const title = document.createElement("strong");
    title.textContent = `Legendary after ${after} pull${after === 1 ? "" : "s"}!`;
    const body = document.createElement("span");
    body.textContent =
      `With real money that's ${odds.moneyLong(after)}. ` +
      (guaranteed ? "You only got it because of the guarantee. " : "") +
      `${cheaper}% of players get it cheaper.`;
    els.verdict.append(title, body);
    els.verdict.hidden = false;
  }

  function render(fresh) {
    els.pulls.textContent = state.pulls.toLocaleString("en-US");
    els.spent.textContent = odds.moneyLong(state.pulls);
    els.legend.textContent = state.legends;
    if (odds.pity) {
      els.pityText.textContent = `${odds.pity - state.since} pulls until it's guaranteed`;
      els.pityFill.style.width = `${(state.since / odds.pity) * 100}%`;
    }
    const recent = state.log.slice(-SHOW);
    els.tiles.innerHTML = "";
    for (let i = 0; i < SHOW; i++) {
      const li = document.createElement("li");
      const entry = recent[i];
      if (!entry) {
        li.className = "tile empty";
        li.setAttribute("aria-hidden", "true");
      } else {
        li.className = `tile ${entry.rarity}${fresh && i === recent.length - 1 ? " new" : ""}`;
        li.innerHTML = '<span class="gem"></span>';
        const name = document.createElement("span");
        name.textContent = NAMES[entry.rarity];
        const num = document.createElement("span");
        num.className = "num";
        num.textContent = `#${entry.n}`;
        li.append(name, num);
      }
      els.tiles.appendChild(li);
    }
  }

  return { setup, setOdds };
})();
