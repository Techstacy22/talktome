from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class NodeResponse(BaseModel):
    id: UUID
    label: str
    category: str
    weight: float
    created_at: datetime
    model_config = {"from_attributes": True}


class EdgeResponse(BaseModel):
    id: UUID
    source_node_id: UUID
    target_node_id: UUID
    relationship_label: str | None
    weight: float
    model_config = {"from_attributes": True}


class MindMapResponse(BaseModel):
    map_id: UUID
    nodes: list[NodeResponse]
    edges: list[EdgeResponse]
    updated_at: datetime
