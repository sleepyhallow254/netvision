import { useEffect, useState } from 'react'
import './App.css'

const API_BASE = 'http://localhost:3001'

function App() {
  const [status, setStatus] = useState(null)
  const [routerIp, setRouterIp] = useState('192.168.1.1')
  const [routerResult, setRouterResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const loadStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/status`)
      if (!response.ok) {
        throw new Error('Unable to fetch system status')
      }
      const data = await response.json()
      setStatus(data)
      setError('')
    } catch (err) {
      setError(err.message)
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
        throw new Error('Router probe failed')
      }

      const data = await response.json()
      setRouterResult(data)
      window.open(data.openUrl, '_blank', 'noopener,noreferrer')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStatus()
    const timer = window.setInterval(loadStatus, 5000)
    return () => window.clearInterval(timer)
  }, [])

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
