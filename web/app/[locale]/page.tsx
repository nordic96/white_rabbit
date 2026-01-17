'use client';

import { MysteryModal } from '@/components/MysteryModal';
import RightSidePanel from '@/components/RightSidePanel/RightSidePanel';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const GraphMap = dynamic(() => import('@/components/GraphMap/GraphMap'), {
  ssr: false,
  loading: () => <LoadingSpinner message={'Loading Graph Data'} />,
});

export default function Home() {
  return (
    <div className="relative w-full h-full font-sans overflow-hidden">
      <GraphMap />
      <Suspense fallback={null}>
        <MysteryModal />
        <RightSidePanel />
      </Suspense>
    </div>
  );
}
