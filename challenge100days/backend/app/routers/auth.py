from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from .. import crud
from ..auth import create_access_token
from ..config import settings
from ..database import get_db
from ..rate_limit import limiter
from ..schemas import TokenOut, UserLogin, UserRegister

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenOut)
@limiter.limit(settings.auth_rate_limit)
def register(request: Request, payload: UserRegister, db: Session = Depends(get_db)):
    user = crud.create_user(db, payload)
    token = create_access_token(user.id, user.role)
    return {"access_token": token, "user": user}


@router.post("/login", response_model=TokenOut)
@limiter.limit(settings.auth_rate_limit)
def login(request: Request, payload: UserLogin, db: Session = Depends(get_db)):
    user = crud.authenticate_user(db, payload.email, payload.password)
    token = create_access_token(user.id, user.role)
    return {"access_token": token, "user": user}
