import { NodeType } from './graph';

export interface SearchResultItem {
  id: string;
  type: NodeType;
  text: string;
  score: number;
}

export interface SearchResponse {
  query: string;
  total: number;
  results: SearchResultItem[];
}
