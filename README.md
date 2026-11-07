# GraphOps — Enhanced Threat Investigation Workbench

A runnable educational prototype for graph-based security investigation. All data is **synthetic**.

## Features
- Interactive force-directed graph (Cytoscape.js) with zoom, pan, drag, hover tooltips.
- Node color by criticality, size by betweenness centrality.
- Risk-weighted blast radius (1–3 hops) with transparent score breakdown.
- Attack path finder (directed / undirected modes).
- Containment suggestions (structural isolation simulation).
- Choke-point ranking by betweenness centrality.
- Timeline filter and directed/undirected investigation modes.
- Play Scenario button for guided demo.
- Alert correlation on sample data.

## Requirements
- Python 3.10+
- pip

## Run locally
```bash
python -m venv .venv
source .venv/bin/activate   # or .venv\Scripts\Activate.ps1 on Windows
pip install -r requirements.txt
python app.py
```
Open http://127.0.0.1:5000

## Demo walkthrough (judge-friendly)
1. Click **Play Scenario** — preloads Laptop-07 → Payroll DB path, runs blast radius, path, and containment.
2. Or manually: select Laptop-07, click **Calculate risk-weighted blast radius**. Review ranked scores and breakdown.
3. Set target to Payroll DB, click **Find relationship path**.
4. Click **Suggest containment points** — review intermediary nodes and caveats.
5. Toggle Directed mode or set “After time” (e.g. 09:20) and Apply filter.
6. Review sample alerts below.

## API endpoints
- `GET /api/graph` — nodes and edges (with weight, timestamp)
- `GET /api/alerts`
- `GET /api/incident`
- `GET /api/blast-radius/<node_id>?mode=undirected|directed&after=HH:MM`
- `GET /api/attack-path?source=...&target=...&mode=...&after=...`
- `GET /api/choke-points?mode=...&after=...`
- `GET /api/containment?source=...&target=...&mode=...&after=...`

## Important limitations
- All telemetry and alerts are fabricated. No real organization data.
- Risk scores and containment suggestions are **illustrative prioritization aids only**. They are not probabilities of compromise, exploitability, or guaranteed containment.
- Relationships can be treated as directed or undirected for demonstration. Production systems must preserve direction, permissions, time, and semantics.
- A graph path is not proof that an attacker traversed or can exploit that path.
- Betweenness centrality is a structural metric, not a validated security-risk score.
- This prototype does not connect to a SIEM, EDR, CMDB, or live network.
- Do not use it to make real containment decisions.

## Testing
```bash
pip install pytest
pytest tests/ -q
```
