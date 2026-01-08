"""
Mystery-related schemas for API request/response models.
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from .common import MysteryStatus


class MysteryBase(BaseModel):
    """Base mystery fields shared across schemas."""
    title: str = Field(description="Title of the mystery")
    status: MysteryStatus = Field(description="Current status of the mystery")


class MysteryListItem(MysteryBase):
    """Mystery item in list responses."""
    id: str = Field(description="Unique identifier for the mystery")
    confidence_score: Optional[float] = Field(None, description="Confidence score for the mystery")
    first_reported_year: Optional[int] = Field(None, description="First reported year")
    last_reported_year: Optional[int] = Field(None, description="Last reported year")


class LocationNode(BaseModel):
    """Location node associated with a mystery."""
    id: str = Field(description="Unique identifier for the location")
    name: str = Field(description="Name of the location")
    latitude: Optional[float] = Field(None, description="Latitude coordinate")
    longitude: Optional[float] = Field(None, description="Longitude coordinate")
    country: Optional[str] = Field(None, description="Country name")


class TimePeriodNode(BaseModel):
    """Time period node associated with a mystery."""
    id: str = Field(description="Unique identifier for the time period")
    label: str = Field(description="Label of the time period")
    start_year: Optional[int] = Field(None, description="Start year of the period")
    end_year: Optional[int] = Field(None, description="End year of the period")


class CategoryNode(BaseModel):
    """Category node associated with a mystery."""
    id: str = Field(description="Unique identifier for the category")
    name: str = Field(description="Name of the category")


class MysteryDetail(MysteryBase):
    """Detailed mystery with related nodes."""
    id: str = Field(description="Unique identifier for the mystery")
    confidence_score: Optional[float] = Field(None, description="Confidence score for the mystery")
    first_reported_year: Optional[int] = Field(None, description="First reported year")
    last_reported_year: Optional[int] = Field(None, description="Last reported year")
    locations: List[LocationNode] = Field(default_factory=list, description="Associated locations")
    time_periods: List[TimePeriodNode] = Field(default_factory=list, description="Associated time periods")
    categories: List[CategoryNode] = Field(default_factory=list, description="Associated categories")


class MysteryListResponse(BaseModel):
    """Response model for mystery list endpoint."""
    mysteries: List[MysteryListItem] = Field(description="List of mysteries")
    total: int = Field(description="Total number of mysteries matching the query")
    limit: int = Field(description="Number of items per page")
    offset: int = Field(description="Number of items skipped")
