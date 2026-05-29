import { useEffect, useMemo, useState } from 'react';
import {
  Server, Tv, Shield, RefreshCcw, Ban, Search, CheckCircle,
  XCircle, Database, Trash2, Unlock, Clock3, DollarSign,
  Menu, Wifi, ListVideo, Bell, User, Download, Filter, Activity,
  CreditCard, Settings, LogOut
} from 'lucide-react';

import './App.css';

const API = 'https://tx-hotplayer-api.onrender.com';
const ONLINE_MINUTES = 5;

function isOnline(lastSeen) {
  if (!lastSeen) return false;
  const lastSeenTime = new Date(lastSeen).getTime();
  if (Number.isNaN(lastSeenTime)) return false;
  return (Date.now() - lastSeenTime) / 60000 < ONLINE_MINUTES;
}

function formatLastSeen(lastSeen) {
  if (!lastSeen) return '-';
  const lastSeenTime = new Date(lastSeen);
  if (Number.isNaN(lastSeenTime.getTime())) return '-';
  return lastSeenTime.toLocaleString();
}

export default function App() {
  const [devices, setDevices] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [requests, setRequests] = useState([]);
  const [mac, setMac] = useState('');
  const [expireAt, setExpireAt] = useState('2026-12-31');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadDevices() {
    try {
      setLoading(true);
      const res = await fetch(`${API}/devices`);
      const data = await res.json();
      setDevices(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  async function loadPlaylists() {
    const res = await fetch(`${API}/playlists`);
    const data = await res.json();
    setPlaylists(Array.isArray(data) ? data : []);
  }

  async function loadRequests() {
    const res = await fetch(`${API}/activation-requests`);
    const data = await res.json();
    setRequests(Array.isArray(data) ? data : []);
  }

  async function refreshAll() {
    await Promise.all([loadDevices(), loadPlaylists(), loadRequests()]);
  }

  async function activateDevice(e) {
    e.preventDefault();
    await fetch(`${API}/devices/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mac, expire_at: expireAt })
    });
    setMac('');
    await refreshAll();
  }

  async function blockDevice(deviceMac) {
    await fetch(`${API}/devices/block`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mac: deviceMac })
    });
    await refreshAll();
  }

  async function unblockDevice(deviceMac) {
    await fetch(`${API}/devices/unblock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mac: deviceMac })
    });
    await refreshAll();
  }

  async function deleteDevice(deviceMac) {
    const ok = window.confirm(`Delete device ${deviceMac}?`);
    if (!ok) return;
    await fetch(`${API}/devices/${encodeURIComponent(deviceMac)}`, { method: 'DELETE' });
    await refreshAll();
  }

  async function assignPlaylist(deviceMac, playlistId) {
    if (!playlistId) return;
    await fetch(`${API}/devices/assign-playlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mac: deviceMac, playlist_id: Number(playlistId) })
    });
    await refreshAll();
  }

  useEffect(() => { refreshAll(); }, []);

  const stats = useMemo(() => {
    const approved = requests.filter(r => r.status === 'approved');
    const revenue = approved.reduce((sum, r) => {
      const value = Number(String(r.price || '0').replace('$', ''));
      return sum + (Number.isNaN(value) ? 0 : value);
    }, 0);

    return {
      total: devices.length,
      active: devices.filter(d => d.active && !d.blocked).length,
      blocked: devices.filter(d => d.blocked).length,
      withPlaylist: devices.filter(d => d.playlist_id).length,
      paidActivations: approved.length,
      online: devices.filter(d => isOnline(d.last_seen)).length,
      revenue: revenue.toFixed(2)
    };
  }, [devices, requests]);

  const filteredDevices = devices.filter(d =>
    String(d.mac || '').toLowerCase().includes(query.toLowerCase())
  );

  const recentPayments = requests.filter(r => r.status === 'approved').slice(0, 10);

  const statCards = [
    { label: 'Total Devices', value: stats.total, note: 'All registered devices', icon: Tv, color: 'blue' },
    { label: 'Active Devices', value: stats.active, note: 'Currently active', icon: CheckCircle, color: 'green' },
    { label: 'Online Devices', value: stats.online, note: 'Last 5 minutes', icon: Wifi, color: 'orange' },
    { label: 'Blocked Devices', value: stats.blocked, note: 'Blocked access', icon: XCircle, color: 'red' },
    { label: 'Revenue', value: `$${stats.revenue}`, note: 'Total paid', icon: DollarSign, color: 'blue' }
  ];

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon"><Shield size={28} /></div>
          <div><strong>TX HOTPLAYER</strong><span>Admin</span></div>
        </div>

        <nav className="nav-menu">
          <a className="active"><Tv size={18} /> Dashboard</a>
          <a><Server size={18} /> Devices</a>
          <a><ListVideo size={18} /> Playlists</a>
          <a><CreditCard size={18} /> Payments</a>
          <a><Activity size={18} /> Activations</a>
          <a><Settings size={18} /> Settings</a>
        </nav>

        <div className="revenue-box">
          <span>Total Revenue</span>
          <strong>${stats.revenue}</strong>
          <small>This Month</small>
        </div>

        <button className="logout-btn"><LogOut size={17} /> Log Out</button>
      </aside>

      <main className="main-content">
        <header className="dashboard-header">
          <div className="title-row">
            <button className="icon-button"><Menu size={22} /></button>
            <div>
              <h1>Dashboard</h1>
              <p>Welcome back! Here's what's happening with your service.</p>
            </div>
          </div>

          <div className="header-actions">
            <div className="search-box">
              <Search size={18} />
              <input placeholder="Search MAC address..." value={query} onChange={e => setQuery(e.target.value)} />
            </div>
            <Bell className="bell" size={20} />
            <div className="admin-chip"><User size={16} /> Admin</div>
            <button className="refresh-btn" onClick={refreshAll}><RefreshCcw size={16} /> Refresh Data</button>
          </div>
        </header>

        <section className="stats-grid">
          {statCards.map(({ label, value, note, icon: Icon, color }) => (
            <div className="stat-card" key={label}>
              <div className={`stat-icon ${color}`}><Icon size={25} /></div>
              <div><span>{label}</span><b>{value}</b><small>{note}</small></div>
            </div>
          ))}
        </section>

        <section className="top-grid">
          <div className="panel activate-panel">
            <h2><Server size={19} /> Activate New Device</h2>
            <form onSubmit={activateDevice}>
              <input placeholder="MAC Address (e.g. TX:75:C8:87:CB)" value={mac} onChange={e => setMac(e.target.value)} />
              <input type="date" value={expireAt} onChange={e => setExpireAt(e.target.value)} />
              <button><Server size={17} /> Activate Device</button>
            </form>
          </div>

          <div className="panel overview-panel">
            <h2><Activity size={19} /> Quick Overview</h2>
            <div className="overview-grid">
              <div><Database size={22} /><span>Playlists Loaded</span><b>{playlists.length}</b></div>
              <div><DollarSign size={22} /><span>Paid Activations</span><b>{stats.paidActivations}</b></div>
              <div><Tv size={22} /><span>Total Devices</span><b>{stats.total}</b></div>
              <div><Wifi size={22} /><span>Online Devices</span><b>{stats.online}</b></div>
            </div>
          </div>
        </section>

        <section className="panel table-panel">
          <div className="panel-toolbar">
            <h2><Tv size={19} /> Devices {loading ? '...' : `(${filteredDevices.length})`}</h2>
            <div className="toolbar-actions">
              <div className="mini-search"><Search size={16} /><input placeholder="Search by MAC..." value={query} onChange={e => setQuery(e.target.value)} /></div>
              <button className="light-btn"><Filter size={16} /> Filter</button>
              <button className="blue-btn"><Download size={16} /> Export</button>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead><tr><th>MAC Address</th><th>Status</th><th>Expires</th><th>Playlist</th><th>Online</th><th>Last Seen</th><th>Actions</th></tr></thead>
              <tbody>
                {filteredDevices.map(device => (
                  <tr key={device.id || device.mac}>
                    <td><strong>{device.mac}</strong></td>
                    <td><span className={device.blocked ? 'badge red' : device.active ? 'badge green' : 'badge orange'}>{device.blocked ? 'Blocked' : device.active ? 'Active' : 'Inactive'}</span></td>
                    <td>{device.expire_at?.slice(0, 10) || '-'}</td>
                    <td>
                      <select value={device.playlist_id || ''} onChange={e => assignPlaylist(device.mac, e.target.value)}>
                        <option value="">No Playlist</option>
                        {playlists.map(playlist => <option key={playlist.id} value={playlist.id}>#{playlist.id} - {playlist.name.slice(0, 14)}</option>)}
                      </select>
                    </td>
                    <td><span className={isOnline(device.last_seen) ? 'online-dot' : 'offline-dot'}></span>{isOnline(device.last_seen) ? 'Online' : 'Offline'}</td>
                    <td>{formatLastSeen(device.last_seen)}</td>
                    <td>
                      <div className="action-buttons">
                        {device.blocked ? <button className="blue-square" onClick={() => unblockDevice(device.mac)}><Unlock size={15} /></button> : <button className="orange-square" onClick={() => blockDevice(device.mac)}><Ban size={15} /></button>}
                        <button className="red-square" onClick={() => deleteDevice(device.mac)}><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredDevices.length === 0 && <p className="empty-state">No devices found.</p>}
          </div>
          <p className="table-foot">Showing {filteredDevices.length} of {devices.length} devices</p>
        </section>

        <section className="panel table-panel payments-panel">
          <h2><Clock3 size={19} /> Recent Payments</h2>
          <div className="table-wrap">
            <table>
              <thead><tr><th>MAC</th><th>Customer</th><th>Email</th><th>Amount</th><th>Transaction</th><th>PayPal Order</th><th>Date</th></tr></thead>
              <tbody>
                {recentPayments.map(payment => (
                  <tr key={payment.id}>
                    <td><strong>{payment.mac}</strong></td><td>{payment.payer_name || '-'}</td><td>{payment.payer_email || '-'}</td><td>{payment.price || '-'}</td><td>{payment.transaction_id ? payment.transaction_id.slice(0, 12) : '-'}</td><td>{payment.paypal_order_id ? payment.paypal_order_id.slice(0, 12) : '-'}</td><td>{payment.created_at?.slice(0, 10) || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {recentPayments.length === 0 && <p className="empty-state">No recent payments yet.</p>}
          </div>
        </section>
      </main>
    </div>
  );
}
