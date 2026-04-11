## Why

Security operations require rapid triage and response to threats, vulnerabilities, and incidents. A dedicated AI-powered security agent built on the Microsoft Agent Framework SDK provides an intelligent, extensible assistant that can analyze security events, assess risks, correlate threat intelligence, and recommend or execute remediation actions — reducing mean time to detect and respond.

## What Changes

- Introduce a new **security agent** application built with the Microsoft Agent Framework SDK (Python, `agent-framework-azure-ai==1.0.0b260107`)
- Agent exposes a conversational interface for security analysts to query threats, incidents, and vulnerability data
- Agent supports pluggable tools for threat intelligence lookup, log analysis, CVE lookup, and alert triage
- Agent is packaged as an HTTP server for integration with SOC dashboards and SIEM platforms
- Configuration via `.env` for model endpoint, API keys, and tool credentials

## Capabilities

### New Capabilities

- `security-agent-core`: Core agent setup — LLM-backed agent with system prompt tuned for security analysis, tool registration, and session management
- `threat-intelligence-tool`: Tool for querying threat intelligence feeds (e.g., IP reputation, domain lookup, CVE details)
- `log-analysis-tool`: Tool for ingesting and summarizing security log snippets or SIEM alerts
- `alert-triage-tool`: Tool that classifies incoming alerts by severity and recommends next steps
- `agent-http-server`: HTTP server wrapper exposing the security agent as a REST API

### Modified Capabilities

## Impact

- New standalone Python project under the workspace
- Dependencies: `agent-framework-azure-ai==1.0.0b260107`, `agent-framework-core==1.0.0b260107`, `azure-identity`, `httpx`, `python-dotenv`
- Requires an Azure AI / OpenAI model endpoint (configurable via `.env`)
- No existing code modified; all new files
