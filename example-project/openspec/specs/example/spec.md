# Example Specification

This is an example specification demonstrating the OpenSpec format.

## Requirements

### Requirement: User Greeting

The system SHALL greet users by name when they log in.

#### Scenario: Known user logs in

- GIVEN a user with name "Alice" exists
- WHEN Alice logs in
- THEN the system displays "Welcome, Alice!"

#### Scenario: Anonymous user

- GIVEN a user is not logged in
- WHEN they access the homepage
- THEN the system displays "Welcome, Guest!"

### Requirement: Session Management

The system SHALL maintain user sessions for 24 hours.

#### Scenario: Active session

- GIVEN a user has an active session
- WHEN they make a request within 24 hours
- THEN the session remains valid

#### Scenario: Expired session

- GIVEN a user's session is older than 24 hours
- WHEN they make a request
- THEN they are redirected to login
