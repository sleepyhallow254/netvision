import { useMemo, useState } from 'react'
import './App.css'

const initialUsers = [
  {
    id: 1,
    name: 'Ava Chen',
    device: 'MacBook Pro',
    location: 'North Wing',
    ip: '192.168.1.12',
    usageGb: 3.2,
    speedMbps: 184,
    status: 'Connected',
    lastSeen: '2 min ago',
  },
  {
    id: 2,
    name: 'Mateo Ruiz',
    device: 'iPhone 15',
    location: 'Lobby',
    ip: '192.168.1.27',
    usageGb: 1.8,
    speedMbps: 92,
    status: 'Connected',
    lastSeen: '5 min ago',
  },
  {
    id: 3,
    name: 'Jordan Lee',
    device: 'Surface Pro',
    location: 'South Wing',
    ip: '192.168.1.41',
    usageGb: 5.6,
    speedMbps: 210,
    status: 'Connected',
    lastSeen: '1 min ago',
  },
  {
    id: 4,
    name: 'Priya Shah',
    device: 'Windows Laptop',
    location: 'Studio',
    ip: '192.168.1.63',
    usageGb: 0,
    speedMbps: 0,
    status: 'Disconnected',
    lastSeen: '12 min ago',
  },
]

function formatUsage(gb) {
  return `${gb.toFixed(1)} GB`
}

function App() {
  const [users, setUsers] = useState(initialUsers)

  const connectedCount = users.filter((user) => user.status === 'Connected').length
  const totalUsage = useMemo(
    () => users.reduce((sum, user) => sum + user.usageGb, 0),
    [users],
  )
  const averageSpeed = useMemo(() => {
    const activeUsers = users.filter((user) => user.status === 'Connected')
    if (!activeUsers.length) {
      return 0
    }

    const total = activeUsers.reduce((sum, user) => sum + user.speedMbps, 0)
    return Math.round(total / activeUsers.length)
  }, [users])

  const disconnectUser = (id) => {
    setUsers((currentUsers) =>
      currentUsers.map((user) =>
        user.id === id
          ? {
              ...user,
              status: 'Disconnected',
              usageGb: 0,
              speedMbps: 0,
              lastSeen: 'just disconnected',
            }
          : user,
      ),
    )
  }

  return (
    <div className="dashboard-shell">
      <header className="hero-panel">
        <div>
          <p className="eyebrow">Network Operations Center</p>
          <h1>Monitor every connected client in one place.</h1>
          <p className="hero-copy">
            Keep traffic flowing smoothly with usage insights, live performance
            metrics, and one-click user disconnect controls.
          </p>
        </div>
        <div className="hero-badge">Live • 24/7</div>
      </header>

      <section className="stats-grid" aria-label="Dashboard summary">
        <article className="stat-card">
          <span>Connected users</span>
          <strong>{connectedCount}</strong>
          <small>Active devices</small>
        </article>
        <article className="stat-card">
          <span>Data usage</span>
          <strong>{formatUsage(totalUsage)}</strong>
          <small>Across the network</small>
        </article>
        <article className="stat-card">
          <span>Network speed</span>
          <strong>{averageSpeed} Mbps</strong>
          <small>Average throughput</small>
        </article>
        <article className="stat-card">
          <span>Uptime</span>
          <strong>99.98%</strong>
          <small>Service health</small>
        </article>
      </section>

      <section className="content-grid">
        <div className="panel panel-large">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Connected clients</p>
              <h2>Device overview</h2>
            </div>
            <span className="panel-pill">Live activity</span>
          </div>

          <div className="user-list">
            {users.map((user) => (
              <article className="user-card" key={user.id}>
                <div className="user-main">
                  <div>
                    <h3>{user.name}</h3>
                    <p>
                      {user.device} • {user.location}
                    </p>
                  </div>
                  <span className={`status-pill ${user.status.toLowerCase()}`}>
                    {user.status}
                  </span>
                </div>

                <div className="user-details">
                  <div>
                    <span>IP address</span>
                    <strong>{user.ip}</strong>
                  </div>
                  <div>
                    <span>Data usage</span>
                    <strong>{formatUsage(user.usageGb)}</strong>
                  </div>
                  <div>
                    <span>Speed</span>
                    <strong>{user.speedMbps} Mbps</strong>
                  </div>
                  <div>
                    <span>Last seen</span>
                    <strong>{user.lastSeen}</strong>
                  </div>
                </div>

                <div className="card-actions">
                  <button
                    type="button"
                    className="disconnect-btn"
                    onClick={() => disconnectUser(user.id)}
                    disabled={user.status !== 'Connected'}
                  >
                    Disconnect
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="side-stack">
          <div className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Throughput</p>
                <h2>Network speed</h2>
              </div>
            </div>

            <div className="meter-block">
              <div className="meter-row">
                <span>Download</span>
                <strong>184 Mbps</strong>
              </div>
              <div className="meter-bar">
                <div className="meter-fill download" style={{ width: '92%' }} />
              </div>

              <div className="meter-row">
                <span>Upload</span>
                <strong>88 Mbps</strong>
              </div>
              <div className="meter-bar">
                <div className="meter-fill upload" style={{ width: '74%' }} />
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Reliability</p>
                <h2>Uptime overview</h2>
              </div>
            </div>

            <ul className="uptime-list">
              <li>
                <span>Gateway</span>
                <strong>99.98%</strong>
              </li>
              <li>
                <span>Wi-Fi core</span>
                <strong>99.91%</strong>
              </li>
              <li>
                <span>Security service</span>
                <strong>100%</strong>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}

export default App
