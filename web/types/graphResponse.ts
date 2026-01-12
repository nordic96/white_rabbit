import { GraphNode, RelationshipNode } from './graph';

export interface GraphMetatData {
  node_count: number;
  relationship_count: number;
}

export interface GraphResponse {
  nodes: GraphNode[];
  relationships: RelationshipNode[];
  metadata: GraphMetatData;
}
