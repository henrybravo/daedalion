# Orders API

Existing e-commerce order management service. Specs added retrospectively
to document existing behaviour and guide future changes.

## Conventions

- REST endpoints follow /api/v1/{resource} pattern
- All responses include a `requestId` field for tracing
- Database queries use the repository pattern
