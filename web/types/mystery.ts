export interface SimilarMystery {
  id: string;
  title: string;
  score: number;
  reasons: string[];
}

export interface LocationNode {
  id: string;
  name: string;
  latitude?: number;
  longitude?: number;
  country?: string;
}

export interface TimePeriodNode {
  id: string;
  label: string;
  start_year?: number;
  end_year?: number;
}

export interface CategoryNode {
  id: string;
  name: string;
}

export interface MysteryDetail {
  id: string;
  title: string;
  status: string;
  confidence_score?: number;
  image_source?: string[];
  video_source?: string[];
  first_reported_year?: number;
  last_reported_year?: number;
  locations: LocationNode[];
  time_periods: TimePeriodNode[];
  categories: CategoryNode[];
  similar_mysteries: SimilarMystery[];
}

export interface MysteryItem {
  id: string;
  title: string;
  status: string;
  confidence_score?: number;
  image_source?: string[];
  video_source?: string[];
  first_reported_year?: number;
  last_reported_year?: number;
}

export interface ApiMysteryListResponse {
  mysteries: MysteryItem[];
  total: number;
  limit: number;
  offset: number;
}
