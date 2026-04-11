## ADDED Requirements

### Requirement: POST /chat endpoint
The system SHALL expose a `POST /chat` HTTP endpoint that accepts a JSON body with a `message` field (string) and an optional `session_id` field (string), and returns a JSON response with `response` (string) and `session_id` (string).

#### Scenario: Successful chat request
- **WHEN** a client sends `POST /chat` with `{"message": "Is 1.2.3.4 a known threat?", "session_id": "abc123"}`
- **THEN** the server SHALL return HTTP 200 with a JSON body containing `response` (the agent's answer) and `session_id: "abc123"`

#### Scenario: New session created automatically
- **WHEN** a client sends `POST /chat` without a `session_id`
- **THEN** the server SHALL generate a new session ID, store the session, and return it in the response

### Requirement: Session state management
The system SHALL maintain in-memory conversation history per `session_id` so that multi-turn interactions within the same session preserve context.

#### Scenario: Session state persists across requests
- **WHEN** a client sends two sequential POST /chat requests with the same `session_id`
- **THEN** the second response SHALL reflect awareness of the first exchange

#### Scenario: Unknown session ID starts fresh
- **WHEN** a client sends a `session_id` that does not exist in the server's memory
- **THEN** the server SHALL create a new session for that ID and respond normally

### Requirement: GET /health endpoint
The system SHALL expose a `GET /health` endpoint that returns HTTP 200 with `{"status": "ok"}` when the server is running correctly.

#### Scenario: Health check returns OK
- **WHEN** a client sends `GET /health`
- **THEN** the server SHALL return HTTP 200 with body `{"status": "ok"}`

### Requirement: Input validation
The system SHALL validate incoming requests and return HTTP 422 with a descriptive error if the `message` field is missing or empty.

#### Scenario: Missing message field rejected
- **WHEN** a client sends `POST /chat` with a body that does not include a `message` field
- **THEN** the server SHALL return HTTP 422 with an error indicating the field is required

### Requirement: Configurable host and port
The system SHALL read server `HOST` (default `0.0.0.0`) and `PORT` (default `8000`) from environment variables, allowing deployment configuration without code changes.

#### Scenario: Custom port applied
- **WHEN** `PORT=9090` is set in the environment and the server starts
- **THEN** the server SHALL listen on port 9090
