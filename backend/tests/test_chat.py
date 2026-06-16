import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_chat_session(client: AsyncClient, auth_headers: dict):
    res = await client.post(
        "/api/chat/sessions",
        json={"title": "Test Session"},
        headers=auth_headers,
    )
    assert res.status_code == 201
    data = res.json()
    assert "id" in data
    assert data["title"] == "Test Session"


@pytest.mark.asyncio
async def test_create_session_requires_auth(client: AsyncClient):
    res = await client.post("/api/chat/sessions", json={"title": "No auth"})
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_list_sessions(client: AsyncClient, auth_headers: dict):
    await client.post("/api/chat/sessions", json={"title": "S1"}, headers=auth_headers)
    await client.post("/api/chat/sessions", json={"title": "S2"}, headers=auth_headers)

    res = await client.get("/api/chat/sessions", headers=auth_headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)
    assert len(res.json()) >= 2


@pytest.mark.asyncio
async def test_get_session_with_messages(client: AsyncClient, auth_headers: dict):
    create = await client.post(
        "/api/chat/sessions", json={"title": "History"}, headers=auth_headers
    )
    session_id = create.json()["id"]

    res = await client.get(f"/api/chat/sessions/{session_id}", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == session_id
    assert "messages" in data
    assert isinstance(data["messages"], list)


@pytest.mark.asyncio
async def test_get_session_not_found(client: AsyncClient, auth_headers: dict):
    fake_id = "00000000-0000-0000-0000-000000000000"
    res = await client.get(f"/api/chat/sessions/{fake_id}", headers=auth_headers)
    assert res.status_code == 404


@pytest.mark.asyncio
async def test_delete_session(client: AsyncClient, auth_headers: dict):
    create = await client.post(
        "/api/chat/sessions", json={"title": "Delete me"}, headers=auth_headers
    )
    session_id = create.json()["id"]

    res = await client.delete(f"/api/chat/sessions/{session_id}", headers=auth_headers)
    assert res.status_code == 204

    fetch = await client.get(f"/api/chat/sessions/{session_id}", headers=auth_headers)
    assert fetch.status_code == 404


@pytest.mark.asyncio
async def test_cannot_access_other_users_session(client: AsyncClient, auth_headers: dict):
    create = await client.post(
        "/api/chat/sessions", json={"title": "Private"}, headers=auth_headers
    )
    session_id = create.json()["id"]

    await client.post(
        "/api/auth/register",
        json={"email": "chatb@example.com", "username": "chatb", "password": "pass1234"},
    )
    login = await client.post(
        "/api/auth/login",
        data={"username": "chatb@example.com", "password": "pass1234"},
    )
    other_headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    res = await client.get(f"/api/chat/sessions/{session_id}", headers=other_headers)
    assert res.status_code == 404


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    res = await client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"
