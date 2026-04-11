# Session Management

### Active session
- GIVEN a user has an active session
- WHEN they make a request within 24 hours
- THEN the session remains valid

### Expired session
- GIVEN a user's session is older than 24 hours
- WHEN they make a request
- THEN they are redirected to login
