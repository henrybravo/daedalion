# Inventory Specification

Documents existing inventory management behaviour.

## Requirements

### Requirement: Stock reservation

The system SHALL reserve stock when an order is placed.

#### Scenario: Sufficient stock reserved

- GIVEN a product with 10 units in stock
- WHEN an order for 3 units is placed
- THEN 3 units are reserved and available stock shows 7

#### Scenario: Insufficient stock rejected

- GIVEN a product with 2 units in stock
- WHEN an order for 5 units is placed
- THEN the system returns an out-of-stock error
