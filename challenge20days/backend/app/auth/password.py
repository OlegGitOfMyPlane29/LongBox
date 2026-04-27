import bcrypt


def hash_password(plain: str) -> str:
    data = plain.encode("utf-8")
    if len(data) > 72:
        data = data[:72]
    return bcrypt.hashpw(data, bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    data = plain.encode("utf-8")
    if len(data) > 72:
        data = data[:72]
    return bcrypt.checkpw(data, hashed.encode("utf-8"))
