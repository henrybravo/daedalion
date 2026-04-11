# Auth Specification

## Requirements

### Requirement: User Login

The system SHALL authenticate users with valid email and password credentials.

#### Scenario: Successful login

- GIVEN a registered user with email "alice@example.com"
- WHEN they submit correct credentials
- THEN the system returns a signed JWT token

#### Scenario: Invalid credentials

- GIVEN a registered user
- WHEN they submit an incorrect password
- THEN the system returns HTTP 401 with error code "INVALID_CREDENTIALS"

### Requirement: Session expiry

The system SHALL invalidate tokens after 24 hours.

#### Scenario: Expired token rejected

- GIVEN a JWT token issued 25 hours ago
- WHEN it is used in an API request
- THEN the system returns HTTP 401 with error code "TOKEN_EXPIRED"
