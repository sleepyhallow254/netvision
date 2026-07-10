# NetVision

NetVision is a local network dashboard that helps you monitor your machine and router from a single interface. It shows live host metrics such as uptime, memory usage, and network throughput, and it can open common router management pages for Wi-Fi settings, client lists, and access control.

## Features

- Live system monitoring for the current machine
- Real-time network throughput indicators
- Router gateway probing and status checks
- In-app router management shortcuts for common admin pages
- Saved router profile details for repeated use

## Project structure

- frontend: React + Vite dashboard UI
- backend: Express API that reads local system data and probes the router IP

## Prerequisites

- Node.js 18+
- npm

## Setup

1. Install frontend dependencies
   ```bash
   cd frontend
   npm install
   ```

2. Install backend dependencies
   ```bash
   cd ../backend
   npm install
   ```

## Run locally

Start the backend:
```bash
cd backend
node server.js
```

In a second terminal, start the frontend:
```bash
cd frontend
npm run dev -- --host 0.0.0.0
```

Then open:
- http://localhost:5175/ for the dashboard
- http://localhost:3001/api/status for the backend status endpoint

## Notes

- Router management pages may require your router's admin login credentials.
- Some routers block being embedded in an iframe, so the app may show the page guidance instead of the full embedded view.
- The app stores your router profile locally in the browser for convenience.
