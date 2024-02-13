function getMaintenanceMarginRate(quantity) {
    /**
     * Get the maintenance margin rate based on the quantity of contracts.
     *
     * @param {number} quantity - The quantity of contracts.
     * @returns {number} The maintenance margin rate.
     */

    // Define the tiers based on the quantity of contracts and their corresponding maintenance margin rates
    const tiers = [
        [0, 525000, 0.004],       // Tier 1: 0 - 525,000 contracts, 0.4% maintenance margin
        [525000, 1050000, 0.008], // Tier 2: 525,000 - 1,050,000 contracts, 0.8% maintenance margin
        [1050000, 1575000, 0.012],// Tier 3: 1,050,000 - 1,575,000 contracts, 1.2% maintenance margin
        [1575000, 2100000, 0.016],// Tier 4: 1,575,000 - 2,100,000 contracts, 1.6% maintenance margin
        [2100000, 2625000, 0.02]  // Tier 5: 2,100,000 - 2,625,000 contracts, 2% maintenance margin
    ];

    // Find the correct tier based on the quantity of contracts and return the corresponding maintenance margin rate
    for (const [lowerBound, upperBound, rate] of tiers) {
        if (lowerBound <= quantity && quantity < upperBound) {
            return rate;
        }
    }
    // If quantity is above all defined tiers, return the highest tier's rate
    return tiers[tiers.length - 1][2];
}

function calculateIsolatedLiquidationPriceWithTiers(averageOpeningPrice, quantity, positionSize, positionMargin, isLong) {
    /**
     * Calculate the liquidation price for an isolated margin mode position, taking into account tiered maintenance margins.
     *
     * @param {number} averageOpeningPrice - The average price at which the position was opened.
     * @param {number} quantity - The quantity of contracts.
     * @param {number} positionSize - The size of each contract.
     * @param {number} positionMargin - The margin allocated for the position.
     * @param {boolean} isLong - True for a long position, False for a short position.
     * @returns {number} The liquidation price.
     */
    
    // Get the maintenance margin rate based on the quantity
    const maintenanceMarginRate = 0.004; // 0.4%
    // Calculate the maintenance margin
    const maintenanceMargin = averageOpeningPrice * quantity * positionSize * maintenanceMarginRate;

    let liquidationPrice;
    if (isLong) {
        liquidationPrice = (maintenanceMargin - positionMargin + averageOpeningPrice * quantity * positionSize) / (quantity * positionSize);
    } else {
        liquidationPrice = (averageOpeningPrice * quantity * positionSize - maintenanceMargin + positionMargin) / (quantity * positionSize);
    }

    return liquidationPrice;
}

// Example parameters for a long position
const averageOpeningPrice = 8000;  // USDT
const quantity = 10000;
const positionSize = 0.0001;  // Assuming this represents the contract size
const positionMargin = 320;  // USDT
const isLong = true;  // True for long, False for short

// Calculate liquidation price with tiers
const liquidationPriceWithTiers = calculateIsolatedLiquidationPriceWithTiers(averageOpeningPrice, quantity, positionSize, positionMargin, isLong);
console.log(liquidationPriceWithTiers);
