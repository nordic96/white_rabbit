"""
Pydantic schemas for request/response validation.
"""
from .common import MysteryStatus, NodeType, PaginationParams, GraphMetadata
from .error import ErrorResponse, ValidationErrorResponse, ErrorDetail
from .mystery import (
    MysteryBase,
    MysteryListItem,
    MysteryDetail,
    MysteryListResponse,
    LocationNode,
    TimePeriodNode,
    CategoryNode
)
from .tts import TTSRequest, TTSResponse
from .node import GenericNode, NodeListResponse
from .graph import GraphNode, GraphRelationship, GraphResponse

__all__ = [
    # Common schemas
    "MysteryStatus",
    "NodeType",
    "PaginationParams",
    "GraphMetadata",
    # Error schemas
    "ErrorResponse",
    "ValidationErrorResponse",
    "ErrorDetail",
    # Mystery schemas
    "MysteryBase",
    "MysteryListItem",
    "MysteryDetail",
    "MysteryListResponse",
    "LocationNode",
    "TimePeriodNode",
    "CategoryNode",
    # TTS Schemas
    "TTSRequest",
    "TTSResponse",
    # Node schemas
    "GenericNode",
    "NodeListResponse",
    # Graph schemas
    "GraphNode",
    "GraphRelationship",
    "GraphResponse",
]
