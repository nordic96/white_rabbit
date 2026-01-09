'use client';

import dynamic from 'next/dynamic';

const GraphMap = dynamic(() => import('./components/GraphMap/GraphMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p>Loading graph visualization...</p>
      </div>
    </div>
  ),
});

export default function Home() {
  return (
    <div className="w-full h-full font-sans">
      <GraphMap />
    </div>
  );
}
