import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_dashboard_requires_auth(client: AsyncClient):
    res = await client.get("/api/dashboard/")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_dashboard_returns_structure(client: AsyncClient, auth_headers: dict):
    res = await client.get("/api/dashboard/", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "recent_journals" in data
    assert "recent_chats" in data
    assert "stats" in data
    assert isinstance(data["recent_journals"], list)
    assert isinstance(data["recent_chats"], list)


@pytest.mark.asyncio
async def test_dashboard_stats_include_counts(client: AsyncClient, auth_headers: dict):
    # Create a journal so stats aren't all zero
    await client.post(
        "/api/journals/",
        json={"title": "Test", "content": "Some content for stats"},
        headers=auth_headers,
    )
    res = await client.get("/api/dashboard/", headers=auth_headers)
    assert res.status_code == 200
    stats = res.json()["stats"]
    assert "journal_count" in stats
    assert stats["journal_count"] >= 1


@pytest.mark.asyncio
async def test_dashboard_recent_journals_populated(client: AsyncClient, auth_headers: dict):
    for i in range(3):
        await client.post(
            "/api/journals/",
            json={"title": f"Entry {i}", "content": "content"},
            headers=auth_headers,
        )
    res = await client.get("/api/dashboard/", headers=auth_headers)
    assert res.status_code == 200
    assert len(res.json()["recent_journals"]) >= 1
