'use client';

import { GraphResponse } from '@/app/types';
import { BasicNvlWrapper } from '@neo4j-nvl/react';
import { useEffect, useState } from 'react';

export default function GraphMap() {
  const [graphData, setGraphData] = useState<GraphResponse>();
  useEffect(() => {
    async function fetchGraphData() {
      await fetch('/api/graph')
        .then((v) => v.json())
        .then((v) => {
          setGraphData(v as GraphResponse);
        });
    }
    fetchGraphData();
  }, []);

  if (!graphData) {
    return null;
  }

  return (
    <BasicNvlWrapper
      nodes={graphData.nodes}
      rels={graphData.relationships.map((x) => ({
        ...x,
        from: x.source,
        to: x.target,
      }))}
    />
  );
}
