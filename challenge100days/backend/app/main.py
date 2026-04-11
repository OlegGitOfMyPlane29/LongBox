from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import settings
from .routers import auth, challenges, feed, users

app = FastAPI(title="challenge100days API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_: Request, exc: RequestValidationError):
    first_error = exc.errors()[0] if exc.errors() else None
    message = first_error.get("msg", "Некорректные данные") if first_error else "Некорректные данные"
    return JSONResponse(status_code=400, content={"detail": f"Ошибка валидации: {message}"})


@app.get("/health")
def health():
    return {"message": "Сервер работает"}


app.include_router(auth.router)
app.include_router(users.router)
app.include_router(challenges.router)
app.include_router(feed.router)
