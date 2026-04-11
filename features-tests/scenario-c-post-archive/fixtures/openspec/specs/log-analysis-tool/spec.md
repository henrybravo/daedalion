## ADDED Requirements

### Requirement: Security log ingestion and summarization
The system SHALL provide a tool function that accepts a raw security log snippet (string) and returns a structured summary including detected event types, affected entities (IPs, users, hosts), and anomaly indicators.

#### Scenario: Authentication failure log analyzed
- **WHEN** the agent invokes the log analysis tool with a log snippet containing multiple failed authentication events
- **THEN** the tool SHALL identify the event type as "authentication failure", extract the source IPs and target usernames, and flag if the count exceeds a configurable threshold indicating a potential brute-force attempt

#### Scenario: Normal log with no anomalies analyzed
- **WHEN** the agent invokes the log analysis tool with a log snippet containing routine, non-anomalous events
- **THEN** the tool SHALL return a summary indicating no anomalies detected

### Requirement: Log format flexibility
The system SHALL accept log snippets in common formats including syslog, Windows Event Log (plain text representation), and generic key=value format.

#### Scenario: Syslog format processed
- **WHEN** the tool receives a log in standard syslog format
- **THEN** it SHALL parse the timestamp, hostname, process, and message fields correctly

### Requirement: Entity extraction
The system SHALL extract security-relevant entities from logs, including: IP addresses, usernames, hostnames, process names, and file paths.

#### Scenario: Entities extracted from log
- **WHEN** the log analysis tool processes a log containing an IP address, username, and hostname
- **THEN** it SHALL return all three entities in a structured entities field of the response

### Requirement: Anomaly threshold configuration
The system SHALL allow the anomaly detection threshold (e.g., maximum failed login attempts before flagging) to be configured via environment variable `LOG_ANOMALY_THRESHOLD` with a default of 5.

#### Scenario: Threshold override applied
- **WHEN** `LOG_ANOMALY_THRESHOLD=10` is set and a log with 7 failed logins is analyzed
- **THEN** the tool SHALL NOT flag it as an anomaly (below the configured threshold of 10)
