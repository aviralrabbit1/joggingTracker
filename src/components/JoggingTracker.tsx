import CanvasBoard from './CanvasBoard';
import SessionStats from './SessionStats';
import SessionHistory from './SessionHistory';
import Session from './Session';
import { useLocationTracking } from '../hooks/UseLocationTracking';

const JoggingTracker = () => {
  // Custom hook to get current position
  const {
    currentPosition
  } = useLocationTracking();
  
  return (
    <div>
      <h1>
        JoggingTracker
      </h1>
      <Session/>
      <CanvasBoard 
        currentPosition={currentPosition} positions={[]} />
      <SessionStats/>
      <SessionHistory/>
    
    </div>
  )
}

export default JoggingTracker