import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_journal(client: AsyncClient, auth_headers: dict):
    res = await client.post(
        "/api/journals/",
        json={"title": "My First Entry", "content": "Today was a great day."},
        headers=auth_headers,
    )
    assert res.status_code == 201
    data = res.json()
    assert data["title"] == "My First Entry"
    assert data["content"] == "Today was a great day."
    assert "id" in data
    assert "user_id" in data


@pytest.mark.asyncio
async def test_create_journal_requires_auth(client: AsyncClient):
    res = await client.post(
        "/api/journals/",
        json={"title": "Test", "content": "Content"},
    )
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_create_journal_empty_title(client: AsyncClient, auth_headers: dict):
    res = await client.post(
        "/api/journals/",
        json={"title": "   ", "content": "Some content"},
        headers=auth_headers,
    )
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_list_journals(client: AsyncClient, auth_headers: dict):
    # Create two entries
    for i in range(2):
        await client.post(
            "/api/journals/",
            json={"title": f"Entry {i}", "content": f"Content {i}"},
            headers=auth_headers,
        )

    res = await client.get("/api/journals/", headers=auth_headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)
    assert len(res.json()) >= 2


@pytest.mark.asyncio
async def test_get_journal(client: AsyncClient, auth_headers: dict):
    create = await client.post(
        "/api/journals/",
        json={"title": "Fetch me", "content": "Some content here"},
        headers=auth_headers,
    )
    journal_id = create.json()["id"]

    res = await client.get(f"/api/journals/{journal_id}", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["id"] == journal_id


@pytest.mark.asyncio
async def test_get_journal_not_found(client: AsyncClient, auth_headers: dict):
    fake_id = "00000000-0000-0000-0000-000000000000"
    res = await client.get(f"/api/journals/{fake_id}", headers=auth_headers)
    assert res.status_code == 404


@pytest.mark.asyncio
async def test_update_journal(client: AsyncClient, auth_headers: dict):
    create = await client.post(
        "/api/journals/",
        json={"title": "Old Title", "content": "Old content"},
        headers=auth_headers,
    )
    journal_id = create.json()["id"]

    res = await client.put(
        f"/api/journals/{journal_id}",
        json={"title": "New Title"},
        headers=auth_headers,
    )
    assert res.status_code == 200
    assert res.json()["title"] == "New Title"
    assert res.json()["content"] == "Old content"


@pytest.mark.asyncio
async def test_delete_journal(client: AsyncClient, auth_headers: dict):
    create = await client.post(
        "/api/journals/",
        json={"title": "Delete me", "content": "Gone soon"},
        headers=auth_headers,
    )
    journal_id = create.json()["id"]

    res = await client.delete(f"/api/journals/{journal_id}", headers=auth_headers)
    assert res.status_code == 204

    fetch = await client.get(f"/api/journals/{journal_id}", headers=auth_headers)
    assert fetch.status_code == 404


@pytest.mark.asyncio
async def test_cannot_access_other_users_journal(client: AsyncClient, auth_headers: dict):
    # Create a journal as user A
    create = await client.post(
        "/api/journals/",
        json={"title": "Private", "content": "Secret"},
        headers=auth_headers,
    )
    journal_id = create.json()["id"]

    # Register and login as user B
    await client.post(
        "/api/auth/register",
        json={"email": "userb@example.com", "username": "userb", "password": "pass1234"},
    )
    login = await client.post(
        "/api/auth/login",
        data={"username": "userb@example.com", "password": "pass1234"},
    )
    other_headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    res = await client.get(f"/api/journals/{journal_id}", headers=other_headers)
    assert res.status_code == 404
