const express = require('express')
const cors = require('cors')
const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')
const { execFile } = require('node:child_process')

const app = express()
const port = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

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
    const [rxBytes, rxPackets, rxErrs, rxDrop, rxFifo, rxFrame, rxCompressed, rxMulticast, txBytes, txPackets, txErrs, txDrop, txFifo, txFrame, txCompressed, txMulticast] = values[0].split(/\s+/)

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
  res.json(collectSystemSnapshot())
})

app.get(/^\/(?!api).*/, (req, res) => {
  const indexPath = path.join(frontendBuildPath, 'index.html')
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath)
    return
  }

  res.status(404).send('Frontend build not found. Run the frontend build first.')
})

app.post('/api/router', async (req, res) => {
  const routerIp = req.body?.routerIp?.trim()

  if (!routerIp) {
    return res.status(400).json({ error: 'Please provide a router IP address.' })
  }

  const [reachable, probe] = await Promise.all([pingHost(routerIp), probeRouter(routerIp)])

  res.json({
    routerIp,
    reachable: reachable || probe.reachable,
    ping: reachable,
    probe,
    openUrl: `http://${routerIp}`,
  })
})

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`)
})
