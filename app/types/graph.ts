export type NodeType = 'Mystery' | 'Location' | 'TimePeriod' | 'Category';
export type RelationshipType = 'OCCURRED_IN' | 'LOCATED_AT' | 'HAS_CATEGORY';
export type GraphProperties = Record<string, unknown>;

export interface GenericNode {
  id: string;
  type: NodeType;
  properties?: GraphProperties;
}

/**
 * Used for NVL Graph Visualisation Data
 */
export interface GraphNode extends GenericNode {
  label: string;
}

export interface RelationshipNode {
  id: string;
  source: string;
  target: string;
  type: RelationshipType;
  properties?: GraphProperties;
}
