import base64
import hashlib
import hmac
import json
import os
import secrets
import time

from fastapi import HTTPException, status

_SCRYPT_N = 1 << 14
_SCRYPT_R = 8
_SCRYPT_P = 1
_SCRYPT_MAX_MEMORY = 64 * 1024 * 1024


def _b64encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode("ascii")


def _b64decode(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt,
        n=_SCRYPT_N,
        r=_SCRYPT_R,
        p=_SCRYPT_P,
        dklen=32,
        maxmem=_SCRYPT_MAX_MEMORY,
    )
    return f"scrypt${_SCRYPT_N}${_SCRYPT_R}${_SCRYPT_P}${_b64encode(salt)}${_b64encode(digest)}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        algorithm, n, r, p, salt_value, digest_value = stored_hash.split("$")
        if algorithm != "scrypt":
            return False
        expected = _b64decode(digest_value)
        actual = hashlib.scrypt(
            password.encode("utf-8"),
            salt=_b64decode(salt_value),
            n=int(n),
            r=int(r),
            p=int(p),
            dklen=len(expected),
            maxmem=_SCRYPT_MAX_MEMORY,
        )
        return hmac.compare_digest(actual, expected)
    except (ValueError, TypeError):
        return False


def create_access_token(user_id: int) -> str:
    secret = os.getenv("SECRET_KEY", "")
    if len(secret) < 32:
        raise RuntimeError("Set a unique SECRET_KEY of at least 32 characters before starting the API.")
    minutes = int(os.getenv("ACCESS_TOKEN_MINUTES", "720"))
    payload = {"sub": str(user_id), "exp": int(time.time()) + minutes * 60}
    encoded = _b64encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signature = hmac.new(secret.encode("utf-8"), encoded.encode("ascii"), hashlib.sha256).digest()
    return f"{encoded}.{_b64encode(signature)}"


def decode_access_token(token: str) -> int:
    secret = os.getenv("SECRET_KEY", "")
    try:
        encoded, signature = token.split(".", maxsplit=1)
        expected = hmac.new(secret.encode("utf-8"), encoded.encode("ascii"), hashlib.sha256).digest()
        if not hmac.compare_digest(_b64decode(signature), expected):
            raise ValueError("Invalid token signature.")
        payload = json.loads(_b64decode(encoded))
        if int(payload["exp"]) <= int(time.time()):
            raise ValueError("Expired token.")
        return int(payload["sub"])
    except (ValueError, KeyError, TypeError, json.JSONDecodeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your session has expired. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from None
