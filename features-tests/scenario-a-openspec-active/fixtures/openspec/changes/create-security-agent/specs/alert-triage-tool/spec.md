---
file_pattern: "src/tools/alert-triage/**"
---
## ADDED Requirements

### Requirement: Alert severity classification
The system SHALL provide a tool function that accepts an alert description and returns a severity classification (Critical, High, Medium, Low, Informational) with a confidence score and justification.

#### Scenario: Critical alert classified
- **WHEN** the agent invokes the alert triage tool with an alert describing active ransomware execution on a production server
- **THEN** the tool SHALL classify the alert as "Critical" with a confidence score ≥ 0.85 and a justification citing the ransomware indicator and production impact

#### Scenario: Low-severity alert classified
- **WHEN** the agent invokes the alert triage tool with an alert describing a single failed SSH login from an internal IP
- **THEN** the tool SHALL classify the alert as "Low" or "Informational"

### Requirement: Recommended next steps
The system SHALL include a list of recommended next steps for each severity classification, tailored to the alert type.

#### Scenario: Recommendations returned with classification
- **WHEN** the triage tool classifies an alert
- **THEN** the response SHALL include at least one recommended action (e.g., "Isolate affected host", "Escalate to IR team", "Monitor for recurrence")

### Requirement: False positive indicator
The system SHALL assess and return a false positive likelihood score (0.0–1.0) for each alert, helping analysts prioritize real threats over noise.

#### Scenario: High false-positive likelihood flagged
- **WHEN** an alert has characteristics commonly associated with false positives (e.g., vulnerability scanner traffic from a known internal scanner IP)
- **THEN** the tool SHALL return a false positive likelihood score ≥ 0.7

### Requirement: Alert context enrichment
The system SHALL accept optional context fields (source IP, destination IP, affected user, hostname) alongside the alert description to improve triage accuracy.

#### Scenario: Context-enriched triage
- **WHEN** the alert triage tool is called with both an alert description and context fields (source IP, affected user)
- **THEN** the tool SHALL incorporate the context into its classification and recommendations (e.g., referencing the specific IP or user in the justification)