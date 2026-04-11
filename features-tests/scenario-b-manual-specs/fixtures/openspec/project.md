# Auth Service

A service for user authentication and session management.

## Goals

- Secure, stateless authentication using JWT
- Support email/password and OAuth2 login flows

## Conventions

- Use kebab-case for all file and directory names
- Every new endpoint must have a spec scenario before implementation
- Errors return `{ error: string, code: string }` JSON
