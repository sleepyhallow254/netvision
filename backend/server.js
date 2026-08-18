const express = require('express')
const cors = require('cors')
const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')
const { execFile } = require('node:child_process')
require('dotenv').config()

const app = express()
const port = process.env.PORT || 3001
const nodeEnv = process.env.NODE_ENV || 'development'
const corsOrigin = process.env.CORS_ORIGIN || '*'
const logLevel = process.env.LOG_LEVEL || 'info'

// Utility logging function
function log(message, level = 'info') {
  const levels = { error: 0, warn: 1, info: 2, debug: 3 }
  const currentLevel = levels[logLevel] ?? 2
  const msgLevel = levels[level] ?? 2
  if (msgLevel <= currentLevel) {
    // eslint-disable-next-line no-console
    console.log(`[${level.toUpperCase()}] ${new Date().toISOString()} - ${message}`)
  }
}

app.use(cors({ origin: corsOrigin }))
app.use(express.json())
app.use((req, res, next) => {
  log(`${req.method} ${req.path}`, 'debug')
  next()
})

const frontendBuildPath = path.join(__dirname, '..', 'frontend', 'dist')
const indexPath = path.join(frontendBuildPath, 'index.html')

if (fs.existsSync(frontendBuildPath)) {
  app.use(express.static(frontendBuildPath))
}

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next()
  }

  const cleanPath = req.path === '/' ? '' : req.path.replace(/^\/+/, '')
  const candidatePath = path.join(frontendBuildPath, cleanPath)

  if (fs.existsSync(candidatePath) && path.extname(cleanPath)) {
    return res.sendFile(candidatePath)
  }

  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath)
  }

  return res.status(404).send('Frontend build not found. Run the frontend build first.')
})

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  return `${days}d ${hours}h ${mins}m`
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`
}

function readProcNetDev() {
  const procPath = '/proc/net/dev'
  if (!fs.existsSync(procPath)) {
    return []
  }

  return fs
    .readFileSync(procPath, 'utf8')
    .trim()
    .split('\n')
    .slice(2)
    .map((line) => line.trim())
    .filter(Boolean)
}

function getInterfaceStats() {
  const raw = readProcNetDev()
  const interfaces = []

  raw.forEach((line) => {
    const [name, ...values] = line.split(/:\s+/)
    // Parse /proc/net/dev format: rx_bytes rx_packets rx_errs rx_drop ... tx_bytes tx_packets tx_errs tx_drop ...
    const [rxBytes, , , , , , , , txBytes] = values[0].split(/\s+/)

    if (!name || name.startsWith('lo')) {
      return
    }

    interfaces.push({
      name,
      rxBytes: Number(rxBytes) || 0,
      txBytes: Number(txBytes) || 0,
    })
  })

  return interfaces
}

let lastSnapshot = null
let lastTimestamp = Date.now()

function collectSystemSnapshot() {
  const interfaces = getInterfaceStats()
  const now = Date.now()
  const elapsedSeconds = Math.max((now - lastTimestamp) / 1000, 1)
  const totalRxBytes = interfaces.reduce((sum, item) => sum + item.rxBytes, 0)
  const totalTxBytes = interfaces.reduce((sum, item) => sum + item.txBytes, 0)

  const previous = lastSnapshot
  let rxMbps = 0
  let txMbps = 0

  if (previous) {
    rxMbps = (((totalRxBytes - previous.totalRxBytes) / elapsedSeconds) * 8) / (1024 * 1024)
    txMbps = (((totalTxBytes - previous.totalTxBytes) / elapsedSeconds) * 8) / (1024 * 1024)
  }

  const networkInterfaces = os.networkInterfaces()
  const ipv4Addresses = Object.entries(networkInterfaces)
    .flatMap(([name, details]) =>
      (details || [])
        .filter((detail) => detail.family === 'IPv4' && !detail.internal)
        .map((detail) => ({ name, address: detail.address, mac: detail.mac })),
    )

  const memoryTotal = os.totalmem()
  const memoryFree = os.freemem()
  const memoryUsed = memoryTotal - memoryFree

  const snapshot = {
    hostname: os.hostname(),
    uptime: formatUptime(os.uptime()),
    loadAverage: os.loadavg()[0].toFixed(2),
    memory: {
      total: formatBytes(memoryTotal),
      used: formatBytes(memoryUsed),
      percent: Math.round((memoryUsed / memoryTotal) * 100),
    },
    throughput: {
      rxMbps: Number(rxMbps.toFixed(2)),
      txMbps: Number(txMbps.toFixed(2)),
    },
    interfaces: ipv4Addresses,
    clients: getArpClients(),
    timestamp: new Date().toLocaleTimeString(),
  }

  lastSnapshot = {
    totalRxBytes,
    totalTxBytes,
  }
  lastTimestamp = now

  return snapshot
}

function getArpClients() {
  const arpPath = '/proc/net/arp'
  if (!fs.existsSync(arpPath)) {
    return []
  }

  const lines = fs.readFileSync(arpPath, 'utf8').trim().split('\n').slice(1)
  return lines
    .filter(Boolean)
    .map((line) => line.trim().split(/\s+/))
    .filter((parts) => parts[0] && parts[0] !== 'IP')
    .map(([ip, hwType, flags, mac, mask, device]) => ({
      ip,
      mac,
      device: device || 'unknown',
    }))
}

function pingHost(host) {
  return new Promise((resolve) => {
    execFile('ping', ['-c', '1', '-W', '1', host], { timeout: 2500 }, (error) => {
      resolve(!error)
    })
  })
}

async function probeRouter(routerIp) {
  const targets = [`http://${routerIp}`, `https://${routerIp}`]

  for (const target of targets) {
    try {
      const response = await fetch(target, { redirect: 'manual', signal: AbortSignal.timeout(3000) })
      const body = await response.text()
      const snippet = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 180)
      return {
        reachable: true,
        target,
        status: response.status,
        snippet,
      }
    } catch (error) {
      log(`Probe failed for ${target}: ${error.message}`, 'debug')
      // continue to next target
    }
  }

  return {
    reachable: false,
    target: `http://${routerIp}`,
    snippet: 'Router did not respond to a direct request.',
  }
}

app.get('/api/status', (req, res) => {
  try {
    const snapshot = collectSystemSnapshot()
    res.json(snapshot)
  } catch (error) {
    log(`Error collecting system snapshot: ${error.message}`, 'error')
    res.status(500).json({
      error: 'Failed to collect system status',
      message: nodeEnv === 'development' ? error.message : 'Internal server error',
    })
  }
})

app.get(/^\/(?!api).*/, (req, res) => {
  const indexPath = path.join(frontendBuildPath, 'index.html')
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath)
    return
  }

  res.status(404).send('Frontend build not found. Run the frontend build first.')
})

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

// 404 handler
app.use((req, res) => {
  log(`404 Not Found: ${req.method} ${req.path}`, 'warn')
  res.status(404).json({ error: 'Not found' })
})

// Error handling middleware
app.use((err, req, res, next) => {
  log(`Unhandled error: ${err.message}`, 'error')
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(nodeEnv === 'development' && { stack: err.stack }),
  })
})

app.post('/api/router', async (req, res) => {
  try {
    const routerIp = req.body?.routerIp?.trim()

    if (!routerIp) {
      return res.status(400).json({ error: 'Please provide a router IP address.' })
    }

    // Validate IP format (basic check)
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/
    if (!ipRegex.test(routerIp)) {
      return res.status(400).json({ error: 'Invalid IP address format.' })
    }

    const [reachable, probe] = await Promise.all([pingHost(routerIp), probeRouter(routerIp)])

    res.json({
      routerIp,
      reachable: reachable || probe.reachable,
      ping: reachable,
      probe,
      openUrl: `http://${routerIp}`,
    })
  } catch (error) {
    log(`Error probing router: ${error.message}`, 'error')
    res.status(500).json({
      error: 'Failed to probe router',
      message: nodeEnv === 'development' ? error.message : 'Internal server error',
    })
  }
})

app.listen(port, () => {
  log(`Backend listening on http://localhost:${port}`, 'info')
  log(`Environment: ${nodeEnv}`, 'info')
  log(`CORS Origin: ${corsOrigin}`, 'debug')
})
