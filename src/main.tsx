import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import initYtgameIntegration from './ytgame-integration';

// Initialize YouTube Playables integration (if sdk loaded).
// This notifies YouTube of first frame and game-ready lifecycle events.
initYtgameIntegration();

createRoot(document.getElementById("root")!).render(<App />);
