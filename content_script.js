const waitForPage = setTimeout(() => {
  console.log('############ Testing ############');
  // Get the orderbox node
  orderBoxElement = document.querySelector('//*[@id="mexc-web-inspection-futures-exchange-orderForm"]/div[2]/div[1]/section/div[2]/span');
  // Get the last price node
  priceElement = document.querySelector("div[class^='bar'] > div[class^='lastPrice']");
  // Return if either of them are not found
  if (!orderBoxElement || !priceElement) {
    return;
  }

  // Mutation Observers to detect changes to the slider and price
  orderBoxObserver = new MutationObserver(getLiq);
  orderBoxObserver.observe(orderBoxElement, { characterData: true, attributes: true, childList: true, subtree: true });
  priceObserver = new MutationObserver(getLiq);
  priceObserver.observe(priceElement, { characterData: true, attributes: false, childList: false, subtree: true });

  // Create a new div element with an id of "liqPrices"
  const liqPrices = document.createElement("div");
  liqPrices.id = "liqPrices";

  // Append the new element to the body of the page
  document.body.appendChild(liqPrices);

  // Style it to look like the Kucoin dark theme
  liqPrices.style.color = "#fafafa";
  liqPrices.style.backgroundColor = "#01081e";

  // Move it to the bottom right
  liqPrices.style.textAlign = "right";
  liqPrices.style.paddingRight = "15px";

  // Run once to get the initial values
  getLiq();

}, 6000);

let i = 1;

function getLiq() {

  // Get the value of the leverage slider
  let sliderVal = parseInt(document.querySelector("div[class^='rc-slider'] > div[class^='rc-slider-handle']").getAttribute("aria-valuenow"));

  // Get the value of the last price
  let lastPrice = priceElement.textContent;

  // Get the number of digits after the decimal
  let digits = lastPrice.includes(".") ? lastPrice.split(".")[1].length : 0;
  lastPrice = parseFloat(lastPrice);

  // Calculate the liquidation prices
  let liqPcnt = (100 / sliderVal);
  let liqPriceDist = lastPrice * (liqPcnt*1e-2); // move the decimal 2 places left
  let longLiqPrice = (lastPrice - liqPriceDist)*1.0659978;
  let shortLiqPrice = (lastPrice + liqPriceDist)*.99440022;

  // Add the liquidation prices to the new div and round them to the correct number of digits
  liqPrices.innerHTML = `${parseFloat(liqPcnt.toFixed(2))}% | <span style="color: #34cc94">Long</span> Liq: ${longLiqPrice.toFixed(digits)} | <span style="color: #da5c56">Short</span> Liq: ${shortLiqPrice.toFixed(digits)}`;

  // Debug
  console.log('############ Testing ############', i);
  console.log('Slider: ', sliderVal);
  console.log('Last Price: ', lastPrice);
  console.log('Liquidation %: ', parseFloat(liqPcnt.toFixed(2)));
  console.log('Liquidation Distance: ', liqPriceDist);
  console.log('Long Liquidation: ', longLiqPrice);
  console.log('Short Liquidation: ', shortLiqPrice);
  console.log(orderBoxElement, priceElement);

  i += 1;

}