import { useWorldStore } from './store/useWorldStore';
import { LandingView } from './components/LandingView';
import { PreparationView } from './components/PreparationView';
import { PortalTransition } from './components/PortalTransition';
import { WorldCanvas } from './engine/WorldCanvas';
import { ExploreHUD } from './components/ExploreHUD';

export function App() {
  const stage = useWorldStore((s) => s.stage);

  if (stage === 'landing') {
    return <LandingView />;
  }

  if (stage === 'preparing') {
    return <PreparationView />;
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#090B10]">
      <WorldCanvas />
      {stage === 'transitioning' && <PortalTransition />}
      {stage === 'exploring' && <ExploreHUD />}
    </div>
  );
}

export default App;
