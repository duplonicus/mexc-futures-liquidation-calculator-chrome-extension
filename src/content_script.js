/* 
    - Support linear and cross margin
    - Support risk limit tiers, current support is tier 1
    - Calculation: https://www.mexc.com/support/articles/360044646391
 */

let failCount = 0;
let priceElement;
let leverageElement;
let i = 0;
let liqPrices;

// Create observer object
let observer = new MutationObserver(getLiq);

// Create a new div element with an id of "liqPrices"
liqPrices = document.createElement("div");
liqPrices.id = "liqPrices";
document.body.appendChild(liqPrices);
liqPrices.style.position = "fixed";
liqPrices.style.bottom = "0";
liqPrices.style.right = "0";
liqPrices.style.backgroundColor = "#01081e";
liqPrices.style.color = "#fafafa";
liqPrices.style.padding = "15px";
liqPrices.style.fontSize = "14px";
liqPrices.style.setProperty("color", "#fafafa", "important"); // Force color to override other styles
liqPrices.style.setProperty("background-color", "#01081e", "important"); // Force background color to override other styles
liqPrices.textContent = 'Loading liquidation prices...'; // Add static content


console.log('waiting for page to load...');

const waitForPage = setTimeout(() => {

  // Call newTicker to start the process
  newTicker();

}, 10000);

// Runs at start and if the ticker changes
function newTicker() {
  
  // Get the leverage node
  leverageElement = document.evaluate('//*[@id="mexc-web-inspection-futures-exchange-orderForm"]/div[2]/div[1]/section/div[2]/span', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  // Get the last price node
  priceElement = document.evaluate('//*[@id="mexc-web-inspection-futures-exchange-orderbook"]/div[2]/div[2]/div[2]/span/div/h3/span[1]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  // Return if either of them are not found
  if (!leverageElement || !priceElement) {
    console.log('Price and/or Leverage elements not found!');
    // Try again in 3 seconds
    setTimeout(() => newTicker(), 3000);
    // Increment the fail count
    failCount += 1;
    console.log('Fail: ', failCount);
    // If we fail 5 times, stop trying
    if (failCount > 5) {
      console.log('Failed to find elements 5 times, stopping');
      observer.disconnect();
      return;
    }
  }
  // re-attach the observer
  observer.disconnect();
  observer.observe(leverageElement, { characterData: true, attributes: true, childList: true, subtree: true });
  observer.observe(priceElement, { characterData: true, attributes: false, childList: false, subtree: true });
  console.log('Mutation Observers started');
  //console.log(observer);
}

function getLiq() {

  // Check if the priceElement node is still valid and call newTicker if it's not
  //console.log('getLiq:priceElement ', priceElement);
  let newPriceElement = document.evaluate('//*[@id="mexc-web-inspection-futures-exchange-orderbook"]/div[2]/div[2]/div[2]/span/div/h3/span[1]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  if (newPriceElement != priceElement) {
    priceElement = newPriceElement;
    console.log('Ticker changed');
    //console.log('New priceElement: ', newPriceElement);
    setTimeout(() => newTicker(), 3000);
    return; 
  }

  // Get the value of the leverage slider
  let sliderVal = parseInt(document.evaluate('//*[@id="mexc-web-inspection-futures-exchange-orderForm"]/div[2]/div[1]/section/div[2]/span', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.textContent, 10);

  // Get the value of the last price
  let lastPrice = document.evaluate('//*[@id="mexc-web-inspection-futures-exchange-orderbook"]/div[2]/div[2]/div[2]/span/div/h3/span[1]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.textContent.trim();

  // Get the number of digits after the decimal
  let digits = lastPrice.toString().split(".")[1].length;

  // Replace commas with nothing and convert to a float
  lastPrice = lastPrice.replace(/,/g, '');
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
  console.log('Leverage: ', sliderVal);
  console.log('Last Price: ', lastPrice);
  console.log('Liquidation %: ', parseFloat(liqPcnt.toFixed(2)));
  console.log('Liquidation Distance: ', liqPriceDist);
  console.log('Long Liquidation: ', longLiqPrice);
  console.log('Short Liquidation: ', shortLiqPrice);
  console.log('Digits: ', digits);
  //console.log(leverageElement, priceElement);

  i += 1;

}

