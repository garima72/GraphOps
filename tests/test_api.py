import pytest
from app import app

@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client

def test_graph(client):
    r = client.get("/api/graph")
    assert r.status_code == 200
    data = r.get_json()
    assert len(data["nodes"]) >= 30
    assert len(data["edges"]) >= 30
    assert "weight" in data["edges"][0]

def test_alerts(client):
    r = client.get("/api/alerts")
    assert r.status_code == 200
    assert len(r.get_json()) >= 5

def test_blast_radius(client):
    r = client.get("/api/blast-radius/D01")
    assert r.status_code == 200
    data = r.get_json()
    assert "impacted" in data
    assert "risk_score" in data["impacted"][0]
    assert "breakdown" in data["impacted"][0]
    assert "illustrative" in data["note"].lower()

def test_attack_path(client):
    r = client.get("/api/attack-path?source=D01&target=DB01")
    assert r.status_code == 200
    data = r.get_json()
    assert len(data["path"]) >= 2

def test_choke_points(client):
    r = client.get("/api/choke-points")
    assert r.status_code == 200
    assert len(r.get_json()["items"]) > 0

def test_containment(client):
    r = client.get("/api/containment?source=D01&target=DB01")
    assert r.status_code == 200
    data = r.get_json()
    assert "suggestions" in data
    assert "guarantee" in data["note"].lower() or "not guarantee" in data["note"].lower()

def test_invalid_node(client):
    r = client.get("/api/blast-radius/INVALID")
    assert r.status_code == 404
