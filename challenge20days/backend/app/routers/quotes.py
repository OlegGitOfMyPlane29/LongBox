from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud
from app.database import get_db
from app.schemas import QuotePublic

router = APIRouter(prefix="/quotes", tags=["quotes"])


@router.get("", response_model=list[QuotePublic])
def list_quotes(limit: int = 50, db: Session = Depends(get_db)):
    rows = crud.list_quotes(db, limit=min(limit, 100))
    return rows


@router.get("/random", response_model=QuotePublic)
def random_quote(db: Session = Depends(get_db)):
    q = crud.random_quote(db)
    if not q:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Цитаты не найдены")
    return q
