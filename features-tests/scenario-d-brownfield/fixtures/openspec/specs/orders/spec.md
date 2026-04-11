# Orders Specification

Documents existing order management behaviour as captured from the codebase.

## Requirements

### Requirement: Create order

The system SHALL accept a new order with one or more line items and persist it.

#### Scenario: Valid order created

- GIVEN a customer with a valid account
- WHEN they POST /api/v1/orders with valid line items
- THEN the system returns HTTP 201 with the created order including an orderId

#### Scenario: Empty order rejected

- GIVEN any request
- WHEN they POST /api/v1/orders with an empty items array
- THEN the system returns HTTP 422

### Requirement: Retrieve order

The system SHALL return order details for a given orderId.

#### Scenario: Existing order retrieved

- GIVEN an order with id "abc-123" exists
- WHEN GET /api/v1/orders/abc-123 is called
- THEN the system returns HTTP 200 with full order details

#### Scenario: Non-existent order

- GIVEN no order with id "xyz-999" exists
- WHEN GET /api/v1/orders/xyz-999 is called
- THEN the system returns HTTP 404
