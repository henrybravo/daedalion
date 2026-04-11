# Add Order Cancellation

## Why

Customers need to cancel orders within 30 minutes of placement.
Currently there is no cancellation flow, leading to support tickets.

## What

- Add DELETE /api/v1/orders/{orderId} endpoint
- Cancel only if order is in PENDING status and within 30-minute window
- Release reserved inventory on cancellation
- Emit order.cancelled event for downstream services
