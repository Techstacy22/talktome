from collections.abc import AsyncGenerator

from openai import AsyncOpenAI

from app.config import settings

BASE_SYSTEM_PROMPT = """You are TalkToMe, an empathetic AI companion designed to help \
students understand their thoughts, organize their lives, and make better decisions. \
You listen actively, ask thoughtful follow-up questions, and provide supportive \
guidance without judgment. Be warm, concise, and genuinely helpful."""


def _client() -> AsyncOpenAI:
    kwargs: dict = {"api_key": settings.openai_api_key}
    if settings.ai_base_url:
        kwargs["base_url"] = settings.ai_base_url
    return AsyncOpenAI(**kwargs)


async def stream_chat(
    history: list[dict], memory_context: str = ""
) -> AsyncGenerator[str, None]:
    if not settings.openai_api_key:
        yield "AI chat is not configured. Add an OPENAI_API_KEY to your .env file to enable this feature."
        return

    client = _client()
    system_content = BASE_SYSTEM_PROMPT + memory_context
    messages = [{"role": "system", "content": system_content}] + history

    stream = await client.chat.completions.create(
        model=settings.openai_model,
        messages=messages,
        stream=True,
    )

    async for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta
