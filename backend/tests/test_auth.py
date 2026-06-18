import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_success(client: AsyncClient):
    res = await client.post(
        "/api/auth/register",
        json={"email": "new@example.com", "username": "newuser", "password": "pass1234"},
    )
    assert res.status_code == 201
    data = res.json()
    assert data["email"] == "new@example.com"
    assert data["username"] == "newuser"
    assert "hashed_password" not in data
    assert "password" not in data


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient, registered_user: dict):
    res = await client.post("/api/auth/register", json=registered_user)
    assert res.status_code == 400
    assert "already exists" in res.json()["detail"]


@pytest.mark.asyncio
async def test_register_invalid_email(client: AsyncClient):
    res = await client.post(
        "/api/auth/register",
        json={"email": "not-an-email", "username": "user", "password": "pass1234"},
    )
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, registered_user: dict):
    res = await client.post(
        "/api/auth/login",
        data={"username": registered_user["email"], "password": registered_user["password"]},
    )
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient, registered_user: dict):
    res = await client.post(
        "/api/auth/login",
        data={"username": registered_user["email"], "password": "wrongpassword"},
    )
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_login_unknown_email(client: AsyncClient):
    res = await client.post(
        "/api/auth/login",
        data={"username": "ghost@example.com", "password": "pass1234"},
    )
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_get_me(client: AsyncClient, registered_user: dict, auth_headers: dict):
    res = await client.get("/api/auth/me", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["email"] == registered_user["email"]


@pytest.mark.asyncio
async def test_get_me_no_token(client: AsyncClient):
    res = await client.get("/api/auth/me")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_get_me_invalid_token(client: AsyncClient):
    res = await client.get("/api/auth/me", headers={"Authorization": "Bearer fake.token.here"})
    assert res.status_code == 401
