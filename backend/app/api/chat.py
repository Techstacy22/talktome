import json
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.chat import MessageRole
from app.models.user import User
from app.schemas.chat import (
    ChatSessionCreate,
    ChatSessionResponse,
    ChatSessionWithMessages,
    MessageRequest,
)
from app.services import ai as ai_service
from app.services import chat as chat_service
from app.services import memory as memory_service

router = APIRouter()


@router.post(
    "/sessions",
    response_model=ChatSessionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Start a new chat session",
)
async def create_session(
    data: ChatSessionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await chat_service.create_session(db, current_user.id, data)


@router.get(
    "/sessions",
    response_model=list[ChatSessionResponse],
    summary="List all my chat sessions",
)
async def list_sessions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await chat_service.get_sessions(db, current_user.id)


@router.get(
    "/sessions/{session_id}",
    response_model=ChatSessionWithMessages,
    summary="Get a session with its full message history",
)
async def get_session(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = await chat_service.get_session_with_messages(db, session_id, current_user.id)
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    return session


@router.post(
    "/sessions/{session_id}/messages",
    summary="Send a message and stream the AI reply",
)
async def send_message(
    session_id: UUID,
    request: MessageRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = await chat_service.get_session_with_messages(db, session_id, current_user.id)
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    # Save the user's message first
    await chat_service.add_message(db, session_id, MessageRole.user, request.content)

    # Build conversation history for the AI
    history = [
        {"role": msg.role.value, "content": msg.content}
        for msg in session.messages
    ]
    history.append({"role": "user", "content": request.content})

    # Inject long-term memories into the system prompt
    memories = await memory_service.list_memories(db, current_user.id)
    memory_context = memory_service.build_memory_context(memories)

    async def generate():
        full_reply = ""
        try:
            async for chunk in ai_service.stream_chat(history, memory_context):
                full_reply += chunk
                yield f"data: {json.dumps({'content': chunk})}\n\n"
        finally:
            # Always save the reply, even if the client disconnects mid-stream
            if full_reply:
                await chat_service.save_ai_reply(session_id, full_reply)
            yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@router.delete(
    "/sessions/{session_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a chat session and all its messages",
)
async def delete_session(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    deleted = await chat_service.delete_session(db, session_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
