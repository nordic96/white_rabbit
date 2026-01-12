'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import type { Node, Relationship } from '@neo4j-nvl/base';
import { InteractiveNvlWrapper } from '@neo4j-nvl/react';
import type { MouseEventCallbacks } from '@neo4j-nvl/react';
import { GraphResponse, NodeType } from '@/types';
import { useMysteryStore } from '@/store/mysteryStore';

const NodeColorMap: Record<NodeType, string> = {
  Category: '#8BE9FD',
  Location: '#FF79C6',
  Mystery: '#BD93F9',
  TimePeriod: '#F1FA8C',
};

const MYSTERY_ID_PREFIX = 'm-';

export default function GraphMap() {
  const setSelectedId = useMysteryStore((s) => s.setSelectedId);

  const [nodes, setNodes] = useState<Node[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  const fetchGraphCallback = useCallback(async () => {
    try {
      const response = await fetch('/api/graph');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data: GraphResponse = await response.json();

      // Use startTransition for non-urgent state updates
      startTransition(() => {
        // Transform to NVL format
        const nvlNodes: Node[] = data.nodes.map((node) => ({
          id: node.id,
          caption: node.label,
          color: NodeColorMap[node.type],
          size: node.type === 'Mystery' ? 30 : 20,
        }));

        const nvlRels: Relationship[] = data.relationships.map((rel) => ({
          id: rel.id,
          from: rel.source,
          to: rel.target,
          caption: rel.type,
        }));

        setNodes(nvlNodes);
        setRelationships(nvlRels);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  useEffect(() => {
    fetchGraphCallback();
  }, [fetchGraphCallback]);

  const mouseCallbacks: MouseEventCallbacks = {
    onNodeClick: async (node) => {
      if (node.id && node.id.startsWith(MYSTERY_ID_PREFIX)) {
        setSelectedId(node.id);
      }
    },
    onRelationshipClick: true,
    onHover: true,
    onZoom: true,
    onPan: true,
    // Enable node dragging (same behavior as Neo4j Dashboard)
    onDrag: true,
  };

  // Error state
  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center text-red-500">
        Error: {error}
      </div>
    );
  }

  // Loading/pending state
  if (isPending || nodes.length === 0) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading graph data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen border border-black">
      <InteractiveNvlWrapper
        nodes={nodes}
        rels={relationships}
        mouseEventCallbacks={mouseCallbacks}
        nvlOptions={{
          disableWebWorkers: true, // KEY FIX: Run layout on main thread
          disableTelemetry: true,
          initialZoom: 1,
          minZoom: 0.1,
          maxZoom: 5,
        }}
        nvlCallbacks={{
          onLayoutDone: () => console.log('Layout complete'),
        }}
      />
    </div>
  );
}
