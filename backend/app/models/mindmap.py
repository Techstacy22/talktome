from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, Float, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class MindMap(Base):
    __tablename__ = "mind_maps"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    nodes: Mapped[list["MindMapNode"]] = relationship(
        back_populates="mind_map", cascade="all, delete-orphan"
    )
    edges: Mapped[list["MindMapEdge"]] = relationship(
        back_populates="mind_map", cascade="all, delete-orphan"
    )


class MindMapNode(Base):
    __tablename__ = "mind_map_nodes"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    map_id: Mapped[UUID] = mapped_column(
        ForeignKey("mind_maps.id", ondelete="CASCADE"), index=True
    )
    label: Mapped[str] = mapped_column(String(200))
    category: Mapped[str] = mapped_column(String(50), default="topic")
    weight: Mapped[float] = mapped_column(Float, default=1.0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    mind_map: Mapped["MindMap"] = relationship(back_populates="nodes")


class MindMapEdge(Base):
    __tablename__ = "mind_map_edges"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    map_id: Mapped[UUID] = mapped_column(
        ForeignKey("mind_maps.id", ondelete="CASCADE"), index=True
    )
    source_node_id: Mapped[UUID] = mapped_column(
        ForeignKey("mind_map_nodes.id", ondelete="CASCADE")
    )
    target_node_id: Mapped[UUID] = mapped_column(
        ForeignKey("mind_map_nodes.id", ondelete="CASCADE")
    )
    relationship_label: Mapped[str | None] = mapped_column(String(200), nullable=True)
    weight: Mapped[float] = mapped_column(Float, default=1.0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    mind_map: Mapped["MindMap"] = relationship(back_populates="edges")
