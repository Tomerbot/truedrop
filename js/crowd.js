// The crowd chart: every dot is a group of pretend players, stacked by how much they paid.
const Crowd = (() => {
  const COLOR = { lucky: "#57B8FF", middle: "#CFC4FF", unlucky: "#FF6B57", gold: "#FFB627", text: "#CFC4FF" };
  const NICE = [1, 2, 5, 10, 20, 25, 50, 75, 100, 150, 200, 250, 300, 400, 500, 750, 1000, 1500, 2000, 2500,
                3000, 4000, 5000, 7500, 10000, 25000, 50000];
  const STEP_MS = 70;
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

  let canvas, ctx, caption;
  let current = null; // { result, money, pity, copies, shown }
  let frame = 0;

  function setup(canvasEl, captionEl) {
    canvas = canvasEl;
    ctx = canvas.getContext("2d");
    caption = captionEl;
    new ResizeObserver(() => current && draw()).observe(canvas);
  }

  // Play the result in: chunks of players arrive one after another.
  function show(result, money, pity, copies) {
    cancelAnimationFrame(frame);
    const total = new Uint32Array(result.bins.count);
    current = { result, money, pity, copies, shown: new Uint32Array(result.bins.count), final: total };
    for (const chunk of result.chunks) chunk.forEach((n, i) => (total[i] += n));

    return new Promise((resolve) => {
      if (reducedMotion.matches || document.hidden) { // hidden tabs pause animation frames
        current.shown = total;
        draw();
        resolve();
        return;
      }
      let added = 0;
      let last = 0;
      const step = (time) => {
        if (time - last >= STEP_MS) {
          last = time;
          result.chunks[added].forEach((n, i) => (current.shown[i] += n));
          added++;
          draw();
        }
        if (added < result.chunks.length) frame = requestAnimationFrame(step);
        else resolve();
      };
      frame = requestAnimationFrame(step);
    });
  }

  function draw() {
    const { result, money, pity, copies, shown, final } = current;
    const { bins, stats } = result;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const pad = { left: 6, right: 6, top: 44, bottom: 34 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;
    const colW = plotW / bins.count;
    const dot = Math.max(2, Math.min(colW * 0.74, 11));
    const rowH = dot * 1.12;
    const maxDots = Math.max(1, Math.floor(plotH / rowH));
    // With one copy, everyone who reaches the guarantee paid exactly the same, so they pile up in one
    // column that can dwarf the rest. That column is cut off at the top and labeled with its real size.
    const wall = pity && copies === 1 ? Math.min(bins.count - 1, Math.floor((pity - bins.low) / bins.width)) : -1;
    const tallest = Math.max(1, ...Array.from(final).filter((_, i) => i !== wall));
    const perDot = NICE.find((n) => n >= Math.ceil(tallest / maxDots)) || Math.ceil(tallest / maxDots);
    caption.textContent = `Every dot is ${perDot.toLocaleString("en-US")} player${perDot === 1 ? "" : "s"}, stacked by how much they paid.`;

    const pullsToX = (pulls) => pad.left + ((pulls - bins.low) / (bins.width * bins.count)) * plotW;
    const baseY = pad.top + plotH;

    for (let i = 0; i < bins.count; i++) {
      const from = bins.low + i * bins.width;
      const to = from + bins.width - 1;
      // A column takes the color of the luckiest/unluckiest 10% as soon as it holds some of them.
      // The guarantee column stays neutral: it holds far more than 10% of players.
      const color = i === wall ? COLOR.middle : from <= stats.p10 ? COLOR.lucky : to >= stats.p90 ? COLOR.unlucky : COLOR.middle;
      const dots = shown[i] ? Math.min(Math.ceil(shown[i] / perDot), maxDots) : 0;
      const cut = i === wall && Math.ceil(shown[i] / perDot) > maxDots;
      const cx = pad.left + colW * (i + 0.5);
      ctx.fillStyle = color;
      for (let d = 0; d < dots; d++) {
        ctx.globalAlpha = cut && d >= dots - 3 ? 0.25 + 0.25 * (dots - 1 - d) : 1; // fade out: "keeps going"
        ctx.beginPath();
        ctx.arc(cx, baseY - rowH * (d + 0.5), dot / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // Baseline and money ticks
    ctx.strokeStyle = "rgba(207, 196, 255, .35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.left, baseY + 0.5);
    ctx.lineTo(w - pad.right, baseY + 0.5);
    ctx.stroke();
    ctx.fillStyle = COLOR.text;
    ctx.font = "500 12px Rubik, sans-serif";
    ctx.textBaseline = "top";
    const ticks = 5;
    for (let t = 0; t <= ticks; t++) {
      const pulls = bins.low + Math.round((bins.width * bins.count * t) / ticks);
      const label = money(pulls) + (t === ticks && bins.overflow ? "+" : "");
      ctx.textAlign = t === 0 ? "left" : t === ticks ? "right" : "center";
      ctx.fillText(label, pad.left + (plotW * t) / ticks, baseY + 8);
    }

    if (wall >= 0 && shown[wall] && stats.pityShare > 0.02) {
      const top = baseY - rowH * Math.min(Math.ceil(shown[wall] / perDot), maxDots) - 6;
      const players = Math.round((stats.pityShare * result.players) / 100) * 100;
      ctx.fillStyle = COLOR.unlucky;
      ctx.font = "800 13px Rubik, sans-serif";
      ctx.textBaseline = "bottom";
      ctx.textAlign = "right";
      ctx.fillText(`${players.toLocaleString("en-US")} players hit the guarantee`, pad.left + colW * wall - 4,
                   Math.max(top + 14, pad.top + 34));
    }

    // The median line, once the crowd is complete
    if (shown === final || shown.every((n, i) => n === final[i])) {
      const x = pullsToX(stats.median + 0.5);
      ctx.strokeStyle = COLOR.gold;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(x, pad.top - 8);
      ctx.lineTo(x, baseY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = COLOR.gold;
      ctx.font = "800 14px Rubik, sans-serif";
      ctx.textBaseline = "bottom";
      const label = `Half of players paid ${money(stats.median)} or more`;
      const width = ctx.measureText(label).width;
      ctx.textAlign = x + width + 8 < w ? "left" : x - width - 8 > 0 ? "right" : "center";
      const lx = ctx.textAlign === "left" ? x + 6 : ctx.textAlign === "right" ? x - 6 : w / 2;
      ctx.fillText(label, lx, pad.top - 12);
    }
  }

  return { setup, show };
})();
