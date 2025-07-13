# Jogging Tracker

<details>
<summary>
1. Starter Template
</summary>

### React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

```sh
D:\Projects\joggingTracker>bun create vite@latest ./
o  Current directory is not empty. Please choose how to proceed:
|  Remove existing files and continue
o  Package name:
|  joggingtracker
o  Select a framework:
|  React
o  Select a variant:
|  TypeScript
```
</details>

<details>
<summary>
2. Structure of Project
</summary>

### Folder Structure of the project

```
jogging-tracker/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── JoggingTracker.tsx        # contains all the components at one place
│   │   ├── CanvasBoard.tsx           # Renders jogging path using Canvas API
│   │   ├── IdleSaveTask.tsx          # Auto-saves path periodically using Background Tasks API 
│   │   ├── Session.tsx               # Tracks real-time user location using Geolocation API
│   │   ├── SessionStats.tsx          # Displays information about the current session
│   │   └── SessionHistory.tsx        # Keeps track of all the previous jogging sessions
│   ├── App.tsx                       # Main app integrating JoggingTracker component
│   ├── main.ts                       # React app entry point
│   └── index.css                    # CSS styling
├── .gitignore
├── package.json
├── README.md                         # Project overview and setup instructions
└── vite.config.js
```

</details>

<details>
<summary>
3. Data format
</summary>

### Data types used in the project
- **`Position`** : the current latitude, longitude and timestamp of the user.
- **`JoggingSession`** : Unique id(`index`), starting and ending time, total distance, total time, average speed.
- **`AppState`** : The current running state of the application - `isTracking`(currently running), isPaused, `JoggingSession`/null, start time and paused time. (Does not have stop time cause when it stops, it ends and goes into `SessionStatsProps`).
- **`SessionStatsProps`** : same as `AppState` except `JoggingSession` can't be null.(as the session has been completed).
- **`RouteCanvasProps`** : Tracking all the positions the user went through on the map as `Positions[]`, `currentPosition`/null(if the app hasn't been granted access to the location).

</details>