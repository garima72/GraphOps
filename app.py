from flask import Flask, jsonify, render_template, request
import json
from pathlib import Path
import networkx as nx

app = Flask(__name__)
BASE = Path(__file__).resolve().parent

CRIT_SCORES = {"critical": 4, "high": 3, "medium": 2, "low": 1}

def load_json(filename):
    with open(BASE / "data" / filename, encoding="utf-8") as f:
        return json.load(f)

def build_graph():
    data = load_json("graph.json")
    graph = nx.DiGraph()
    for node in data["nodes"]:
        graph.add_node(node["id"], **node)
    for edge in data["edges"]:
        graph.add_edge(
            edge["source"], edge["target"],
            relation=edge.get("relation", "related"),
            weight=edge.get("weight", 1),
            timestamp=edge.get("timestamp", "00:00"),
            label=edge.get("relation", "related")
        )
    return graph, data

def node_payload(node_id, attrs):
    return {
        "id": node_id,
        "label": attrs.get("label", node_id),
        "type": attrs.get("type", "asset"),
        "criticality": attrs.get("criticality", "medium"),
        "description": attrs.get("description", "")
    }

def get_mode_graph(graph, mode="undirected"):
    if mode == "directed":
        return graph
    return graph.to_undirected()

def filter_by_time(graph, after=None):
    if not after:
        return graph
    filtered = graph.copy()
    to_remove = []
    for u, v, data in filtered.edges(data=True):
        ts = data.get("timestamp", "00:00")
        if ts < after:
            to_remove.append((u, v))
    filtered.remove_edges_from(to_remove)
    return filtered

def compute_risk_score(hops, criticality, edge_weights):
    """Transparent illustrative prioritization score.
    Higher score = higher illustrative priority for investigation.
    Formula: (criticality_score * avg_edge_weight) / hops
    Not a probability of compromise.
    """
    crit = CRIT_SCORES.get(criticality, 2)
    avg_weight = sum(edge_weights) / len(edge_weights) if edge_weights else 1
    if hops == 0:
        return 0
    score = round((crit * avg_weight) / hops, 2)
    return score

@app.route("/")
def home():
    return render_template("index.html")

@app.get("/api/graph")
def graph_data():
    _, raw = build_graph()
    return jsonify({
        "nodes": raw["nodes"],
        "edges": raw["edges"]
    })

@app.get("/api/alerts")
def alerts():
    return jsonify(load_json("alerts.json"))

@app.get("/api/blast-radius/<node_id>")
def blast_radius(node_id):
    graph, _ = build_graph()
    if node_id not in graph:
        return jsonify({"error": f"Unknown node: {node_id}"}), 404

    mode = request.args.get("mode", "undirected")
    after = request.args.get("after")
    g = filter_by_time(graph, after)
    undirected = get_mode_graph(g, mode)

    if node_id not in undirected:
        return jsonify({"error": "Node not reachable under current filters"}), 404

    distances = nx.single_source_shortest_path_length(undirected, node_id, cutoff=3)
    impacted = []
    for target, hops in distances.items():
        if target == node_id:
            continue
        try:
            path = nx.shortest_path(undirected, node_id, target)
            edge_weights = []
            for i in range(len(path)-1):
                u, v = path[i], path[i+1]
                w = undirected[u][v].get("weight", 1)
                edge_weights.append(w)
            score = compute_risk_score(hops, graph.nodes[target].get("criticality", "medium"), edge_weights)
            breakdown = {
                "hops": hops,
                "criticality_score": CRIT_SCORES.get(graph.nodes[target].get("criticality", "medium"), 2),
                "avg_edge_weight": round(sum(edge_weights)/len(edge_weights), 2) if edge_weights else 1,
                "formula": "(criticality_score * avg_edge_weight) / hops"
            }
        except nx.NetworkXNoPath:
            score = 0
            breakdown = {}
            edge_weights = []

        impacted.append({
            **node_payload(target, graph.nodes[target]),
            "hops": hops,
            "risk_score": score,
            "breakdown": breakdown,
            "path_edge_weights": edge_weights
        })

    # Rank by risk score descending, then hops
    impacted.sort(key=lambda item: (-item["risk_score"], item["hops"], item["label"]))

    return jsonify({
        "source": node_payload(node_id, graph.nodes[node_id]),
        "impacted": impacted,
        "counts": {
            "one_hop": sum(x["hops"] == 1 for x in impacted),
            "two_hop": sum(x["hops"] == 2 for x in impacted),
            "three_hop": sum(x["hops"] == 3 for x in impacted)
        },
        "mode": mode,
        "after": after,
        "note": "Illustrative prioritization score only. Higher score suggests higher investigation priority based on hops, criticality, and illustrative relationship weights (higher weight = higher illustrative risk). It is NOT a confirmed probability of compromise or exploitability. Edge weights are synthetic demonstration values."
    })

@app.get("/api/attack-path")
def attack_path():
    graph, _ = build_graph()
    source = request.args.get("source", "")
    target = request.args.get("target", "")
    mode = request.args.get("mode", "undirected")
    after = request.args.get("after")

    if source not in graph or target not in graph:
        return jsonify({"error": "Choose valid source and target nodes."}), 400

    g = filter_by_time(graph, after)
    undirected = get_mode_graph(g, mode)

    try:
        path = nx.shortest_path(undirected, source, target, weight="weight")
    except nx.NetworkXNoPath:
        return jsonify({"path": [], "message": "No path found in the current sample graph under selected mode/filters.", "mode": mode})

    return jsonify({
        "path": [node_payload(n, graph.nodes[n]) for n in path],
        "length": len(path) - 1,
        "mode": mode,
        "note": "This is a weighted shortest relationship path (edge weights treated as costs; higher weight = higher illustrative risk/cost). Not a confirmed attacker route. Direction, time filters, and weights are illustrative only."
    })

@app.get("/api/choke-points")
def choke_points():
    graph, _ = build_graph()
    mode = request.args.get("mode", "undirected")
    after = request.args.get("after")
    g = filter_by_time(graph, after)
    undirected = get_mode_graph(g, mode)

    centrality = nx.betweenness_centrality(undirected, normalized=True)
    ranked = sorted(centrality.items(), key=lambda pair: pair[1], reverse=True)
    return jsonify({
        "items": [
            {**node_payload(node_id, graph.nodes[node_id]),
             "score": round(score, 4)}
            for node_id, score in ranked[:8] if score > 0
        ],
        "mode": mode,
        "note": "Betweenness centrality is a structural indicator, not a security-risk score."
    })

@app.get("/api/containment")
def containment():
    """Suggest intermediary nodes whose isolation would disrupt a selected path.
    Illustrative only — never claims guaranteed containment.
    """
    graph, _ = build_graph()
    source = request.args.get("source", "")
    target = request.args.get("target", "")
    mode = request.args.get("mode", "undirected")
    after = request.args.get("after")

    if source not in graph or target not in graph:
        return jsonify({"error": "Choose valid source and target nodes."}), 400

    g = filter_by_time(graph, after)
    undirected = get_mode_graph(g, mode)

    try:
        path = nx.shortest_path(undirected, source, target, weight="weight")
    except nx.NetworkXNoPath:
        return jsonify({"suggestions": [], "message": "No path found."})

    intermediates = path[1:-1] if len(path) > 2 else []
    suggestions = []

    for node in intermediates:
        # Simulate removal
        temp = undirected.copy()
        temp.remove_node(node)
        try:
            nx.shortest_path(temp, source, target, weight="weight")
            disrupts = False
            alt_note = " Alternative paths exist; isolating this node alone would not disconnect the source from the target."
        except nx.NetworkXNoPath:
            disrupts = True
            alt_note = " No alternative path remains under the current graph and filters."

        attrs = graph.nodes[node]
        impact = f"Isolating {attrs.get('label', node)} ({attrs.get('type')}) may affect operational access for users/services depending on it."
        if attrs.get("criticality") in ("critical", "high"):
            impact += " High operational impact expected — review carefully."

        suggestions.append({
            **node_payload(node, attrs),
            "disrupts_path": disrupts,
            "explanation": f"Isolating this intermediary node {'would disrupt' if disrupts else 'may not fully disrupt'} the selected relationship path in the current graph.{alt_note}",
            "operational_impact": impact,
            "caveat": "This is a structural simulation only. Isolation does not guarantee containment; real environments have alternate paths, permissions, and time factors. Edge weights are illustrative."
        })

    # Prefer nodes that disrupt the path
    suggestions.sort(key=lambda s: (not s["disrupts_path"], s["criticality"] != "critical"))

    return jsonify({
        "path": [node_payload(n, graph.nodes[n]) for n in path],
        "suggestions": suggestions,
        "note": "Containment suggestions are illustrative structural analyses. They do not guarantee that isolating a node will contain an incident. Always validate with qualified analysts and consider operational impact."
    })

@app.get("/api/incident")
def incident():
    graph, _ = build_graph()
    alerts_data = load_json("alerts.json")
    items = []
    for alert in alerts_data:
        related = [entity for entity in alert["entities"] if entity in graph]
        items.append({**alert, "related_nodes": related})
    return jsonify({
        "alerts": items,
        "summary": "Alerts are grouped by shared entities in the demonstration dataset.",
        "note": "This is deterministic sample-data correlation, not a production detection engine."
    })

if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5000)
