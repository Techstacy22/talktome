from collections.abc import AsyncGenerator

from openai import AsyncOpenAI

from app.config import settings

client = AsyncOpenAI(api_key=settings.openai_api_key)

SYSTEM_PROMPT = """You are TalkToMe, an empathetic AI companion designed to help \
students understand their thoughts, organize their lives, and make better decisions. \
You listen actively, ask thoughtful follow-up questions, and provide supportive \
guidance without judgment. Be warm, concise, and genuinely helpful."""


async def stream_chat(history: list[dict]) -> AsyncGenerator[str, None]:
    messages = [{"role": "system", "content": SYSTEM_PROMPT}] + history

    stream = await client.chat.completions.create(
        model=settings.openai_model,
        messages=messages,
        stream=True,
    )

    async for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta
