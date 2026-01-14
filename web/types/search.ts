export interface SearchResultItem {
  id: string;
  type: 'Mystery' | 'Location' | 'TimePeriod' | 'Category';
  text: string;
  score: number;
}

export interface SearchResponse {
  query: string;
  total: number;
  results: SearchResultItem[];
}
