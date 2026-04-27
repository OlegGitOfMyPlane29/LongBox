from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app import crud
from app.auth import create_access_token, verify_password
from app.database import get_db
from app.rate_limit import limiter
from app.schemas import Token, UserCreate, UserLogin, UserPublic

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
def register(request: Request, body: UserCreate, db: Session = Depends(get_db)):
    if crud.get_user_by_email(db, str(body.email).lower()):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email уже занят")
    if crud.get_user_by_username(db, body.username.strip()):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Имя пользователя занято")
    return crud.create_user(db, body)


@router.post("/login", response_model=Token)
@limiter.limit("30/minute")
def login(request: Request, body: UserLogin, db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, str(body.email).lower())
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Неверный email или пароль")
    token = create_access_token(user.id, {"email": user.email})
    return Token(access_token=token)
