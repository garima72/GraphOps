# GraphOps — Build-Log (working submission record)

> IMPORTANT: This file is a structured draft, not proof that activities or research were completed. Replace every `[TEAM TO COMPLETE]` item with your actual work. Do not claim interviews, tests, sources, or verification that did not happen.

## Entry 1 — Theme, problem, intended build, leverage map

- **Registered theme:** Cybersecurity and Technology.
- **Challenge:** GraphOps — graph analytics for proactive threat hunting and blast-radius containment in SOCs.
- **Problem framing:** Security alerts and asset relationships can be difficult to interpret as one connected incident. The prototype explores a graph-based view of entities and relationships.
- **Intended build:** A browser workbench combining connected sample alerts, 1–3 hop impact exploration, shortest relationship paths, and potential choke-point ranking.
- **Leverage map:**
  - Inputs: synthetic asset inventory, identity relationships, network connections, sample alerts.
  - Processing: graph construction, entity matching, BFS-style neighborhood traversal, shortest path, betweenness centrality.
  - Outputs: connected graph, related alerts, reachable entities, path, centrality ranking.
  - Human decision: analyst reviews context; prototype does not automatically block anything.
- **Primary user hypothesis:** [TEAM TO COMPLETE: choose and justify a primary user group.]
- **Evidence:** The challenge statement specifies graph construction and capabilities such as blast radius, attack paths, choke points, and anomaly detection. [Add the official challenge URL/reference and access date.]
- **Assumptions:** A simpler graph workbench may help a small security team; synthetic data is sufficient to demonstrate the workflow; shared entity IDs are a useful first correlation rule.

## Entry 2 — 4D Check and delegation map

| Check | Questions to answer | Current status |
|---|---|---|
| Desirability | Does the intended user need this workflow? | Assumption; validate with user interviews |
| Feasibility | Can the team build a small graph demo? | Demonstrated by this local prototype |
| Viability | Is this useful enough to adopt or maintain? | Unknown; requires user feedback |
| Defensibility / differentiation | What makes this workflow clearer or more useful than a table? | Hypothesis; compare with existing tools |

**Delegation map — replace names with actual team members**
- Graph/data model and graph algorithms: Team
- Backend/API and sample data: Team
- Frontend/dashboard and integration: Team
- Shared responsibilities: testing, demo script, evidence collection, final review.

## Entry 3 — Six-part brief, output, verified claim, tagged claims

**Six-part brief**
1. User: [TEAM TO COMPLETE; primary user not yet validated].
2. Need: understand how alerts and assets may be related.
3. Context: a suspicious endpoint appears in several security events.
4. Input: synthetic asset graph and sample alert records.
5. Output: connected view, potential blast radius, path, choke-point ranking.
6. Constraint: prototype only; no live integrations or automated containment.

**Current output:** runnable Flask + NetworkX + HTML/CSS/JS prototype.

**Verified in the code:** the sample dataset contains 10 nodes, 10 relationships, and 5 alert records; the app computes graph neighborhoods, shortest paths, and betweenness centrality for this dataset. Verify by running the application and API endpoints.

**Claim tags**
- [VERIFIED-IN-PROTOTYPE] The code calculates a 3-hop neighborhood on the included graph.
- [VERIFIED-IN-PROTOTYPE] The code returns a shortest relationship path for connected sample nodes.
- [VERIFIED-IN-PROTOTYPE] The code ranks nodes by betweenness centrality.
- [ASSUMPTION] This view reduces analyst investigation time.
- [ASSUMPTION] Small organizations will prefer this workflow.
- [NOT-IMPLEMENTED] Real-time SIEM/EDR ingestion and automated anomaly detection.

**Verified external claim/source:** [TEAM TO COMPLETE: add a credible source, exact claim, URL, publication date, and access date after checking the source.]

## Entry 4 — Unwind/reframe, critique, assumptions and 48-hour tests

**Reframe:** Rather than claiming to predict real attacker movement, the prototype explains relationships in a synthetic environment and shows possible graph reachability.

**Critique objections**
- A path in a graph does not prove exploitability.
- Undirected traversal may overstate reachability.
- Static synthetic data cannot establish real-world accuracy.
- Centrality alone is not a security-risk score.
- Alert matching by shared IDs is simplistic.

**Three ranked assumptions and proposed 48-hour tests**
1. [ASSUMPTION] Analysts can understand the graph faster than a raw list. Test: show the same scenario to 3–5 target users; ask them to identify affected assets and record time/errors.
2. [ASSUMPTION] The 1–3 hop view is a useful first impact summary. Test: ask target users to inspect a scenario and rate clarity/usefulness; record exact feedback.
3. [ASSUMPTION] A choke-point ranking helps prioritize investigation. Test: compare the ranked output with a manually reviewed scenario and ask an experienced reviewer whether the explanation is meaningful.

**Problem statement v2:** [TEAM TO COMPLETE after tests; do not claim the tests occurred until they do.]

## Entry 5 — Hypothesis, ICP, substitutes, mechanism, opportunity, insight ledger

- **Hypothesis:** Given a connected asset-and-alert view, a target user can identify related entities and possible paths more clearly than when reviewing the same synthetic information as disconnected records.
- **ICP:** [TEAM TO COMPLETE after selecting and validating a specific user group.]
- **Substitutes:** SIEM dashboards, asset inventory tools, spreadsheets, manual incident notes, graph-capable security platforms. Research and cite specific products only after reviewing them.
- **Mechanism:** entity-linked graph → alert correlation → neighborhood traversal → path and centrality analysis → analyst review.
- **Opportunity sizing:** [TEAM TO COMPLETE using a defensible source and transparent calculation. Do not invent a market size.]
- **Insight ledger:**
  - Observed in prototype: graph traversal and path analysis can be demonstrated on a small synthetic graph.
  - Still unknown: whether intended users find the interface useful.
  - Still unknown: whether this improves speed or decision quality.
  - Still unknown: whether the chosen user segment has budget or adoption intent.
- **Chosen workflow:** select a suspicious node → inspect related alerts → calculate potential blast radius → inspect path to critical target → review choke points.

## Entry 6 — Spec, stack, tests, stranger test, reusable workflow

- **Specification:** See `PROJECT_SPEC.md`.
- **Tech stack:** Python, Flask, NetworkX, HTML, CSS, JavaScript, SVG, JSON.
- **Reasons:** low setup complexity, understandable graph algorithms, transparent sample data, no separate frontend build step.
- **Tests completed:** [TEAM TO COMPLETE with date, environment, steps, expected result, actual result, pass/fail.]
- **Stranger test:** [TEAM TO COMPLETE: participant role (no personal data), task, observed outcome, feedback, change made.]
- **Reusable workflow:** create a graph with stable entity IDs → map alert records to those IDs → inspect related entities → calculate bounded neighborhood → inspect paths to critical assets → review structural choke points → document uncertainty and ask a human to decide.
- **Known limitations:** see README and PROJECT_SPEC.
- **Next build:** add direction- and time-aware relationships, automated tests, and a user-reviewed scenario before considering any live data.
