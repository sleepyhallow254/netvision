# NetVision Deployment Guide

This guide covers deploying NetVision in various environments.

## Quick Start with Docker

### Prerequisites
- Docker and Docker Compose installed

### Deploy
```bash
docker-compose up -d
```

Access the application at:
- Backend API: `http://localhost:3001`
- Frontend UI: `http://localhost:5173` (during development)

### Stop
```bash
docker-compose down
```

### View Logs
```bash
docker-compose logs -f
```

## Linux Deployment (systemd)

### Prerequisites
- Node.js 18+ installed
- systemd available

### Backend Service

Create `/etc/systemd/system/netvision-backend.service`:

```ini
[Unit]
Description=NetVision Backend
After=network.target

[Service]
Type=simple
User=netvision
WorkingDirectory=/opt/netvision/backend
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10
Environment="NODE_ENV=production"
Environment="PORT=3001"
Environment="LOG_LEVEL=info"

[Install]
WantedBy=multi-user.target
```

### Frontend Service

Create `/etc/systemd/system/netvision-frontend.service`:

```ini
[Unit]
Description=NetVision Frontend
After=netvision-backend.service

[Service]
Type=simple
User=netvision
WorkingDirectory=/opt/netvision/frontend
ExecStart=/usr/bin/npm run preview
Restart=on-failure
RestartSec=10
Environment="VITE_API_BASE=http://localhost:3001"

[Install]
WantedBy=multi-user.target
```

### Enable and Start Services
```bash
sudo systemctl daemon-reload
sudo systemctl enable netvision-backend netvision-frontend
sudo systemctl start netvision-backend netvision-frontend
```

### Check Status
```bash
sudo systemctl status netvision-backend netvision-frontend
```

## Nginx Reverse Proxy Setup

### Backend Proxy
```nginx
server {
    listen 80;
    server_name api.netvision.local;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Frontend Proxy
```nginx
server {
    listen 80;
    server_name netvision.local;

    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Environment Variables

### Backend (.env)
```env
NODE_ENV=production
PORT=3001
CORS_ORIGIN=http://netvision.local
LOG_LEVEL=info
```

### Frontend (.env)
```env
VITE_API_BASE=http://api.netvision.local
VITE_NODE_ENV=production
```

## Health Monitoring

### Health Check Endpoint
```bash
curl http://localhost:3001/api/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-08-18T12:00:00.000Z",
  "uptime": 3600
}
```

### Docker Health Check
Docker Compose includes automatic health checks. Check status with:
```bash
docker-compose ps
```

## Performance Tuning

### Backend
- Set `LOG_LEVEL=warn` or `LOG_LEVEL=error` in production
- Increase `ROUTER_PROBE_TIMEOUT` if you have slow network
- Monitor memory usage with `ps aux | grep node`

### Frontend
- Built files are pre-minified by Vite
- Browser caches assets aggressively
- Use CDN for asset delivery in production

## Troubleshooting Deployment

### Backend won't start
```bash
# Check logs
journalctl -u netvision-backend -n 50

# Test port availability
netstat -tuln | grep 3001

# Try running manually
cd /opt/netvision/backend
npm start
```

### Frontend won't connect to backend
```bash
# Check CORS settings
curl -H "Origin: http://localhost:5173" http://localhost:3001/api/health

# Verify proxy configuration
curl -v http://localhost:3001/api/status
```

### High memory usage
- Reduce logging level to `error`
- Increase router probe timeout
- Check for memory leaks: `node --inspect server.js`

## Backup and Restore

### Router Profiles Backup
Router profiles are stored in browser localStorage. Export manually:
```javascript
// In browser console
JSON.stringify(localStorage.getItem('netvision-router-profile'))
```

### Configuration Backup
```bash
tar -czf netvision-backup.tar.gz \
  backend/.env \
  frontend/.env \
  backend/package-lock.json \
  frontend/package-lock.json
```

## Automatic Startup

### Using crontab (alternative to systemd)
```bash
# Start services at boot
@reboot /home/user/start-netvision.sh
```

Create `/home/user/start-netvision.sh`:
```bash
#!/bin/bash
cd /opt/netvision/backend && nohup npm start > /var/log/netvision-backend.log 2>&1 &
cd /opt/netvision/frontend && nohup npm run preview > /var/log/netvision-frontend.log 2>&1 &
```

## Security Considerations

1. **CORS**: Set `CORS_ORIGIN` to your specific domain in production
2. **Router Credentials**: Never expose in logs or environment variables
3. **Network Isolation**: Run on isolated networks when monitoring sensitive routers
4. **Updates**: Regularly update Node.js and npm packages
5. **SSL/TLS**: Use Nginx/Caddy for HTTPS in production

## Scaling

### Multiple Instances
- Run multiple backend instances behind load balancer
- Share frontend build across instances
- Each instance needs independent system metrics

### Load Balancer Configuration
```nginx
upstream netvision_backend {
    server localhost:3001;
    server localhost:3002;
    server localhost:3003;
}

server {
    listen 80;
    location /api {
        proxy_pass http://netvision_backend;
    }
}
```

## Monitoring

### Key Metrics
- Backend uptime (systemd status)
- Frontend build size (affects load times)
- API response times (check logs)
- System resource usage (CPU, memory)

### Log Monitoring
```bash
# Watch backend logs
tail -f /var/log/netvision-backend.log

# Monitor memory usage
while true; do ps aux | grep node | grep -v grep; sleep 5; done
```
