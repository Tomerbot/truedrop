// Wires the page together: the odds form, the simulation worker, the crowd, the receipt and the tabs.
(() => {
  const PLAYERS = 100000;
  const PRESETS = {
    banner: { chance: "0.6", price: "2.00", pity: "90", copies: "1" },
    pack: { chance: "1", price: "1.99", pity: "", copies: "1" },
    chest: { chance: "0.25", price: "0.99", pity: "", copies: "1" },
  };
  const $ = (id) => document.getElementById(id);
  const form = $("odds");
  const fields = ["chance", "price", "pity", "copies", "allowance"].reduce((all, id) => ({ ...all, [id]: $(id) }), {});
  const currency = $("currency");
  const button = $("simulate");
  const error = $("form-error");
  const receipt = $("receipt");
  const saveButton = $("save");

  // ?seed=123 makes every run repeat the same luck (used for the demo video)
  const fixedSeed = Number(new URLSearchParams(location.search).get("seed")) || null;
  const worker = new Worker("js/sim-worker.js");
  let lastResult = null;

  const number = (text) => Number(String(text).trim().replace(",", "."));

  // Receipt amounts always show cents; chart labels drop them unless the amount is tiny.
  function moneyFormatter(symbol, price, decimals) {
    return (pulls) => {
      const amount = pulls * price;
      const digits = decimals === "auto" ? (amount >= 10 || Number.isInteger(amount) ? 0 : 2) : decimals;
      return symbol + amount.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
    };
  }

  // Read and check the form. Returns the odds, or null after showing what to fix.
  function readOdds() {
    Object.values(fields).forEach((f) => f.classList.remove("bad"));
    const fail = (field, message) => {
      field.classList.add("bad");
      field.focus();
      error.textContent = message;
      return null;
    };
    const chance = number(fields.chance.value);
    const price = number(fields.price.value);
    const pityText = fields.pity.value.trim();
    const pity = pityText ? number(pityText) : 0;
    const copies = number(fields.copies.value);
    const allowanceText = fields.allowance.value.trim();
    const allowance = allowanceText ? number(allowanceText) : 0;
    if (!(chance > 0 && chance <= 100)) return fail(fields.chance, "Chance per pull must be between 0 and 100%, like 0.6.");
    if (!(price >= 0)) return fail(fields.price, "Price per pull must be a number, like 2.00.");
    if (pityText && !(Number.isInteger(pity) && pity >= 1 && pity <= 100000)) {
      return fail(fields.pity, "The guarantee must be a whole number of pulls, or empty.");
    }
    if (!(Number.isInteger(copies) && copies >= 1 && copies <= 10)) return fail(fields.copies, "Copies must be a whole number from 1 to 10.");
    if (!(allowance >= 0)) return fail(fields.allowance, "Allowance must be a number, or empty.");
    error.textContent = "";
    const symbol = currency.value;
    return {
      chance: chance / 100,
      chanceText: String(chance),
      price,
      pity,
      copies,
      allowance,
      moneyLong: moneyFormatter(symbol, price, 2),
      moneyShort: moneyFormatter(symbol, price, "auto"),
    };
  }

  // Keep the odds in the address, so a link shares the exact scenario.
  function saveToAddress() {
    const params = new URLSearchParams({
      chance: fields.chance.value, price: fields.price.value, pity: fields.pity.value,
      copies: fields.copies.value, allowance: fields.allowance.value, currency: currency.value,
    });
    history.replaceState(null, "", `${location.pathname}${location.search}#${params}`);
  }

  function loadFromAddress() {
    const params = new URLSearchParams(location.hash.slice(1));
    for (const [id, field] of Object.entries(fields)) if (params.has(id)) field.value = params.get(id);
    if (params.has("currency")) currency.value = params.get("currency");
    showCurrency();
  }

  function showCurrency() {
    document.querySelectorAll(".cur").forEach((el) => (el.textContent = currency.value));
  }

  function simulate() {
    const odds = readOdds();
    if (!odds) return;
    saveToAddress();
    button.disabled = true;
    button.textContent = "Simulating…";
    saveButton.disabled = true;
    Receipt.waiting(receipt);
    const seed = fixedSeed || randomSeed();
    TryMode.setOdds(odds, seed + 1);
    worker.onmessage = async (event) => {
      const result = event.data;
      await Crowd.show(result, odds.moneyShort, odds.pity, odds.copies);
      lastResult = { ...odds, result };
      Receipt.render(receipt, lastResult);
      button.disabled = false;
      button.textContent = "Simulate 100,000 players";
      saveButton.disabled = false;
    };
    worker.postMessage({ chance: odds.chance, pity: odds.pity, copies: odds.copies, players: PLAYERS, seed });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    simulate();
  });

  document.querySelectorAll("[data-preset]").forEach((preset) => {
    preset.addEventListener("click", () => {
      for (const [id, value] of Object.entries(PRESETS[preset.dataset.preset])) fields[id].value = value;
      document.querySelectorAll("[data-preset]").forEach((b) => b.setAttribute("aria-pressed", String(b === preset)));
      simulate();
    });
  });

  currency.addEventListener("change", showCurrency);
  saveButton.addEventListener("click", () => lastResult && Receipt.save(lastResult));

  // Tabs
  const tabs = [$("tab-sim"), $("tab-try")];
  function selectTab(tab) {
    for (const t of tabs) {
      const on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      $(t.getAttribute("aria-controls")).hidden = !on;
    }
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => selectTab(tab));
    tab.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      const next = tabs[(i + (event.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
      selectTab(next);
      next.focus();
    });
  });

  Crowd.setup($("crowd"), $("crowd-caption"));
  TryMode.setup({
    odds: $("try-odds"), pull1: $("pull1"), pull10: $("pull10"), reset: $("reset-try"),
    pulls: $("m-pulls"), spent: $("m-spent"), legend: $("m-legend"),
    pityBox: $("pity-box"), pityText: $("pity-text"), pityFill: $("pity-fill"),
    tiles: $("tiles"), verdict: $("verdict"),
  });
  loadFromAddress();
  document.fonts.ready.then(simulate); // open with a finished example, so the page is never empty
})();
