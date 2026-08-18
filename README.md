# NetVision

NetVision is a local network dashboard that helps you monitor your machine and router from a single interface. It shows live host metrics such as uptime, memory usage, and network throughput, and it can open common router management pages for Wi-Fi settings, client lists, and access control.

## Features

- **Live system monitoring** for the current machine
- **Real-time network throughput indicators** showing RX/TX speeds
- **Router gateway probing and status checks** for connectivity verification
- **In-app router management shortcuts** for common admin pages (Wireless, Security, Client List, Access Control)
- **Saved router profile details** for repeated use with browser localStorage
- **Multi-router support** with firmware detection (TP-Link, ASUS, Netgear, D-Link, and more)
- **LAN client discovery** using ARP tables
- **System metrics** including CPU load, memory usage, and uptime

## Project structure

```
netvision/
├── backend/          # Express API server that reads system data and probes the router
│   ├── server.js     # Main server file with all API endpoints
│   ├── package.json  # Backend dependencies
│   ├── .env.example  # Example environment variables
│   └── Dockerfile    # Docker image for backend
├── frontend/         # React + Vite dashboard UI
│   ├── src/          # React components and styling
│   ├── package.json  # Frontend dependencies
│   ├── vite.config.js
│   ├── .env.example  # Example environment variables
│   └── Dockerfile    # Docker image for frontend
└── docker-compose.yml # Docker Compose configuration
```

## Prerequisites

- Node.js 18+ (or Docker/Docker Compose for containerized deployment)
- npm or yarn
- Linux/macOS (Windows support requires WSL2)

## Setup

### Option 1: Local Development

#### 1. Install frontend dependencies
```bash
cd frontend
npm install
```

#### 2. Install backend dependencies
```bash
cd ../backend
npm install
```

#### 3. Configure environment variables (optional)
```bash
# Backend
cd backend
cp .env.example .env
# Edit .env if needed (defaults work for most cases)

# Frontend (if needed)
cd ../frontend
cp .env.example .env
```

### Option 2: Docker Deployment

```bash
docker-compose up -d
```

This will:
- Build both backend and frontend services
- Start the backend on port 3001
- Start the frontend on port 5173
- Automatically restart services if they crash

## Run locally

### Without Docker:

**Terminal 1 - Start the backend:**
```bash
cd backend
npm start
# or for development with auto-reload:
npm run dev
```

**Terminal 2 - Start the frontend:**
```bash
cd frontend
npm run dev -- --host 0.0.0.0
```

The dashboard will be available at `http://localhost:5173`

### With Docker:

```bash
docker-compose up
```

Access the dashboard at `http://localhost:3001` (both services are behind the backend)

## API Endpoints

### Backend API

#### System Status
- **GET** `/api/status` - Returns current system metrics
  - Response: `{ hostname, uptime, loadAverage, memory, throughput, interfaces, clients, timestamp }`

#### Router Probe
- **POST** `/api/router` - Probes router connectivity
  - Request: `{ routerIp: "192.168.1.1" }`
  - Response: `{ routerIp, reachable, ping, probe, openUrl }`

#### Health Check
- **GET** `/api/health` - Health check endpoint
  - Response: `{ status: "ok", timestamp, uptime }`

## Configuration

### Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Frontend Build Path (relative to backend directory)
FRONTEND_BUILD_PATH=../frontend/dist

# Router Probing Configuration
ROUTER_PROBE_TIMEOUT=3000
ROUTER_PING_TIMEOUT=2500

# CORS Configuration
CORS_ORIGIN=*

# Logging
LOG_LEVEL=info
```

### Frontend Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
# API Base URL for backend communication
VITE_API_BASE=

# Environment
VITE_NODE_ENV=development
```

## Supported Router Models

NetVision includes built-in support for common router models:
- **TP-Link** - Uses proprietary admin interface
- **ASUS** - Uses Advanced Wireless Content pages
- **Netgear** - Uses wireless.htm and attached_devices.asp
- **D-Link** - Uses wireless.htm
- **Generic** - Falls back to standard URLs

Custom router management pages can be added via the firmware/model input fields.

## Browser Storage

Router profiles are saved in browser localStorage under the key `netvision-router-profile`. This includes:
- Router IP address
- Router model and firmware version
- Admin credentials (stored locally only)
- Wi-Fi SSID and password
- Max connected clients limit

**Note:** Credentials are only stored in your browser's localStorage and never sent to any external server.

## Performance Notes

- System status updates every 5 seconds (configurable)
- Router probing uses parallel HTTP/HTTPS attempts with 3-second timeout
- Network throughput calculated from `/proc/net/dev` on Linux
- ARP client discovery from `/proc/net/arp` on Linux
- Memory and CPU metrics from Node.js `os` module

## Troubleshooting

### "Frontend build not found"
```bash
cd frontend
npm run build
```

### Backend not connecting to frontend
- Check that backend is running on port 3001
- Verify `CORS_ORIGIN` environment variable is set correctly
- Check browser console for specific API errors

### Router not probing successfully
- Ensure router IP is correct and reachable from your machine
- Try both HTTP and HTTPS (backend tests both)
- Some routers block direct probing - check router firewall settings
- Verify router is on the same network segment

### Linux-specific issues
- Ensure you have `ping` utility installed
- `/proc/net/dev` and `/proc/net/arp` must be readable
- On some systems, you may need to run with elevated privileges for full ARP data

## Development

### Frontend Build
```bash
cd frontend
npm run build  # Production build to dist/
npm run preview  # Preview production build
npm run lint   # Run oxlint
```

### Backend Scripts
```bash
cd backend
npm start      # Start production server
npm run dev    # Start with auto-reload (requires nodemon)
npm test       # Run tests (if configured)
```

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

Then open:
- http://localhost:5175/ for the dashboard
- http://localhost:3001/api/status for the backend status endpoint

## Notes

- Router management pages may require your router's admin login credentials.
- Some routers block being embedded in an iframe, so the app may show the page guidance instead of the full embedded view.
- The app stores your router profile locally in the browser for convenience.
