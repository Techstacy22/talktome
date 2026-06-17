import enum
import uuid

from sqlalchemy import DateTime, Enum, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class MemoryCategory(str, enum.Enum):
    goal = "goal"
    challenge = "challenge"
    interest = "interest"
    preference = "preference"
    achievement = "achievement"
    note = "note"


class MemorySource(str, enum.Enum):
    chat = "chat"
    journal = "journal"
    manual = "manual"


class Memory(Base):
    __tablename__ = "memories"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    category: Mapped[MemoryCategory] = mapped_column(
        Enum(MemoryCategory, name="memory_category"), nullable=False
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    source: Mapped[MemorySource] = mapped_column(
        Enum(MemorySource, name="memory_source"), nullable=False, default=MemorySource.manual
    )
    created_at: Mapped[str] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user = relationship("User", back_populates="memories")
