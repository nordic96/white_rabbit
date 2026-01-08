import GraphMap from './components/GraphMap/GraphMap';

export default function Home() {
  return (
    <div className="flex w-full min-h-screen items-center justify-center font-sans">
      <main className="flex grow min-h-screen max-w-3xl flex-col items-center justify-between p-16 sm:items-start">
        <GraphMap />
      </main>
    </div>
  );
}
