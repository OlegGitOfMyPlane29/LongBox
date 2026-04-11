import os

from app.auth import hash_password
from app.database import SessionLocal
from app.models import User


def run():
    email = os.getenv("ADMIN_EMAIL", "admin@challenge100days.local").strip().lower()
    password = os.getenv("ADMIN_PASSWORD", "admin12345")
    display_name = os.getenv("ADMIN_DISPLAY_NAME", "Администратор")

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if user:
            user.role = "admin"
            user.display_name = display_name
            if password:
                user.password_hash = hash_password(password)
            db.commit()
            print(f"Админ обновлен: {email}")
            return

        user = User(
            email=email,
            password_hash=hash_password(password),
            display_name=display_name,
            role="admin",
        )
        db.add(user)
        db.commit()
        print(f"Админ создан: {email}")
    finally:
        db.close()


if __name__ == "__main__":
    run()
