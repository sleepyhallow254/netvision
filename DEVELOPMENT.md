# NetVision Development Guide

This guide covers developing and contributing to NetVision.

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Git
- Text editor or IDE (VS Code recommended)

## Project Structure

```
netvision/
├── backend/
│   ├── server.js           # Main backend server
│   ├── package.json        # Backend dependencies
│   ├── .env.example        # Example configuration
│   ├── eslint.config.js    # Linting configuration
│   └── Dockerfile          # Container configuration
├── frontend/
│   ├── src/
│   │   ├── main.jsx        # React entry point
│   │   ├── App.jsx         # Main app component
│   │   ├── App.css         # Styling
│   │   ├── index.css       # Global styles
│   │   ├── ErrorBoundary.jsx  # Error handling
│   │   └── assets/         # Images and assets
│   ├── public/             # Static files
│   ├── index.html          # HTML template
│   ├── package.json        # Frontend dependencies
│   ├── vite.config.js      # Vite configuration
│   ├── .oxlintrc.json      # Linting configuration
│   └── Dockerfile          # Container configuration
├── docker-compose.yml      # Docker orchestration
├── README.md               # Project overview
├── DEPLOYMENT.md           # Deployment guide
└── DEVELOPMENT.md          # This file
```

## Development Setup

### 1. Clone and Install

```bash
git clone <repository>
cd netvision

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Create Environment Files

**Backend (.env):**
```bash
cd ../backend
cp .env.example .env
# Edit .env if needed
```

**Frontend (.env):**
```bash
cd ../frontend
cp .env.example .env
# Edit .env if needed (optional)
```

### 3. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Server runs on http://localhost:3001
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Dashboard runs on http://localhost:5173
```

## Development Workflow

### Frontend Development

#### Running Dev Server
```bash
cd frontend
npm run dev
```

The frontend has hot module replacement (HMR) enabled. Changes are reflected immediately.

#### Building Production Bundle
```bash
npm run build
# Output: dist/
```

#### Linting
```bash
npm run lint
# Runs oxlint to check code quality
```

#### Previewing Production Build
```bash
npm run preview
# Serves the production build locally
```

### Backend Development

#### Running Dev Server with Auto-Reload
```bash
cd backend
npm run dev
# Uses nodemon to auto-reload on file changes
```

#### Running Production Server
```bash
npm start
# Direct node execution
```

#### Linting
```bash
npm run lint
# Runs eslint to check code quality
```

#### Debug Mode
```bash
node --inspect server.js
# Open chrome://inspect in Chrome to debug
```

## API Endpoints

### GET /api/status
Returns current system metrics.

**Response:**
```json
{
  "hostname": "my-computer",
  "uptime": "5d 12h 30m",
  "loadAverage": "2.5",
  "memory": {
    "total": "15.6 GB",
    "used": "8.2 GB",
    "percent": 53
  },
  "throughput": {
    "rxMbps": 12.5,
    "txMbps": 8.3
  },
  "interfaces": [
    {
      "name": "eth0",
      "address": "192.168.1.100",
      "mac": "00:11:22:33:44:55"
    }
  ],
  "clients": [
    {
      "ip": "192.168.1.50",
      "mac": "aa:bb:cc:dd:ee:ff",
      "device": "Samsung-Phone"
    }
  ],
  "timestamp": "2024-08-18 12:30:45"
}
```

### POST /api/router
Probes router connectivity.

**Request:**
```json
{
  "routerIp": "192.168.1.1"
}
```

**Response:**
```json
{
  "routerIp": "192.168.1.1",
  "reachable": true,
  "ping": true,
  "probe": {
    "reachable": true,
    "target": "http://192.168.1.1",
    "status": 200,
    "snippet": "TP-Link Router Admin Panel..."
  },
  "openUrl": "http://192.168.1.1"
}
```

### GET /api/health
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-08-18T12:30:45.000Z",
  "uptime": 3600
}
```

## Code Style

### JavaScript/JSX
- Use ES6+ features
- Use const/let, avoid var
- Use functional components in React
- Keep components small and focused

### CSS
- Use CSS Grid and Flexbox for layouts
- Use CSS variables for consistent theming
- Mobile-first responsive design
- BEM-like naming for complex components

### ESLint Rules
Run `npm run lint` to check code quality:

**Frontend:**
- React hooks rules enforced
- Only export components recommended
- Oxlint checks for common errors

**Backend:**
- No unused variables
- Prefer const
- No empty functions
- Console statements warned (but allowed)

## Testing

### Manual Testing Checklist

- [ ] Frontend loads without errors
- [ ] System status updates every 5 seconds
- [ ] Router IP input accepts valid format
- [ ] Router probe completes successfully
- [ ] Router profiles save and load
- [ ] Management shortcuts open correct pages
- [ ] Client list displays connected devices
- [ ] Memory and CPU stats display correctly
- [ ] Network throughput shows live data
- [ ] Error messages display properly
- [ ] Responsive design works on mobile
- [ ] Dark/light mode works (if implemented)

### Running Tests
Currently no automated tests. To add tests:

```bash
# Frontend - add vitest
npm install --save-dev vitest @testing-library/react

# Backend - add jest
npm install --save-dev jest
```

## Adding Features

### Adding a New API Endpoint

1. Add endpoint handler in `backend/server.js`:
```javascript
app.get('/api/new-endpoint', (req, res) => {
  try {
    const data = getNewData()
    res.json(data)
  } catch (error) {
    log(`Error: ${error.message}`, 'error')
    res.status(500).json({ error: 'Failed to fetch data' })
  }
})
```

2. Call from frontend component:
```javascript
const [data, setData] = useState(null)

useEffect(() => {
  fetch('/api/new-endpoint')
    .then(r => r.json())
    .then(setData)
    .catch(err => console.error(err))
}, [])
```

### Adding a New React Component

1. Create component file:
```javascript
// src/components/MyComponent.jsx
export default function MyComponent() {
  return <div>My Component</div>
}
```

2. Import and use in App.jsx:
```javascript
import MyComponent from './components/MyComponent'

// In JSX:
<MyComponent />
```

### Adding Styling

1. Add to `App.css` or create component-specific CSS
2. Use consistent color scheme (defined in index.css)
3. Ensure responsive design with media queries

## Debugging

### Frontend Debugging
```bash
# Check browser console (F12)
# Check React DevTools extension
# Use browser debugger
```

### Backend Debugging
```bash
# Check terminal output
node --inspect server.js
# Open chrome://inspect in Chrome
```

### Common Issues

#### Frontend won't load
- Check backend is running on port 3001
- Check CORS settings
- Check browser console for errors

#### API calls fail
- Verify endpoint URL is correct
- Check network tab in browser
- Check backend logs

#### Router probe fails
- Ensure router IP is correct
- Check if router is reachable (ping)
- Some routers block HTTP access

## Performance Tips

### Frontend
- Use React.memo for expensive components
- Lazy load components with React.lazy
- Optimize images (use webp when possible)
- Bundle analysis: `npm run preview`

### Backend
- Cache system snapshots if needed
- Optimize /proc filesystem reads
- Consider rate limiting API endpoints
- Monitor memory usage

## Git Workflow

### Branch Naming
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation
- `refactor/description` - Code refactoring

### Commit Messages
```
[type]: Brief description

- Detailed explanation if needed
- Reference issues/PRs if applicable
```

Types: feat, fix, docs, style, refactor, test, chore

### Pull Request Process
1. Create feature branch
2. Make changes and commit
3. Push to fork
4. Create PR with clear description
5. Address review comments
6. Squash commits if needed
7. Merge when approved

## Resources

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Express.js Guide](https://expressjs.com)
- [Node.js API](https://nodejs.org/api)
- [CSS Tricks](https://css-tricks.com)

## Getting Help

- Check existing issues and discussions
- Ask in project issues
- Review code comments and docs
- Refer to deployment guide for setup issues
