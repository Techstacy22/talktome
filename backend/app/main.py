from fastapi import FastAPI

app = FastAPI(title="TalkToMe API")


@app.get("/", summary="Root endpoint")
async def read_root() -> dict[str, str]:
    return {"message": "Welcome to TalkToMe API"}
