## ADDED Requirements

### Requirement: IP reputation lookup
The system SHALL provide a tool function that accepts an IP address and returns a threat intelligence summary including reputation score, known threat categories, and data source.

#### Scenario: Known malicious IP queried
- **WHEN** the agent invokes the threat intelligence tool with a known malicious IP address
- **THEN** the tool SHALL return a response indicating the IP is flagged, with at least a threat category (e.g., botnet, scanner) and a confidence indicator

#### Scenario: Unknown IP queried
- **WHEN** the agent invokes the threat intelligence tool with an IP that has no threat record
- **THEN** the tool SHALL return a response indicating no known threats were found for that IP

### Requirement: Domain reputation lookup
The system SHALL provide a tool function that accepts a domain name and returns threat intelligence including category classification (malware, phishing, benign) and first-seen date if available.

#### Scenario: Phishing domain queried
- **WHEN** the agent invokes the domain lookup with a known phishing domain
- **THEN** the tool SHALL return a classification of "phishing" and any associated metadata

### Requirement: CVE details lookup
The system SHALL provide a tool function that accepts a CVE identifier and returns the vulnerability description, CVSS score, affected software, and remediation recommendations.

#### Scenario: Valid CVE queried
- **WHEN** the agent invokes the CVE lookup tool with a valid CVE ID (e.g., `CVE-2024-12345`)
- **THEN** the tool SHALL return the CVE description, severity score, and at least one remediation recommendation

#### Scenario: Invalid CVE ID queried
- **WHEN** the agent invokes the CVE lookup tool with a malformed or non-existent CVE ID
- **THEN** the tool SHALL return a clear error message indicating the CVE was not found

### Requirement: Mock mode for testing
The system SHALL support a mock mode where the threat intelligence tool returns deterministic stub responses without calling external APIs, to enable unit testing and offline development.

#### Scenario: Mock mode enabled
- **WHEN** the environment variable `TI_MOCK_MODE=true` is set
- **THEN** the tool SHALL return pre-defined stub responses for any input without making network requests
