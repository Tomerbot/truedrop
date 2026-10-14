# TrueDrop

**What does a drop rate really cost?** Games print their odds in fine print ("Legendary: 0.6%"), but nobody can feel what 0.6% means. TrueDrop turns those odds into money and time.

Type the odds your game publishes. TrueDrop plays 100,000 pretend players, stacks them into a crowd by how much each one paid, and prints the answer as a receipt: what a lucky player pays, what a typical player pays, what the unlucky ones pay, and how many weeks of allowance that is.

**Live demo:** https://tomerbot.github.io/truedrop/

## What it does
- **Simulate 100,000 players.** Chance per pull, price per pull, an optional guarantee ("pity" after N pulls), how many copies you need, and your weekly allowance.
- **The crowd.** Every dot is a group of players. Blue: luckiest 10%. Red: unluckiest 10%. A gold line marks the median.
- **The receipt.** Luckiest 10%, typical player, unluckiest 10%, worst 1 in 100, and the cost in weeks of allowance.
- **It checks itself.** The simulated average sits next to the exact average from probability math, so you can see the simulation is right.
- **Try pulling for free.** Pull with pretend money and feel the grind, then see what that legendary would have cost.
- **Share it.** Save the receipt as an image, or copy the address (the odds are stored in the link).

The example presets are made-up numbers, not any real game's odds.

## How it works
- **Web Worker** (`js/sim-worker.js`): the simulation runs off the main thread, so the page never freezes. Pulls until a win follow a geometric distribution, so each player's pulls are drawn directly with inverse transform sampling (`ceil(ln(1-U) / ln(1-p))`) instead of flipping 100,000 × hundreds of coins. A guarantee caps each draw at the pity number.
- **Exact math check:** with a guarantee after N pulls, the expected pulls per copy are `(1 - (1-p)^N) / p` (without one, `1/p`). The receipt shows that next to the simulated average.
- **Canvas** (`js/crowd.js`): the dot chart is drawn by hand, chunk by chunk, so you watch the crowd fill up. A huge "everyone hit the guarantee" column is cut off and labeled, so it doesn't flatten the rest.
- **Seeded randomness** (`js/rng.js`, mulberry32): add `?seed=76` to the address and every run repeats the same luck.
- No frameworks, no build step, no API keys, nothing sent to a server.

## Run it
It's a static site. Serve the folder with any web server (the Web Worker doesn't load from `file://`):

```bash
python -m http.server 8000
```

Then open http://localhost:8000.

## Credits
Built for Next Byte Hacks V5. Built with help from Claude (Anthropic): the idea, the code and the demo video were made together with Claude.
Fonts: Rubik and IBM Plex Mono (Google Fonts, SIL Open Font License).

## License
MIT. See [LICENSE](LICENSE).
