"""
Generic node schemas for type-based queries.
"""
from pydantic import BaseModel, Field
from typing import Any, Dict, List


class GenericNode(BaseModel):
    """Generic node representation for any node type."""
    id: str = Field(description="Unique node identifier")
    type: str = Field(description="Node type (Mystery, Location, TimePeriod, Category)")
    properties: Dict[str, Any] = Field(default_factory=dict, description="Node properties")


class NodeListResponse(BaseModel):
    """Response model for node list by type endpoint."""
    nodes: List[GenericNode] = Field(description="List of nodes")
    total: int = Field(description="Total number of nodes of this type")
    type: str = Field(description="Node type queried")
