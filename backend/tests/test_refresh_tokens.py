import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_refresh_returns_new_tokens(client: AsyncClient, refresh_token: str):
    res = await client.post("/api/auth/refresh", json={"refresh_token": refresh_token})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["refresh_token"] != refresh_token  # rotated


@pytest.mark.asyncio
async def test_refresh_invalid_token(client: AsyncClient):
    res = await client.post("/api/auth/refresh", json={"refresh_token": "not-a-real-token"})
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_refresh_token_rotation(client: AsyncClient, refresh_token: str):
    # Use once → get new token
    res1 = await client.post("/api/auth/refresh", json={"refresh_token": refresh_token})
    new_token = res1.json()["refresh_token"]

    # Old token should now be invalid
    res2 = await client.post("/api/auth/refresh", json={"refresh_token": refresh_token})
    assert res2.status_code == 401

    # New token should work
    res3 = await client.post("/api/auth/refresh", json={"refresh_token": new_token})
    assert res3.status_code == 200


@pytest.mark.asyncio
async def test_logout_revokes_token(client: AsyncClient, refresh_token: str):
    res = await client.post("/api/auth/logout", json={"refresh_token": refresh_token})
    assert res.status_code == 204

    # Token should no longer work
    res2 = await client.post("/api/auth/refresh", json={"refresh_token": refresh_token})
    assert res2.status_code == 401


@pytest.mark.asyncio
async def test_password_change(client: AsyncClient, registered_user: dict, auth_headers: dict):
    res = await client.put(
        "/api/auth/password",
        json={"current_password": registered_user["password"], "new_password": "newpass456"},
        headers=auth_headers,
    )
    assert res.status_code == 204

    # Old password should no longer work
    res2 = await client.post(
        "/api/auth/login",
        data={"username": registered_user["email"], "password": registered_user["password"]},
    )
    assert res2.status_code == 401

    # New password should work
    res3 = await client.post(
        "/api/auth/login",
        data={"username": registered_user["email"], "password": "newpass456"},
    )
    assert res3.status_code == 200


@pytest.mark.asyncio
async def test_password_change_wrong_current(client: AsyncClient, auth_headers: dict):
    res = await client.put(
        "/api/auth/password",
        json={"current_password": "wrongpassword", "new_password": "newpass456"},
        headers=auth_headers,
    )
    assert res.status_code == 400


@pytest.mark.asyncio
async def test_password_change_requires_auth(client: AsyncClient):
    res = await client.put(
        "/api/auth/password",
        json={"current_password": "old", "new_password": "new"},
    )
    assert res.status_code == 401
