## 1. Project Setup

- [ ] 1.1 Create project directory structure (`agent.py`, `tools/`, `server.py`, `requirements.txt`, `.env.example`, `README.md`)
- [ ] 1.2 Create and activate a workspace-local Python virtual environment (`python -m venv .venv`)
- [ ] 1.3 Create `requirements.txt` with pinned dependencies: `agent-framework-azure-ai==1.0.0b260107`, `agent-framework-core==1.0.0b260107`, `fastapi`, `uvicorn[standard]`, `python-dotenv`, `httpx`
- [ ] 1.4 Install dependencies into the virtual environment
- [ ] 1.5 Create `.env.example` with placeholder values for `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_DEPLOYMENT`, `AZURE_OPENAI_API_KEY`, `TI_MOCK_MODE`, `LOG_ANOMALY_THRESHOLD`, `HOST`, `PORT`
- [ ] 1.6 Add `.env` and `.venv/` to `.gitignore`

## 2. Threat Intelligence Tool

- [ ] 2.1 Create `tools/threat_intel.py` with `ThreatIntelTool` class
- [ ] 2.2 Implement `lookup_ip(ip: str) -> dict` function with mock and real API mode (controlled by `TI_MOCK_MODE` env var)
- [ ] 2.3 Implement `lookup_domain(domain: str) -> dict` function with mock mode support
- [ ] 2.4 Implement `lookup_cve(cve_id: str) -> dict` function; validate CVE ID format and return stub response or error
- [ ] 2.5 Register all three functions as agent tools using the Microsoft Agent Framework tool decorator pattern
- [ ] 2.6 Write unit tests verifying mock mode returns deterministic responses for IP, domain, and CVE lookups

## 3. Log Analysis Tool

- [ ] 3.1 Create `tools/log_analysis.py` with `LogAnalysisTool` class
- [ ] 3.2 Implement log parsing for syslog, Windows Event Log (plain text), and key=value formats
- [ ] 3.3 Implement entity extraction for IP addresses, usernames, hostnames, process names, and file paths using regex
- [ ] 3.4 Implement anomaly detection for authentication failures using configurable `LOG_ANOMALY_THRESHOLD` (default: 5)
- [ ] 3.5 Implement `analyze_log(log_snippet: str) -> dict` returning summary, entities, anomaly indicators
- [ ] 3.6 Register `analyze_log` as an agent tool
- [ ] 3.7 Write unit tests for entity extraction and anomaly detection threshold behavior

## 4. Alert Triage Tool

- [ ] 4.1 Create `tools/alert_triage.py` with `AlertTriageTool` class
- [ ] 4.2 Implement `triage_alert(description: str, source_ip: str = None, dest_ip: str = None, affected_user: str = None, hostname: str = None) -> dict` returning severity, confidence, justification, next steps, and false positive likelihood
- [ ] 4.3 Implement severity classification logic (Critical / High / Medium / Low / Informational) with confidence scoring
- [ ] 4.4 Implement false positive likelihood scoring (0.0–1.0) with rules for known benign patterns
- [ ] 4.5 Ensure context fields (source IP, user, hostname) are incorporated into justification and recommendations
- [ ] 4.6 Register `triage_alert` as an agent tool
- [ ] 4.7 Write unit tests covering Critical, Low, and high-false-positive alert scenarios

## 5. Core Agent

- [ ] 5.1 Create `agent.py` defining the security agent using `agent-framework-azure-ai`
- [ ] 5.2 Load model configuration from `.env` (`AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_DEPLOYMENT`, `AZURE_OPENAI_API_KEY`)
- [ ] 5.3 Write the security-focused system prompt (analyst role, cite reasoning, flag uncertainty, recommend human review)
- [ ] 5.4 Instantiate and register all three tools (`ThreatIntelTool`, `LogAnalysisTool`, `AlertTriageTool`) with the agent
- [ ] 5.5 Implement session factory that creates or retrieves an in-memory conversation session by `session_id`
- [ ] 5.6 Implement `run_agent(message: str, session_id: str) -> tuple[str, str]` returning agent response and session ID
- [ ] 5.7 Validate graceful error handling: tool exceptions are caught and surfaced as user-readable messages without crashing

## 6. HTTP Server

- [ ] 6.1 Create `server.py` with FastAPI application
- [ ] 6.2 Implement `POST /chat` endpoint accepting `{"message": str, "session_id": str | None}` and returning `{"response": str, "session_id": str}`
- [ ] 6.3 Implement `GET /health` endpoint returning `{"status": "ok"}`
- [ ] 6.4 Add input validation: return HTTP 422 if `message` is missing or empty
- [ ] 6.5 Read `HOST` (default `0.0.0.0`) and `PORT` (default `8000`) from environment and pass to `uvicorn.run`
- [ ] 6.6 Wire `POST /chat` to `run_agent` from `agent.py`
- [ ] 6.7 Test server manually: send a `/chat` request and verify the agent responds with security context

## 7. Debug & Tracing

- [ ] 7.1 Integrate Agent Inspector debug support using the `aitk-add_agent_debug` guidance
- [ ] 7.2 Add VS Code launch configuration (`launch.json`) for running `server.py` and the agent standalone
- [ ] 7.3 Verify tracing output is visible in Agent Inspector during a test session

## 8. Documentation

- [ ] 8.1 Write `README.md` with: prerequisites, setup steps (venv, install, `.env`), how to run the server, example `curl` commands for `/chat` and `/health`, and notes on mock mode
- [ ] 8.2 Document the tool extension pattern so future tools can be added following the same structure
- [ ] 8.3 Add a note in `README.md` that production deployments MUST add authentication middleware to the HTTP server
