import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_analytics_requires_auth(client: AsyncClient):
    res = await client.get("/api/analytics/")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_analytics_returns_structure(client: AsyncClient, auth_headers: dict):
    res = await client.get("/api/analytics/", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "journal_count" in data
    assert "total_words" in data
    assert "activity_by_day" in data
    assert "top_concepts" in data
    assert isinstance(data["activity_by_day"], list)
    assert isinstance(data["top_concepts"], list)


@pytest.mark.asyncio
async def test_analytics_counts_journals(client: AsyncClient, auth_headers: dict):
    for i in range(3):
        await client.post(
            "/api/journals/",
            json={"title": f"Entry {i}", "content": "Word " * 50},
            headers=auth_headers,
        )
    res = await client.get("/api/analytics/", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["journal_count"] >= 3
    assert data["total_words"] >= 150
