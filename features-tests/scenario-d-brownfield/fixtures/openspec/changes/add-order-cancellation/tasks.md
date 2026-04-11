# Tasks

## API

- [ ] Add DELETE /api/v1/orders/{orderId} route
- [ ] Validate order is PENDING and within 30-minute window
- [ ] Return 409 if cancellation not allowed

## Inventory

- [ ] Release reserved stock on cancellation
- [ ] Update inventory service to handle cancellation event

## Events

- [ ] Emit order.cancelled domain event
- [ ] Add event schema to API docs
