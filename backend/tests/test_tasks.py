import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_task(client: AsyncClient, auth_headers: dict):
    res = await client.post(
        "/api/tasks/",
        json={"title": "Study for exam", "priority": "high"},
        headers=auth_headers,
    )
    assert res.status_code == 201
    data = res.json()
    assert data["title"] == "Study for exam"
    assert data["priority"] == "high"
    assert data["status"] == "todo"


@pytest.mark.asyncio
async def test_create_task_with_deadline(client: AsyncClient, auth_headers: dict):
    res = await client.post(
        "/api/tasks/",
        json={"title": "Assignment", "priority": "medium", "deadline": "2026-12-31T23:59:00"},
        headers=auth_headers,
    )
    assert res.status_code == 201
    assert res.json()["deadline"] is not None


@pytest.mark.asyncio
async def test_create_task_requires_auth(client: AsyncClient):
    res = await client.post("/api/tasks/", json={"title": "No auth"})
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_list_tasks(client: AsyncClient, auth_headers: dict):
    for i in range(3):
        await client.post(
            "/api/tasks/", json={"title": f"Task {i}"}, headers=auth_headers
        )
    res = await client.get("/api/tasks/", headers=auth_headers)
    assert res.status_code == 200
    assert len(res.json()) >= 3


@pytest.mark.asyncio
async def test_update_task_status(client: AsyncClient, auth_headers: dict):
    create = await client.post(
        "/api/tasks/", json={"title": "Finish report"}, headers=auth_headers
    )
    task_id = create.json()["id"]

    res = await client.put(
        f"/api/tasks/{task_id}",
        json={"status": "done"},
        headers=auth_headers,
    )
    assert res.status_code == 200
    assert res.json()["status"] == "done"


@pytest.mark.asyncio
async def test_delete_task(client: AsyncClient, auth_headers: dict):
    create = await client.post(
        "/api/tasks/", json={"title": "Delete me"}, headers=auth_headers
    )
    task_id = create.json()["id"]

    res = await client.delete(f"/api/tasks/{task_id}", headers=auth_headers)
    assert res.status_code == 204

    fetch = await client.get(f"/api/tasks/{task_id}", headers=auth_headers)
    assert fetch.status_code == 404


@pytest.mark.asyncio
async def test_cannot_access_other_users_task(client: AsyncClient, auth_headers: dict):
    create = await client.post(
        "/api/tasks/", json={"title": "Private task"}, headers=auth_headers
    )
    task_id = create.json()["id"]

    await client.post(
        "/api/auth/register",
        json={"email": "other@example.com", "username": "other", "password": "pass1234"},
    )
    login = await client.post(
        "/api/auth/login",
        data={"username": "other@example.com", "password": "pass1234"},
    )
    other_headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    res = await client.get(f"/api/tasks/{task_id}", headers=other_headers)
    assert res.status_code == 404
