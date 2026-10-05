import pytest
from services.auth_service import generate_token, validate_token

def test_generate_token():
    token = generate_token(1)
    assert token is not None

def test_validate_token():
    token = generate_token(42)
    payload = validate_token(token)
    assert payload['user_id'] == 42

def test_invalid_token_raises():
    with pytest.raises(Exception):
        validate_token('invalid-token')
