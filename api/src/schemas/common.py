"""
Common schemas and enums used across the API.
"""
from enum import Enum
from pydantic import BaseModel, Field
from typing import Optional


class MysteryStatus(str, Enum):
    """Status of a mystery entry."""
    UNRESOLVED = "unresolved"
    RESOLVED = "resolved"
    PARTIALLY_RESOLVED = "partially_resolved"
    DEBUNKED = "debunked"


class NodeType(str, Enum):
    """Valid node types in the graph database."""
    MYSTERY = "Mystery"
    LOCATION = "Location"
    TIME_PERIOD = "TimePeriod"
    CATEGORY = "Category"


class PaginationParams(BaseModel):
    """Pagination parameters for list endpoints."""
    limit: int = Field(default=20, ge=1, le=100, description="Number of items to return (max 100)")
    offset: int = Field(default=0, ge=0, description="Number of items to skip")


class GraphMetadata(BaseModel):
    """Metadata for graph responses."""
    node_count: int = Field(description="Total number of nodes in the response")
    relationship_count: int = Field(description="Total number of relationships in the response")
