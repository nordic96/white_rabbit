"""
Graph visualization schemas for NVL integration.
"""
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional


class GraphNode(BaseModel):
    """Node in the graph visualization."""
    id: str = Field(description="Unique node identifier")
    label: str = Field(description="Display label for the node")
    type: str = Field(description="Node type (Mystery, Location, TimePeriod, Category)")
    properties: Dict[str, Any] = Field(default_factory=dict, description="Additional node properties")


class GraphRelationship(BaseModel):
    """Relationship/edge in the graph visualization."""
    id: str = Field(description="Unique relationship identifier")
    source: str = Field(description="Source node ID")
    target: str = Field(description="Target node ID")
    type: str = Field(description="Relationship type")
    properties: Dict[str, Any] = Field(default_factory=dict, description="Additional relationship properties")


class GraphResponse(BaseModel):
    """Response model for graph visualization endpoint."""
    nodes: List[GraphNode] = Field(description="List of graph nodes")
    relationships: List[GraphRelationship] = Field(description="List of graph relationships")
    metadata: Dict[str, int] = Field(
        description="Metadata about the graph",
        example={"node_count": 10, "relationship_count": 15}
    )
