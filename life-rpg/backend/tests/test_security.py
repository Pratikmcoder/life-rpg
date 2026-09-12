import pytest
from app.utils.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)


def test_password_hashing_and_verification():
    password = "SuperSecretPassword123!"
    hashed = hash_password(password)
    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("WrongPassword123!", hashed) is False


def test_jwt_access_token():
    user_id = "507f1f77bcf86cd799439011"
    token = create_access_token(user_id)
    assert token is not None
    decoded = decode_token(token, token_type="access")
    assert decoded == user_id


def test_jwt_refresh_token():
    user_id = "507f1f77bcf86cd799439011"
    token = create_refresh_token(user_id)
    assert token is not None
    decoded = decode_token(token, token_type="refresh")
    assert decoded == user_id


def test_jwt_invalid_token():
    assert decode_token("invalid.token.payload") is None
