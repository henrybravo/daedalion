# Add OAuth2 Login

## Why

Users want to log in with GitHub and Google accounts without creating separate passwords.
Supporting OAuth2 reduces friction and improves account security.

## What

- Add OAuth2 provider configuration (GitHub, Google)
- Implement callback endpoint to exchange code for token
- Map external identity to internal user account
- Issue JWT on successful OAuth2 login
