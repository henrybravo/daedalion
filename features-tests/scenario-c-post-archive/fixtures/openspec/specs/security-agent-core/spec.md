## ADDED Requirements

### Requirement: Agent initialization with security-focused system prompt
The system SHALL initialize a Microsoft Agent Framework agent with a system prompt that establishes the agent as a security analysis assistant, instructing it to be precise, cite reasoning, flag uncertainty, and always recommend human review for critical security decisions.

#### Scenario: Agent starts with security system prompt
- **WHEN** the agent is instantiated
- **THEN** the agent SHALL have a system prompt that identifies its role as a security analyst assistant and includes instructions to flag low-confidence answers

#### Scenario: Agent is backed by a configurable LLM
- **WHEN** the agent is initialized
- **THEN** it SHALL load model endpoint, deployment name, and API key from environment variables (`AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_DEPLOYMENT`, `AZURE_OPENAI_API_KEY`)

### Requirement: Tool registration
The system SHALL support registering one or more security tools with the agent so they are available for use during a session.

#### Scenario: Tools are available to the agent at runtime
- **WHEN** the agent processes a user query that requires a tool
- **THEN** the agent SHALL invoke the appropriate registered tool and incorporate its result into the response

### Requirement: Conversational session management
The system SHALL maintain conversational context within a session, allowing multi-turn interactions where the agent remembers prior exchanges.

#### Scenario: Multi-turn security investigation
- **WHEN** a user asks a follow-up question referencing a prior response
- **THEN** the agent SHALL use the conversation history to provide a contextually relevant answer

### Requirement: Graceful error handling
The system SHALL handle tool errors and LLM failures gracefully, returning an informative error message rather than crashing.

#### Scenario: Tool invocation fails
- **WHEN** a registered tool raises an exception during invocation
- **THEN** the agent SHALL catch the error and respond with a message indicating the tool was unavailable, without terminating the session
