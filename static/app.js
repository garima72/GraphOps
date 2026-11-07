function escapeHtml(s) {
  return String(s)
    .replace(/&/g, String.fromCharCode(38) + "amp;")
    .replace(/</g, String.fromCharCode(38) + "lt;")
    .replace(/>/g, String.fromCharCode(38) + "gt;")
    .replace(/"/g, String.fromCharCode(38) + "quot;")
    .replace(/'/g, String.fromCharCode(38) + "#39;");
}

const $ = (id) => document.getElementById(id);
let graphData = null;
let cy = null;
let selectedNode = null;
let highlighted = new Set();
let centralityScores = {};

const critColors = {critical: "#ef817b", high: "#f2b56b", medium: "#80b9df", low: "#a7e3c2"};

async function getJSON(url) {
  const response = await fetch(url);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

function currentMode() { return $("modeSelect").value; }
function currentAfter() { return $("afterTime").value.trim() || null; }

function getFilteredEdges() {
  const after = currentAfter();
  if (!after) return graphData.edges;
  return graphData.edges.filter(e => (e.timestamp || "00:00") >= after);
}

function initCytoscape() {
  if (cy) {
    cy.destroy();
    cy = null;
  }
  const edges = getFilteredEdges();
  const elements = {
    nodes: graphData.nodes.map(n => ({
      data: {
        id: n.id,
        label: n.label,
        type: n.type,
        criticality: n.criticality,
        description: n.description,
        centrality: centralityScores[n.id] || 0.1
      }
    })),
    edges: edges.map(e => ({
      data: {
        id: e.source + "-" + e.target,
        source: e.source,
        target: e.target,
        relation: e.relation,
        weight: e.weight || 1,
        timestamp: e.timestamp || ""
      }
    }))
  };

  const isDirected = currentMode() === "directed";

  cy = cytoscape({
    container: $("cy"),
    elements,
    style: [
      { selector: "node", style: {
        "background-color": ele => critColors[ele.data("criticality")] || "#a7e3c2",
        "width": ele => 20 + (ele.data("centrality") || 0.1) * 40,
        "height": ele => 20 + (ele.data("centrality") || 0.1) * 40,
        "label": "data(label)",
        "font-size": 9,
        "color": "#e9f0ed",
        "text-valign": "bottom",
        "text-margin-y": 4,
        "text-outline-width": 1,
        "text-outline-color": "#0c1519"
      }},
      { selector: "edge", style: {
        "width": 1.5,
        "line-color": "#4a5f63",
        "target-arrow-color": "#4a5f63",
        "target-arrow-shape": isDirected ? "triangle" : "none",
        "curve-style": "bezier",
        "opacity": 0.7
      }},
      { selector: "node.highlight", style: {
        "border-width": 3,
        "border-color": "#4fbd91",
        "background-color": "#4fbd91"
      }},
      { selector: "edge.highlight", style: {
        "width": 3,
        "line-color": "#4fbd91",
        "opacity": 1,
        "line-style": "solid"
      }},
      { selector: "node.dim", style: { "opacity": 0.25 }},
      { selector: "edge.dim", style: { "opacity": 0.15 }}
    ],
    layout: { name: "cose", animate: true, animationDuration: 800, nodeRepulsion: 4500, idealEdgeLength: 80 }
  });

  cy.on("tap", "node", evt => {
    selectNode(evt.target.id());
  });

  cy.on("mouseover", "node", evt => {
    const n = evt.target.data();
    $("selectedLabel").textContent = n.label + " · " + n.type + " · " + n.criticality + " · " + n.description;
  });
}

function updateHighlights() {
  if (!cy) return;
  cy.nodes().removeClass("highlight dim");
  cy.edges().removeClass("highlight dim");
  if (highlighted.size === 0) return;
  cy.nodes().forEach(n => {
    if (highlighted.has(n.id())) n.addClass("highlight");
    else n.addClass("dim");
  });
  cy.edges().forEach(e => {
    if (highlighted.has(e.source().id()) && highlighted.has(e.target().id())) {
      e.addClass("highlight");
    } else {
      e.addClass("dim");
    }
  });
  cy.edges(".highlight").animate({ style: { "width": 4 } }, { duration: 300 }).animate({ style: { "width": 3 } }, { duration: 300 });
}

function selectNode(id) {
  selectedNode = id;
  $("sourceSelect").value = id;
  const n = graphData.nodes.find(x => x.id === id);
  if (n) $("selectedLabel").textContent = "Selected: " + n.label + " · " + n.type + " · " + n.criticality + " criticality";
  updateHighlights();
}

function fillSelects() {
  const opts = graphData.nodes.map(n => '<option value="' + n.id + '">' + escapeHtml(n.label) + ' (' + n.id + ')</option>').join("");
  $("sourceSelect").innerHTML = opts;
  const critical = graphData.nodes.filter(n => ["critical", "high"].includes(n.criticality));
  $("targetSelect").innerHTML = critical.map(n => '<option value="' + n.id + '">' + escapeHtml(n.label) + ' (' + n.id + ')</option>').join("");
  $("sourceSelect").value = "D01";
  $("targetSelect").value = "DB01";
}

async function loadCentrality() {
  try {
    const params = new URLSearchParams({ mode: currentMode() });
    if (currentAfter()) params.set("after", currentAfter());
    const data = await getJSON("/api/choke-points?" + params);
    centralityScores = {};
    data.items.forEach(item => { centralityScores[item.id] = item.score; });
  } catch (e) { console.warn(e); }
}

async function blastRadius() {
  try {
    const id = $("sourceSelect").value;
    const params = new URLSearchParams({ mode: currentMode() });
    if (currentAfter()) params.set("after", currentAfter());
    const data = await getJSON("/api/blast-radius/" + id + "?" + params);
    highlighted = new Set([id, ...data.impacted.map(x => x.id)]);
    selectNode(id);
    const top = data.impacted.slice(0, 8).map(x =>
      '<li><b>' + escapeHtml(x.label) + '</b> (' + x.hops + '-hop) — score ' + x.risk_score + '<br><small class="muted">Crit ' + x.breakdown.criticality_score + ' × avg weight ' + x.breakdown.avg_edge_weight + ' / ' + x.hops + '</small></li>'
    ).join("");
    $("blastResult").className = "result";
    $("blastResult").innerHTML = '<b>' + escapeHtml(data.source.label) + '</b> — ranked by illustrative risk score<ul>' + (top || "<li>None</li>") + '</ul><span class="muted">' + escapeHtml(data.note) + '</span>';
    updateHighlights();
  } catch (e) { $("blastResult").textContent = e.message; }
}

async function attackPath() {
  try {
    const source = $("sourceSelect").value, target = $("targetSelect").value;
    const params = new URLSearchParams({ source, target, mode: currentMode() });
    if (currentAfter()) params.set("after", currentAfter());
    const data = await getJSON("/api/attack-path?" + params);
    highlighted = new Set(data.path.map(x => x.id));
    selectNode(source);
    $("pathResult").className = "result";
    $("pathResult").innerHTML = data.path.length
      ? '<b>' + data.length + ' relationship hops (weighted)</b><ul>' + data.path.map(x => '<li>' + escapeHtml(x.label) + ' <span class="tag">' + escapeHtml(x.type) + '</span></li>').join("") + '</ul><span class="muted">' + escapeHtml(data.note) + '</span>'
      : escapeHtml(data.message);
    updateHighlights();
  } catch (e) { $("pathResult").textContent = e.message; }
}

async function containment() {
  try {
    const source = $("sourceSelect").value, target = $("targetSelect").value;
    const params = new URLSearchParams({ source, target, mode: currentMode() });
    if (currentAfter()) params.set("after", currentAfter());
    const data = await getJSON("/api/containment?" + params);
    if (!data.suggestions.length) {
      $("containResult").innerHTML = escapeHtml(data.message || "No suggestions.");
      return;
    }
    highlighted = new Set(data.path.map(x => x.id));
    updateHighlights();
    const items = data.suggestions.map(s =>
      '<li><b>' + escapeHtml(s.label) + '</b> — ' + (s.disrupts_path ? "Disrupts path" : "Alternative paths exist") + '<br><small>' + escapeHtml(s.explanation) + '</small><br><small class="muted">' + escapeHtml(s.operational_impact) + '</small></li>'
    ).join("");
    $("containResult").className = "result";
    $("containResult").innerHTML = '<b>Illustrative containment points</b><ul>' + items + '</ul><span class="muted">' + escapeHtml(data.note) + '</span>';
  } catch (e) { $("containResult").textContent = e.message; }
}

async function chokePoints() {
  try {
    const params = new URLSearchParams({ mode: currentMode() });
    if (currentAfter()) params.set("after", currentAfter());
    const data = await getJSON("/api/choke-points?" + params);
    highlighted = new Set(data.items.map(x => x.id));
    updateHighlights();
    $("chokeResult").className = "result";
    $("chokeResult").innerHTML = '<ol>' + (data.items.map(x => '<li>' + escapeHtml(x.label) + ' — score ' + x.score + '</li>').join("") || "<li>None</li>") + '</ol><span class="muted">' + escapeHtml(data.note) + '</span>';
  } catch (e) { $("chokeResult").textContent = e.message; }
}

async function loadAlerts() {
  const [alerts, incident] = await Promise.all([getJSON("/api/alerts"), getJSON("/api/incident")]);
  $("alertCount").textContent = alerts.length;
  $("incidentSummary").textContent = incident.summary + " " + incident.note;
  $("alerts").innerHTML = incident.alerts.map(a =>
    '<article class="alert ' + a.severity + '"><div class="alert-top"><b>' + escapeHtml(a.title) + '</b><span class="tag ' + a.severity + '">' + escapeHtml(a.severity.toUpperCase()) + '</span></div><p>' + escapeHtml(a.description) + '</p><small>' + escapeHtml(a.id) + ' · ' + escapeHtml(a.time) + ' · RELATED: ' + a.related_nodes.map(escapeHtml).join(", ") + '</small></article>'
  ).join("");
}

function resetHighlights() {
  highlighted = new Set();
  updateHighlights();
  $("selectedLabel").textContent = "Select a node to inspect it.";
}

async function playScenario() {
  $("sourceSelect").value = "D01";
  $("targetSelect").value = "DB01";
  $("modeSelect").value = "undirected";
  $("afterTime").value = "";
  $("modePill").textContent = "UNDIRECTED";
  await applyFilter();
  await blastRadius();
  setTimeout(() => attackPath(), 1200);
  setTimeout(() => containment(), 2400);
  setTimeout(() => {
    $("blastResult").innerHTML += "<br><b>Scenario complete.</b> Review alerts, ranked impact, path, and containment suggestions above. All data is synthetic. Scores and weights are illustrative only.";
  }, 3600);
}

async function applyFilter() {
  $("modePill").textContent = currentMode().toUpperCase();
  await loadCentrality();
  initCytoscape();
  resetHighlights();
}

async function init() {
  try {
    graphData = await getJSON("/api/graph");
    $("nodeCount").textContent = graphData.nodes.length;
    $("edgeCount").textContent = graphData.edges.length;
    const critical = graphData.nodes.filter(n => ["critical", "high"].includes(n.criticality)).length;
    $("criticalCount").textContent = critical;
    fillSelects();
    await loadCentrality();
    initCytoscape();
    await loadAlerts();

    $("blastBtn").onclick = blastRadius;
    $("pathBtn").onclick = attackPath;
    $("containBtn").onclick = containment;
    $("chokeBtn").onclick = chokePoints;
    $("resetBtn").onclick = resetHighlights;
    $("scenarioBtn").onclick = playScenario;
    $("applyFilter").onclick = applyFilter;
    $("modeSelect").onchange = applyFilter;
  } catch (e) {
    console.error(e);
    $("blastResult").textContent = "Failed to load graph data.";
  }
}

init();
