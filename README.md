# MEXC Futures Liquidation Calculator (archived)

A Chrome extension that showed the estimated long and short liquidation prices on the MEXC futures trading page, before you opened a position.

**Status: archived.** I built this in February 2024. About a week later MEXC added the same thing to the trading page itself, so there was nothing left for the extension to do. The repo stays up as a record of the work.

## What it did

On `futures.mexc.com/exchange/*` it added one line at the bottom of the order form:

```
4.60% | Long Liq: 47700 | Short Liq: 52300
```

- The percentage is how far the price has to move against you to be liquidated.
- The two prices are where a long and a short opened at the last price would be liquidated.
- It recalculated whenever the last price or the leverage changed, and when you switched to another contract.

The point was to see it while still choosing the leverage, before opening anything.

## The calculation

I built the calculation by hand from the formula in MEXC's own FAQ: https://www.mexc.com/support/articles/360044646391

For an isolated-margin position:

```
maintenance margin = price × quantity × contract size × maintenance margin rate
position margin    = price × quantity × contract size ÷ leverage

long liquidation   = (maintenance margin − position margin + price × quantity × contract size) ÷ (quantity × contract size)
short liquidation  = (price × quantity × contract size − maintenance margin + position margin) ÷ (quantity × contract size)
```

Quantity and contract size cancel out, which leaves:

```
long liquidation  = price × (1 − 1/leverage + maintenance margin rate)
short liquidation = price × (1 + 1/leverage − maintenance margin rate)
```

Worked example at a price of 50,000, 20x leverage and a 0.4% maintenance margin rate: long 47,700, short 52,300, a 4.6% move either way.

`tests/calculation_test.js` and `tests/calculation_test.py` work the formula through an example: a long opened at 8,000 with 320 USDT of margin is liquidated at 7,712.

## How it worked

Everything is in [`src/js/mexc_liq_calc.js`](src/js/mexc_liq_calc.js), a content script.

- It reads the last price, the leverage and the contract's tick size straight from the page.
- `MutationObserver`s on the price and on the leverage control trigger a recalculation, so there is no polling.
- A second observer was meant to pick up the leverage slider inside its dialog, so the line would update while dragging. That part never worked reliably and is still a TODO in the file.
- The tick size is only in the page after its dropdown has been hovered, so the script sends a synthetic `mouseover` to make the page load it.

## Limits

These were the open items when MEXC shipped their own version:

- Isolated margin only. Cross margin is not handled.
- The maintenance margin rate is fixed at 0.4%, the first risk-limit tier. Larger positions fall into higher tiers with higher rates, and the result would be off for them.
- It reads the page by CSS class names and XPaths from the February 2024 site. Those change whenever MEXC redeploys, so do not expect it to find anything today.
- It is a Manifest V2 extension.

## Build

```
yarn
yarn run build
```

Then load the `build` folder from `chrome://extensions` with Developer mode on. Given the limits above, this is for reading the code, not for use.

## Credits

The project scaffold (Webpack setup, `utils/`, popup and options stubs) is Samuel Simões' [chrome-extension-webpack-boilerplate](https://github.com/samuelsimoes/chrome-extension-webpack-boilerplate), MIT licensed. The original license is kept in `LICENSE.md`.
