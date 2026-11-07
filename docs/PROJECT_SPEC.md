# PROJECT_SPEC.md — GraphOps

## 1. Purpose
GraphOps is a prototype graph-analytics workbench intended to help a security analyst move from isolated alert records toward a connected view of a simulated incident. It combines alert/entity correlation, neighborhood-based impact exploration, and path/choke-point inspection.

## 2. Intended user
**Initial working hypothesis:** a security analyst or IT administrator in a small organization who needs a simple visual explanation of relationships between devices, identities, servers, and critical applications.

This user choice is not yet validated. Confirm it through interviews or usability tests before presenting it as a research finding.

## 3. Problem statement (prototype version)
When security-relevant events and asset relationships are viewed separately, a responder may have to manually reconstruct which identities and systems are connected to a suspicious endpoint. GraphOps demonstrates how a small connected asset-and-alert graph can help an analyst inspect related entities, estimate potential graph reachability, and identify structural paths toward critical assets.

## 4. Core workflow
1. Load a synthetic graph of organizational identities, devices, servers, applications, databases, and IP addresses.
2. Load sample alerts that reference entities in the graph.
3. Correlate alerts by shared entity identifiers.
4. Select a potentially compromised node and calculate nodes within one, two, and three hops.
5. Select a critical target and inspect the shortest relationship path.
6. Rank potential choke points using betweenness centrality.

## 5. Functional requirements
- FR1: Return graph nodes and relationships as JSON.
- FR2: Display graph nodes and relationships in a browser.
- FR3: Show synthetic alert records and their referenced entities.
- FR4: Calculate an undirected neighborhood up to three hops.
- FR5: Find a shortest undirected relationship path between valid nodes.
- FR6: Rank nodes by betweenness centrality.
- FR7: Label results as potential/structural and disclose that sample data is synthetic.

## 6. Non-functional requirements
- Local setup should require only Python and pip.
- Sample data must be readable/editable JSON.
- The app should work on a modern desktop/mobile browser.
- No secrets or external credentials are required.
- API responses should be deterministic for the included dataset.

## 7. Technology choices
- Python: accessible language for graph analytics and data processing.
- Flask: small HTTP API and page server with minimal setup.
- NetworkX: graph construction, shortest-path, neighborhood, and centrality algorithms.
- HTML/CSS/JavaScript/SVG: lightweight interactive dashboard without a separate frontend build process.
- JSON: transparent sample dataset that can be reviewed and edited.

## 8. Data model
Node: `id`, `label`, `type`, `criticality`, `description`, `x`, `y`.
Edge: `source`, `target`, `relation`.
Alert: `id`, `time`, `severity`, `title`, `description`, `entities`, `status`.

## 9. Acceptance tests
- App starts at `http://127.0.0.1:5000`.
- `/api/graph` returns 10 nodes and 10 edges.
- `/api/alerts` returns 5 synthetic alerts.
- `/api/blast-radius/D01` returns hop counts and an explicit caveat.
- `/api/attack-path?source=D01&target=DB01` returns a path if connected.
- `/api/choke-points` returns ranked structural metrics.
- Invalid node IDs return a clear client error.

## 10. Out of scope
Live SIEM/EDR integration, production incident response, automated blocking, exploitability prediction, machine-learning anomaly detection, multi-tenant access control, and real-time streaming.

## 11. Safety and interpretation
The graph represents modeled relationships, not confirmed attacker movement. Any containment recommendation must be reviewed by a qualified analyst. The included dataset is synthetic and must not be described as real telemetry.
