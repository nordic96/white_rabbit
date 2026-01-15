"""
Search-related schemas for API request/response models.
"""
from pydantic import BaseModel, Field
from typing import List


class SearchResultItem(BaseModel):
    """Individual search result item."""
    id: str = Field(description="Unique identifier for the node")
    type: str = Field(description="Node type (Mystery, Location, TimePeriod, Category)")
    text: str = Field(description="Matched text (title, name, or label)")
    score: float = Field(description="Search relevance score")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "m-bermuda-triangle",
                "type": "Mystery",
                "text": "Bermuda Triangle",
                "score": 2.5
            }
        }


class SearchResponse(BaseModel):
    """Response model for search endpoint."""
    query: str = Field(description="The search query that was executed")
    total: int = Field(description="Total number of results found")
    results: List[SearchResultItem] = Field(description="List of search results")

    class Config:
        json_schema_extra = {
            "example": {
                "query": "ancient",
                "total": 3,
                "results": [
                    {"id": "m-pyramids", "type": "Mystery", "text": "Ancient Pyramids", "score": 3.2},
                    {"id": "tp-ancient", "type": "TimePeriod", "text": "Ancient Era", "score": 2.8},
                    {"id": "l-egypt", "type": "Location", "text": "Ancient Egypt", "score": 2.1}
                ]
            }
        }
