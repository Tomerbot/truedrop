// The receipt: the result printed like a store receipt, and saved as an image to share.
const Receipt = (() => {
  function lines(r) {
    const { stats } = r.result;
    const cost = (pulls) => r.moneyLong(pulls);
    const close = Math.abs(stats.mean - stats.exactMean) / stats.exactMean < 0.02;
    const rows = [
      { kind: "store", text: "TrueDrop" },
      { kind: "sub", text: `Receipt for ${r.result.players.toLocaleString("en-US")} pretend players` },
      { kind: "line", left: `Legendary ×${r.copies}`, right: "" },
      { kind: "line", left: "Chance per pull", right: `${r.chanceText}%` },
      { kind: "line", left: "Guarantee", right: r.pity ? `at ${r.pity} pulls` : "none" },
      { kind: "line", left: "Price per pull", right: r.moneyLong(1) },
      { kind: "cut" },
      { kind: "line", left: "Luckiest 10%", right: `≤ ${cost(stats.p10)}` },
      { kind: "line big", left: "Typical player", right: cost(stats.median) },
      { kind: "line", left: "Unluckiest 10%", right: `≥ ${cost(stats.p90)}` },
      { kind: "line", left: "Worst 1 in 100", right: `≥ ${cost(stats.p99)}` },
      { kind: "cut" },
      { kind: "line", left: "Average, simulated", right: cost(stats.mean) },
      { kind: "line", left: "Average, exact math", right: cost(stats.exactMean) },
      { kind: "check", text: close ? "✓ The simulation matches the math" : "The simulation is off from the math" },
    ];
    if (r.pity) {
      rows.push({ kind: "line", left: "Reached the guarantee", right: `${Math.round(stats.pityShare * 100)}%` });
    }
    if (r.allowance > 0) {
      const weeks = (stats.median * r.price) / r.allowance;
      const shown = weeks < 10 ? weeks.toFixed(1).replace(/\.0$/, "") : Math.round(weeks).toLocaleString("en-US");
      rows.push({ kind: "total", text: `Typical cost: ${shown} week${shown === "1" ? "" : "s"} of allowance` });
    }
    rows.push({ kind: "thanks", text: `This receipt cost you ${r.moneyLong(0)}.` });
    return rows;
  }

  function render(el, r) {
    el.innerHTML = "";
    for (const row of lines(r)) {
      const div = document.createElement("div");
      if (row.kind.startsWith("line")) {
        div.className = row.kind;
        const left = document.createElement("span");
        left.textContent = row.left;
        const right = document.createElement("span");
        right.className = "num";
        right.textContent = row.right;
        div.append(left, right);
      } else {
        div.className = { store: "store", sub: "sub", cut: "cut", check: "ok", total: "total", thanks: "thanks" }[row.kind];
        div.textContent = row.text || "";
      }
      el.appendChild(div);
    }
    el.classList.remove("printing");
    void el.offsetWidth; // restart the print animation
    el.classList.add("printing");
  }

  function waiting(el) {
    el.classList.remove("printing");
    el.innerHTML = '<div class="waiting">Printing…</div>';
  }

  // Draw the same receipt on a canvas and download it as a PNG.
  async function save(r) {
    await document.fonts.ready;
    const rows = lines(r);
    const W = 720;
    const pad = 56;
    const lineH = 38;
    const H = 150 + rows.length * lineH + 120;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const c = canvas.getContext("2d");
    c.fillStyle = "#2B1D5E";
    c.fillRect(0, 0, W, H);
    c.fillStyle = "#F4F5F0";
    c.fillRect(40, 40, W - 80, H - 80);
    c.fillStyle = "#221B33";
    let y = 100;
    for (const row of rows) {
      c.textBaseline = "alphabetic";
      if (row.kind === "store") {
        c.font = "600 34px 'IBM Plex Mono', monospace";
        c.textAlign = "center";
        c.fillText(row.text, W / 2, y);
        y += 12;
      } else if (row.kind === "sub" || row.kind === "thanks" || row.kind === "check") {
        c.font = "400 20px 'IBM Plex Mono', monospace";
        c.textAlign = "center";
        c.fillStyle = row.kind === "check" ? "#1F7A3F" : "#221B33";
        c.fillText(row.text, W / 2, y);
        c.fillStyle = "#221B33";
      } else if (row.kind === "cut") {
        c.setLineDash([8, 8]);
        c.strokeStyle = "rgba(34, 27, 51, .5)";
        c.beginPath();
        c.moveTo(pad + 10, y - 14);
        c.lineTo(W - pad - 10, y - 14);
        c.stroke();
        c.setLineDash([]);
      } else if (row.kind === "total") {
        c.lineWidth = 3;
        c.strokeRect(pad + 10, y - 30, W - 2 * pad - 20, 48);
        c.font = "600 22px 'IBM Plex Mono', monospace";
        c.textAlign = "center";
        c.fillText(row.text, W / 2, y + 2);
        y += 18;
      } else {
        c.font = `${row.kind === "line big" ? "600 25px" : "400 22px"} 'IBM Plex Mono', monospace`;
        c.textAlign = "left";
        c.fillText(row.left, pad + 10, y);
        c.textAlign = "right";
        c.fillText(row.right, W - pad - 10, y);
      }
      y += lineH;
    }
    const link = document.createElement("a");
    link.download = "truedrop-receipt.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return { render, waiting, save };
})();
