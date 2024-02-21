/* 
  Mexc Liquidation Price Estimator

  - TODO: Check leverage slider before the button - observer not working
  - TODO: Support cross collateral, current support is isolated
  - TODO: Support dynamic risk limit tiers, current support is tier 1
  - TODO: Add dynamic amount of contracts - only matters if using risk limit tiers
  
  - Calculation: https://www.mexc.com/support/articles/360044646391
*/

let failCount = 0;      // In case it doesn't work or the site doesn't load
let i = 0;              // Debug counter
let leverageSliderElement;  // Leverage slider element

// Create observer object
let observer = new MutationObserver(getLiq);

// Create a new div element with an id of "liqPrices"
liqPrices = document.createElement("div");
liqPrices.id = "liqPrices";
liqPrices.style.position = "fixed";
liqPrices.style.bottom = "0";
liqPrices.style.left = "0";
liqPrices.style.backgroundColor = "#111214";
liqPrices.style.color = "#fafafa";
liqPrices.style.padding = "10px";
liqPrices.style.fontSize = "14px";
liqPrices.textContent = 'Loading liquidation prices...'; // Add static content

// Wait for the page to load
console.log('Waiting for page to load...');

const waitForPage = setTimeout(() => {

  // Get the parent element to append the new div to, it appears at the bottom of the order form
  const orderFormElement = document.querySelector('#mexc-web-inspection-futures-exchange-orderForm > div.handle_handleWrapper__TQ__L > div.ant-row.ant-row-middle.handle_vouchers__ZQ55K');
  orderFormElement.appendChild(liqPrices);
  console.log('Liq prices div appended to order form')

    // Global observer to watch for the addition of the slider
  let globalObserver = new MutationObserver((mutations, observer) => {
    for (let mutation of mutations) {
      if (mutation.addedNodes.length) {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1 && node.matches('div.LeverageProgress_sliderWrapper__jwV3K')) { // Check if the node is an element and matches the leverage slider
            console.log('Leverage slider added to the DOM');

            // Now that the slider is added, observe it for changes
            let sliderObserver = new MutationObserver(sliderMutationCallback);
            sliderObserver.observe(node, { attributes: true });

            // Optionally, disconnect the global observer if it's no longer needed
            globalObserver.disconnect();
          }
        });
      }
    }
  });

  // Callback function for the slider observer
  function sliderMutationCallback(mutations, observer) {
    mutations.forEach(mutation => {
      console.log('Slider changed:', mutation);
      // Call newTicker to update the liquidation prices
      newTicker();
    });
  }

  // Start observing the entire document for the addition of the slider
  globalObserver.observe(document.body, { childList: true, subtree: true });

  // Call newTicker to start the observer
  newTicker();
  console.log('First call of newTicker...')

}, 8000); // Wait for 5 seconds before running this code

// Runs at start and if the ticker changes
function newTicker() {
  console.log('New Ticker function called');

  // Hover over the orderbook dropdown to load the tick size

  // CSS selector to get the tick size parent node
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
  wait(2000);
  
  // Get the tick size from the dropdown - not sure why this is throwing an exception
  try {
    if (tickSizeParent != null) {
      tickSize = parseFloat(document.querySelector("ul > li > .ant-dropdown-menu-title-content").textContent.trim());
    } else {
      setTimeout(() => newTicker(), 3000);
      return;
    }
  } catch (error) {
    // Try again
    console.log('Error getting tick size: ', error);
    setTimeout(() => newTicker(), 3000);
    return;
  }

  // Get the leverage node
  leverageButtonElement = document.evaluate('//*[@id="mexc-web-inspection-futures-exchange-orderForm"]/div[2]/div[1]/section/div[2]/span', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  // Get the last price node
  priceElement = document.evaluate('//*[@id="mexc-web-inspection-futures-exchange-orderbook"]/div[2]/div[2]/div[2]/span/div/h3/span[1]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  // Return if either of them are not found
  if (!leverageButtonElement || !priceElement || !tickSize) {
    console.log('Price, leverage, or tick size elements not found! Retrying...');
    // Increment the fail count
    failCount += 1;
    console.log('Fail: ', failCount);
    // Try again in 3 seconds
    wait(3000);
    newTicker();
    return;
    }
  
  // Attach or re-attach the observer
  observer.disconnect();
  observer.observe(leverageButtonElement, { characterData: true, attributes: true, childList: true, subtree: true });
  observer.observe(priceElement, { characterData: true, attributes: false, childList: false, subtree: true });
  console.log('Mutation Observer started');

  // Get the tick size
  console.log('Tick Size: ', tickSize);

  // Hover on some other element to close the dropdown - doesn't work
  leverageButtonElement.dispatchEvent(hoverEvent);
  }

// Liquidation price calculation
function getLiq() {

  // Check if the priceElement node is still valid and call newTicker if it's not
  let newPriceElement = document.evaluate('//*[@id="mexc-web-inspection-futures-exchange-orderbook"]/div[2]/div[2]/div[2]/span/div/h3/span[1]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  if (newPriceElement != priceElement) {
    priceElement = newPriceElement;
    liqPrices.innerHTML = 'Changing ticker...';
    console.log('Ticker changed');
    setTimeout(() => newTicker(), 1000);
    return; 
  }

  // Get the leverage value
  // Use the slider first, then the button if the slider is not found

  try {
  var sliderVal = parseInt(document.querySelector("div > div.LeverageProgress_leverageWrapper__YjWN7 > div.LeverageProgress_sliderWrapper__jwV3K > div > div.ant-slider-handle").attributes['aria-valuenow'].value);
  } catch (error) {
    console.log('Error getting slider value: ', error);
  }
  
  let buttonVal = parseInt(document.evaluate('//*[@id="mexc-web-inspection-futures-exchange-orderForm"]/div[2]/div[1]/section/div[2]/span', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.textContent, 10);

  // Get the value of the last price
  let lastPrice = document.evaluate('//*[@id="mexc-web-inspection-futures-exchange-orderbook"]/div[2]/div[2]/div[2]/span/div/h3/span[1]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.textContent.trim();
  // Replace commas with nothing and convert to a float
  lastPrice = lastPrice.replace(/,/g, '');
  lastPrice = parseFloat(lastPrice);

  // Get the number of digits after the decimal
  let decimal_places = 0;
  try {
    const decimalIndex = lastPrice.toString().indexOf(".");
    if (decimalIndex !== -1) {
      decimal_places = lastPrice.toString().split(".")[1].length;
    }
  } catch (error) {
    console.log('Error getting decimal places: ', error);
  }

  // Values needed for the calculation
  const maintenance_margin_rate = 0.004;  // Hardcoded value, TODO: Get tiers
  const position_size = tickSize;  // Position size == tick size
  const quantity = 100;  // Quantity of contracts, TODO: Get from the UI
  const opening_price = lastPrice;  // USDT, opening price per contract, for this it's the last price
  const leverage = sliderVal || buttonVal;

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
  console.log('Leverage: ', buttonVal, sliderVal);
  console.log('Last Price: ', lastPrice);
  console.log('Liquidation %: ', parseFloat(liqPcnt.toFixed(2)));
  console.log('Long Liquidation: ', long_liquidation_price);
  console.log('Short Liquidation: ', short_liquidation_price);
  console.log('decimal_places: ', decimal_places);

  i += 1;

}

// Sleep function for debugging -> Use sleep() 
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function wait(ms) {
  await sleep(ms);
}