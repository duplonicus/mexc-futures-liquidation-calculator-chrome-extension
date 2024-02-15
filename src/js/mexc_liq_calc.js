/* 
    Mexc Liquidation Price Estimator
    - TODO: Support cross collateral, current support is isolated
    - TODO: Support dynamic risk limit tiers, current support is tier 1
    - TODO: Add dynamic amount of contracts
    - Calculation: https://www.mexc.com/support/articles/360044646391
 */

let failCount = 0;      // In case it doesn't work or the site doesn't load
let priceElement;       // The last price element
let leverageElement;    // The leverage element
let i = 0;              // Debug counter
let liqPrices;          // The div that will hold the liquidation info
let tickSize;           // The tick size

// Create observer object
let observer = new MutationObserver(getLiq);

// Create a new div element with an id of "liqPrices"
liqPrices = document.createElement("div");
liqPrices.id = "liqPrices";
liqPrices.style.position = "fixed";
liqPrices.style.bottom = "0";
liqPrices.style.right = "0";
liqPrices.style.backgroundColor = "#111214";
liqPrices.style.color = "#fafafa";
liqPrices.style.padding = "15px";
liqPrices.style.fontSize = "14px";
liqPrices.textContent = 'Loading liquidation prices...'; // Add static content

// Wait for the page to load
console.log('Waiting for page to load...');

const waitForPage = setTimeout(() => {

  // Get the parent element to append the new div to, it appears at the bottom of the order form
  let parentElement = document.evaluate('//*[@id="mexc-web-inspection-futures-exchange-orderForm"]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  parentElement.appendChild(liqPrices);

  // Call newTicker to start the observer
  newTicker();

}, 8000); // Wait for 8 seconds

// Runs at start and if the ticker changes
function newTicker() {

  // Hover over the orderbook dropdown to load the tick size
  // Using the CSS selector to get the tick size parent node
  const tickSizeParent = document.querySelector('#mexc-web-inspection-futures-exchange-orderbook > div.market_moduleHeader__QgYk8 > div > div.market_rightActions__T5xwF > span');

  // Create a mouseover event
  const hoverEvent = new MouseEvent('mouseover', {
    view: window, // The window object
    bubbles: true, // Whether the event will bubble up through the DOM or not
    cancelable: false // Whether the event can be canceled or not
  });

  // Dispatch the event to the element
  tickSizeParent.dispatchEvent(hoverEvent); // This will trigger the dropdown to load the tick size

  // Attempt to fix the exception below
  wait_for_ms(5000); // Wait for 1 second

  // Get the tick size from the dropdown
  try {
    tickSize = parseFloat(document.querySelector("ul > li > .ant-dropdown-menu-title-content").textContent.trim());
  } catch (error) {
    console.log('Error getting tick size: ', error);
    setTimeout(() => newTicker(), 3000);
    return;
  }

  // Get the leverage node
  leverageElement = document.evaluate('//*[@id="mexc-web-inspection-futures-exchange-orderForm"]/div[2]/div[1]/section/div[2]/span', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  // Get the last price node
  priceElement = document.evaluate('//*[@id="mexc-web-inspection-futures-exchange-orderbook"]/div[2]/div[2]/div[2]/span/div/h3/span[1]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  // Return if either of them are not found
  if (!leverageElement || !priceElement || !tickSize) {
    console.log('Price, leverage, or tick size elements not found! Retrying...');
    // Try again in 3 seconds
    setTimeout(() => newTicker(), 3000);
    // Increment the fail count
    failCount += 1;
    console.log('Fail: ', failCount);
    // If we fail 5 times, stop trying
    if (failCount > 5) {
      console.log('Failed to find elements 5 times! Stopping...');
      observer.disconnect();
      return;
    }
  }
  // Attach or re-attach the observer
  observer.disconnect();
  observer.observe(leverageElement, { characterData: true, attributes: true, childList: true, subtree: true });
  observer.observe(priceElement, { characterData: true, attributes: false, childList: false, subtree: true });
  console.log('Mutation Observer started');

  // Get the tick size
  console.log('Tick Size: ', tickSize);

  // Hover on some other element to close the dropdown
  leverageElement.dispatchEvent(hoverEvent);
}

// Liquidation price calculation
function getLiq() {

  // Check if the priceElement node is still valid and call newTicker if it's not
  let newPriceElement = document.evaluate('//*[@id="mexc-web-inspection-futures-exchange-orderbook"]/div[2]/div[2]/div[2]/span/div/h3/span[1]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  if (newPriceElement != priceElement) {
    priceElement = newPriceElement;
    console.log('Ticker changed');
    setTimeout(() => newTicker(), 1000);
    return; 
  }

  // Get the value of the leverage slider
  let sliderVal = parseInt(document.evaluate('//*[@id="mexc-web-inspection-futures-exchange-orderForm"]/div[2]/div[1]/section/div[2]/span', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.textContent, 10);

  // Get the value of the last price
  let lastPrice = document.evaluate('//*[@id="mexc-web-inspection-futures-exchange-orderbook"]/div[2]/div[2]/div[2]/span/div/h3/span[1]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.textContent.trim();
  // Replace commas with nothing and convert to a float
  lastPrice = lastPrice.replace(/,/g, '');
  lastPrice = parseFloat(lastPrice);

  // Get the number of digits after the decimal
  try {
    var decimal_places = lastPrice.toString().split(".")[1].length;
  }
  catch (error) {
    console.log('Error getting decimal places: ', error);
  }

  //let decimal_places = lastPrice.toString().split(".")[1].length;

  // Values needed for the calculation
  const maintenance_margin_rate = 0.004;  // Hardcoded value, TODO: Get tiers
  const position_size = tickSize;  // Position size == tick size
  const quantity = 100;  // Quantity of contracts, TODO: Get from the UI
  const opening_price = lastPrice;  // USDT, opening price per contract, for this it's the last price
  const leverage = sliderVal;  // Initial leverage multiple

  // Calculate Maintenance Margin
  const maintenance_margin = opening_price * quantity * position_size * maintenance_margin_rate;

  // Calculate Position Margin
  const position_margin = (opening_price * quantity * position_size) / leverage;

  // Liquidation Price calculation for Long position
  const long_liquidation_price = (maintenance_margin - position_margin + (opening_price * quantity * position_size)) / (quantity * position_size);

  // Liquidation Price calculation for Short position
  const short_liquidation_price = ((opening_price * quantity * position_size) - maintenance_margin + position_margin) / (quantity * position_size);
  
  // Get the difference between the liquidation price and the last price as a percentage
  let difference = Math.abs(long_liquidation_price - lastPrice);  // Use Math.abs() to get the absolute value nad return a positive number
  let liqPcnt = (difference / lastPrice) * 100; // Convert to a percentage

  // Add the liquidation prices to the new div and round them to the correct number of digits
  liqPrices.innerHTML = `${liqPcnt.toFixed(2)}% | <span style="color: #34cc94">Long</span> Liq: ${long_liquidation_price.toFixed(decimal_places)} | <span style="color: #da5c56">Short</span> Liq: ${short_liquidation_price.toFixed(decimal_places)}`;

  // Debug
  console.log('############ Testing ############', i);
  console.log('Leverage: ', sliderVal);
  console.log('Last Price: ', lastPrice);
  console.log('Liquidation %: ', parseFloat(liqPcnt.toFixed(2)));
  console.log('Long Liquidation: ', long_liquidation_price);
  console.log('Short Liquidation: ', short_liquidation_price);
  console.log('Digits: ', decimal_places);

  i += 1;

}

// Sleep function for debugging
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// This is the only way it will work because setTimeout is not a promise 
async function wait_for_ms(ms) {
  await sleep(ms);
}