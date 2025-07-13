import CanvasBoard from './CanvasBoard';
import SessionStats from './SessionStats';
import SessionHistory from './SessionHistory';
import Session from './Session';

const JoggingTracker = () => {
  return (
    <div>
      <h1>
        JoggingTracker
      </h1>
      <Session/>
      <CanvasBoard/>
      <SessionStats/>
      <SessionHistory/>
    
    </div>
  )
}

export default JoggingTracker