# TrueDrop design

## Concept
Games print their odds in fine print: "Legendary: 0.6%". Nobody can feel what 0.6% means.
TrueDrop turns those odds into a crowd you can see: 100,000 pretend players drop into stacks
by how much they paid. Then the answer prints as a store receipt, the one receipt in gaming
that costs you nothing.

## Color tokens
| Token | Hex | Use |
|---|---|---|
| `--felt` | `#2B1D5E` | Page background: the violet of a game's shop menu |
| `--panel` | `#382873` | Form and canvas panels |
| `--paper` | `#F4F5F0` | The receipt (cool thermal paper, not cream) |
| `--ink` | `#221B33` | Receipt text |
| `--legendary` | `#FFB627` | The one bright accent: the item you want, the median line, main buttons |
| `--rare` | `#57B8FF` | Lucky players (cheapest 10%) |
| `--unlucky` | `#FF6B57` | Unlucky players (most expensive 10%) |
| `--lilac` | `#CFC4FF` | Everyone in between, and body text on violet |

The colors are the rarity ladder players already know from games. Here they carry data, not decoration.

## Type
- **Rubik** (400/500/800): interface and headlines. Rounded and chunky like game UI, but easy to read.
- **IBM Plex Mono**: only on the receipt, because receipts are printed in monospace. Nowhere else.

## Layout
Desktop, three columns that fit one 1280×720 screen:
```
+-----------+------------------------------+-----------+
| The odds  |  The crowd (canvas)          | Receipt   |
| (form)    |  dots stack by money paid    | prints    |
|           |  median line in gold         | here      |
+-----------+------------------------------+-----------+
```
Left-aligned text everywhere; numbers on the receipt are right-aligned like a till.
Phone: the columns stack (odds, crowd, receipt).
Second tab, "Try pulling for free": a pull button, a row of the last 10 pulls, and a pity bar.

## Principles
1. **One loud thing:** the crowd of dots. Everything else is quiet.
2. **Numbers in money and time,** not percentages: "$112", "11 weeks of allowance".
3. **Show the proof:** the simulated average sits next to the exact formula average.
4. **One orchestrated moment:** dots stack, then the receipt prints. No other entrance animations.
5. Honest examples: presets are labeled as example numbers, never as a real game's odds.

## Rejected as generic
- A green casino table with gold chips: it would make gambling look glamorous, the opposite of the point.
- Near-black with a neon accent: the default "gaming" look.
- A row of identical stat cards: the receipt does that job with more character.
