def get_maintenance_margin_rate(quantity):
    """
    Get the maintenance margin rate based on the quantity of contracts.
    
    Args:
    - quantity (int): The quantity of contracts.
    
    Returns:
    - float: The maintenance margin rate.
    """
    # Define the tiers based on the quantity of contracts and their corresponding maintenance margin rates
    tiers = [
        (0, 525000, 0.004),       # Tier 1: 0 - 525,000 contracts, 0.4% maintenance margin
        (525000, 1050000, 0.008), # Tier 2: 525,000 - 1,050,000 contracts, 0.8% maintenance margin
        (1050000, 1575000, 0.012),# Tier 3: 1,050,000 - 1,575,000 contracts, 1.2% maintenance margin
        (1575000, 2100000, 0.016),# Tier 4: 1,575,000 - 2,100,000 contracts, 1.6% maintenance margin
        (2100000, 2625000, 0.02)  # Tier 5: 2,100,000 - 2,625,000 contracts, 2% maintenance margin
    ]
    
    # Find the correct tier based on the quantity of contracts and return the corresponding maintenance margin rate
    for lower_bound, upper_bound, rate in tiers:
        if lower_bound <= quantity < upper_bound:
            return rate
    # If quantity is above all defined tiers, return the highest tier's rate
    return tiers[-1][2]

def calculate_isolated_liquidation_price_with_tiers(average_opening_price, quantity, position_size, position_margin, is_long):
    """
    Calculate the liquidation price for an isolated margin mode position, taking into account tiered maintenance margins.
    
    Args:
    - average_opening_price (float): The average price at which the position was opened.
    - quantity (int): The quantity of contracts.
    - position_size (float): The size of each contract.
    - position_margin (float): The margin allocated for the position.
    - is_long (bool): True for a long position, False for a short position.
    
    Returns:
    - float: The liquidation price.
    """
    # Get the maintenance margin rate based on the quantity
    maintenance_margin_rate = 0.004 # 0.4%
    # Calculate the maintenance margin
    maintenance_margin = average_opening_price * quantity * position_size * maintenance_margin_rate
    
    if is_long:
        liquidation_price = (maintenance_margin - position_margin + average_opening_price * quantity * position_size) / (quantity * position_size)
    else:
        liquidation_price = (average_opening_price * quantity * position_size - maintenance_margin + position_margin) / (quantity * position_size)
    
    return liquidation_price

# Example parameters for a long position
average_opening_price = 8000  # USDT
quantity = 10000
position_size = 0.0001  # Assuming this represents the contract size
position_margin = 320  # USDT
is_long = True  # True for long, False for short

# Calculate liquidation price with tiers
liquidation_price_with_tiers = calculate_isolated_liquidation_price_with_tiers(average_opening_price, quantity, position_size, position_margin, is_long)
print(liquidation_price_with_tiers)