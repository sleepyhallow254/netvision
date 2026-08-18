import { useEffect, useState } from 'react'
import './App.css'

const API_BASE = import.meta.env.VITE_API_BASE || ''
const STORAGE_KEY = 'netvision-router-profile'

function App() {
  const [status, setStatus] = useState(null)
  const [routerIp, setRouterIp] = useState('192.168.1.1')
  const [routerResult, setRouterResult] = useState(null)
  const [routerModel, setRouterModel] = useState('')
  const [routerFirmware, setRouterFirmware] = useState('')
  const [routerUsername, setRouterUsername] = useState('')
  const [routerPassword, setRouterPassword] = useState('')
  const [ssid, setSsid] = useState('MyWiFi')
  const [password, setPassword] = useState('')
  const [maxClients, setMaxClients] = useState('20')
  const [embeddedUrl, setEmbeddedUrl] = useState('')
  const [embeddedLabel, setEmbeddedLabel] = useState('Router dashboard')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const loadStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/status`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Unable to fetch system status`)
      }
      const data = await response.json()
      setStatus(data)
      setError('')
    } catch (err) {
      console.error('Status fetch error:', err)
      setError(err.message || 'Unable to load system status')
      setStatus(null)
    }
  }

  const probeRouter = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE}/api/router`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routerIp }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: Router probe failed`)
      }

      const data = await response.json()
      setRouterResult(data)
      setEmbeddedUrl(data.openUrl)
      setEmbeddedLabel('Router gateway')
    } catch (err) {
      console.error('Router probe error:', err)
      setError(err.message || 'Router probe failed')
      setRouterResult(null)
    } finally {
      setLoading(false)
    }
  }

  const openManagementPage = (action) => {
    const base = `http://${routerIp}`
    const firmwareHints = {
      tplink: [
        `${base}/`,
        `${base}/userRpm/WlanNetworkRpm.htm`,
        `${base}/userRpm/WlanMacFilterRpm.htm`,
      ],
      tp_link: [
        `${base}/`,
        `${base}/userRpm/WlanNetworkRpm.htm`,
        `${base}/userRpm/WlanMacFilterRpm.htm`,
      ],
      asus: [
        `${base}/`,
        `${base}/Advanced_Wireless_Content.asp`,
        `${base}/Advanced_AccessControl_Content.asp`,
      ],
      netgear: [
        `${base}/`,
        `${base}/wireless.htm`,
        `${base}/attached_devices.asp`,
      ],
      dlink: [
        `${base}/`,
        `${base}/wireless.htm`,
        `${base}/tools_admin.htm`,
      ],
      default: [
        `${base}/`,
        `${base}/userRpm/WlanNetworkRpm.htm`,
        `${base}/wireless.htm`,
        `${base}/Advanced_Wireless_Content.asp`,
        `${base}/client-list.htm`,
      ],
    }

    const model = (routerModel || '').toLowerCase()
    const _firmware = (routerFirmware || '').toLowerCase()
    const candidates = {
      wireless: [
        ...(model.includes('tplink') || model.includes('tp-link') ? firmwareHints.tplink : []),
        ...(model.includes('asus') ? firmwareHints.asus : []),
        ...(model.includes('netgear') ? firmwareHints.netgear : []),
        ...(model.includes('dlink') ? firmwareHints.dlink : []),
        ...firmwareHints.default,
      ],
      security: [
        `${base}/userRpm/AdvancedSecurityRpm.htm`,
        `${base}/wireless-security.htm`,
        `${base}/Advanced_Wireless_Content.asp`,
        `${base}/`,
      ],
      clients: [
        `${base}/userRpm/WlanMacFilterRpm.htm`,
        `${base}/client-list.htm`,
        `${base}/attached_devices.asp`,
        `${base}/`,
      ],
      access: [
        `${base}/userRpm/WlanMacFilterRpm.htm`,
        `${base}/access-control.htm`,
        `${base}/Advanced_AccessControl_Content.asp`,
        `${base}/`,
      ],
    }

    const urls = Array.from(new Set(candidates[action] || candidates.wireless))
    const nextUrl = urls[0]
    setEmbeddedUrl(nextUrl)
    setEmbeddedLabel(action === 'wireless' ? 'Wireless settings' : action === 'security' ? 'Security settings' : action === 'clients' ? 'Client list' : 'Access control')
  }

  useEffect(() => {
    const storedProfile = window.localStorage.getItem(STORAGE_KEY)
    if (storedProfile) {
      try {
        const parsed = JSON.parse(storedProfile)
        setRouterIp(parsed.routerIp || '192.168.1.1')
        setRouterModel(parsed.routerModel || '')
        setRouterFirmware(parsed.routerFirmware || '')
        setRouterUsername(parsed.routerUsername || '')
        setRouterPassword(parsed.routerPassword || '')
        setSsid(parsed.ssid || 'MyWiFi')
        setPassword(parsed.password || '')
        setMaxClients(parsed.maxClients || '20')
      } catch (error) {
        console.error('Unable to restore saved router profile', error)
      }
    }

    loadStatus()
    const timer = window.setInterval(loadStatus, 5000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const profile = {
      routerIp,
      routerModel,
      routerFirmware,
      routerUsername,
      routerPassword,
      ssid,
      password,
      maxClients,
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
  }, [routerIp, routerModel, routerFirmware, routerUsername, routerPassword, ssid, password, maxClients])

  return (
    <div className="dashboard-shell">
      <header className="hero-panel">
        <div>
          <p className="eyebrow">Network Operations Center</p>
          <h1>Live router and host monitoring.</h1>
          <p className="hero-copy">
            Enter your router gateway address to open its admin page and inspect
            real time host metrics from this local dashboard.
          </p>
        </div>
        <div className="hero-badge">Live • real time</div>
      </header>

      <section className="stats-grid" aria-label="Dashboard summary">
        <article className="stat-card">
          <span>Host</span>
          <strong>{status?.hostname || 'Loading...'}</strong>
          <small>System name</small>
        </article>
        <article className="stat-card">
          <span>Uptime</span>
          <strong>{status?.uptime || '—'}</strong>
          <small>Current availability</small>
        </article>
        <article className="stat-card">
          <span>Throughput</span>
          <strong>{status?.throughput?.rxMbps ?? 0} / {status?.throughput?.txMbps ?? 0} Mbps</strong>
          <small>Live network traffic</small>
        </article>
        <article className="stat-card">
          <span>Memory</span>
          <strong>{status?.memory?.percent ?? 0}%</strong>
          <small>Used on this device</small>
        </article>
      </section>

      <section className="content-grid">
        <div className="panel panel-large">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Router access</p>
              <h2>Open your Wi-Fi gateway settings</h2>
            </div>
            <span className="panel-pill">Direct access</span>
          </div>

          <form className="router-form" onSubmit={probeRouter}>
            <label htmlFor="router-ip">Router IP address</label>
            <div className="router-input-row">
              <input
                id="router-ip"
                type="text"
                value={routerIp}
                onChange={(event) => setRouterIp(event.target.value)}
                placeholder="e.g. 192.168.1.1"
              />
              <button type="submit" disabled={loading}>
                {loading ? 'Checking...' : 'Open settings'}
              </button>
            </div>

            <div className="router-meta-grid">
              <input
                id="router-model"
                type="text"
                value={routerModel}
                onChange={(event) => setRouterModel(event.target.value)}
                placeholder="Router model (optional)"
              />
              <input
                id="router-firmware"
                type="text"
                value={routerFirmware}
                onChange={(event) => setRouterFirmware(event.target.value)}
                placeholder="Firmware version (optional)"
              />
              <input
                id="router-username"
                type="text"
                value={routerUsername}
                onChange={(event) => setRouterUsername(event.target.value)}
                placeholder="Admin username"
              />
              <input
                id="router-password"
                type="password"
                value={routerPassword}
                onChange={(event) => setRouterPassword(event.target.value)}
                placeholder="Admin password"
              />
            </div>
          </form>

          {error ? <p className="error-text">{error}</p> : null}

          {routerResult ? (
            <div className="router-result">
              <p>
                <strong>Status:</strong> {routerResult.reachable ? 'reachable' : 'unreachable'}
              </p>
              <p>
                <strong>Target:</strong> {routerResult.probe?.target || routerResult.openUrl}
              </p>
              <p>
                <strong>Response:</strong> {routerResult.probe?.snippet || 'No response body'}
              </p>
            </div>
          ) : null}

          <div className="router-notice">
            <p>
              Management pages open inside this dashboard when the router allows embedding.
              If your router blocks it, the app will still keep you on this page and show the relevant guidance.
            </p>
          </div>

          <div className="router-embed-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">In-app router view</p>
                <h3>{embeddedLabel}</h3>
              </div>
            </div>
            {embeddedUrl ? (
              <iframe
                className="router-frame"
                src={embeddedUrl}
                title={embeddedLabel}
                loading="lazy"
              />
            ) : (
              <p className="frame-placeholder">
                Choose a router action above to load the management page here.
              </p>
            )}
          </div>

          <div className="management-panel">
            <div className="management-header">
              <h3>Router management shortcuts</h3>
              <p>
                These buttons open the common router admin pages where SSID,
                password, client limits, and device disconnect options are usually managed.
              </p>
            </div>

            <div className="management-grid">
              <div className="management-card">
                <label htmlFor="ssid">Wi-Fi name</label>
                <input
                  id="ssid"
                  value={ssid}
                  onChange={(event) => setSsid(event.target.value)}
                  placeholder="Network name"
                />
                <label htmlFor="password">Wi-Fi password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="New password"
                />
                <button type="button" onClick={() => openManagementPage('wireless')}>
                  Open wireless settings
                </button>
              </div>

              <div className="management-card">
                <label htmlFor="max-clients">Max connected users</label>
                <input
                  id="max-clients"
                  type="number"
                  min="1"
                  max="100"
                  value={maxClients}
                  onChange={(event) => setMaxClients(event.target.value)}
                />
                <button type="button" onClick={() => openManagementPage('access')}>
                  Open access control
                </button>
              </div>

              <div className="management-card">
                <h4>Disconnect devices</h4>
                <p>Use the router’s client list page to remove a device from the network.</p>
                <button type="button" onClick={() => openManagementPage('clients')}>
                  Open client list
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="side-stack">
          <div className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">System details</p>
                <h2>Host metrics</h2>
              </div>
            </div>

            <ul className="uptime-list">
              <li>
                <span>Load avg</span>
                <strong>{status?.loadAverage || '—'}</strong>
              </li>
              <li>
                <span>Memory used</span>
                <strong>{status?.memory?.used || '—'}</strong>
              </li>
              <li>
                <span>Last update</span>
                <strong>{status?.timestamp || '—'}</strong>
              </li>
            </ul>
          </div>

          <div className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">LAN clients</p>
                <h2>Connected devices</h2>
              </div>
            </div>

            <ul className="uptime-list">
              {(status?.clients || []).slice(0, 6).map((client) => (
                <li key={`${client.ip}-${client.mac}`}>
                  <span>{client.ip}</span>
                  <strong>{client.device}</strong>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}

export default App
