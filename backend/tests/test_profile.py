import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_profile(client: AsyncClient, auth_headers: dict):
    res = await client.post(
        "/api/profile/me",
        json={"first_name": "Ecstacy", "last_name": "Williams", "university": "USD"},
        headers=auth_headers,
    )
    assert res.status_code in (200, 201)
    data = res.json()
    assert data["first_name"] == "Ecstacy"
    assert data["university"] == "USD"


@pytest.mark.asyncio
async def test_get_profile(client: AsyncClient, auth_headers: dict):
    await client.post(
        "/api/profile/me",
        json={"first_name": "Ecstacy"},
        headers=auth_headers,
    )
    res = await client.get("/api/profile/me", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["first_name"] == "Ecstacy"


@pytest.mark.asyncio
async def test_update_profile(client: AsyncClient, auth_headers: dict):
    await client.post("/api/profile/me", json={"first_name": "Old"}, headers=auth_headers)
    res = await client.put(
        "/api/profile/me",
        json={"first_name": "New", "major": "Computer Science"},
        headers=auth_headers,
    )
    assert res.status_code == 200
    assert res.json()["first_name"] == "New"
    assert res.json()["major"] == "Computer Science"


@pytest.mark.asyncio
async def test_profile_requires_auth(client: AsyncClient):
    res = await client.get("/api/profile/me")
    assert res.status_code == 401
