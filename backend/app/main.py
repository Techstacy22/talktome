from fastapi import FastAPI

from app.api.routes import router

app = FastAPI(title="TalkToMe API")

app.include_router(router, prefix="/api")


@app.get("/")
async def read_root():
    return {"message": "Welcome to TalkToMe API"}
