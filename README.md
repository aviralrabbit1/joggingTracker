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
