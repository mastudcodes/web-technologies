import { useState, useEffect, useRef, useMemo } from 'react'
import './App.css'

const TIMEZONES = [
  { label: 'Asia/Kolkata (IST)', value: 'Asia/Kolkata' },
  { label: 'UTC', value: 'UTC' },
  { label: 'America/New York (EST)', value: 'America/New_York' },
  { label: 'America/Los Angeles (PST)', value: 'America/Los_Angeles' },
  { label: 'Europe/London (GMT)', value: 'Europe/London' },
  { label: 'Europe/Paris (CET)', value: 'Europe/Paris' },
  { label: 'Europe/Berlin (CET)', value: 'Europe/Berlin' },
  { label: 'Asia/Dubai (GST)', value: 'Asia/Dubai' },
  { label: 'Asia/Singapore (SGT)', value: 'Asia/Singapore' },
  { label: 'Asia/Shanghai (CST)', value: 'Asia/Shanghai' },
  { label: 'Asia/Tokyo (JST)', value: 'Asia/Tokyo' },
  { label: 'Australia/Sydney (AEST)', value: 'Australia/Sydney' },
]

const DEFAULT_TZ = 'Asia/Kolkata'
const STORAGE_THEME_KEY = 'chrono-theme'

function useClock(tz) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    let id
    const tick = () => {
      const d = new Date()
      setNow(d)
    }
    tick()
    id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [tz])

  const parts = useMemo(() => {
    const options = {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }
    const f = new Intl.DateTimeFormat('en-US', options)
    const [{ value: h }, , { value: m }, , { value: s }] = f.formatToParts(now)
    const hour = parseInt(h, 10)
    const minute = parseInt(m, 10)
    const second = parseInt(s, 10)

    const dateOpts = { timeZone: tz, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
    const dateStr = new Intl.DateTimeFormat('en-US', dateOpts).format(now)

    return { hour, minute, second, dateStr, iso: now.toISOString() }
  }, [now, tz])

  return parts
}

function AnalogClock({ hour, minute, second }) {
  const hourDeg = (hour % 12) * 30 + minute * 0.5
  const minuteDeg = minute * 6 + second * 0.1
  const secondDeg = second * 6

  const markers = useMemo(() => {
    const arr = []
    for (let i = 0; i < 60; i++) {
      const isMajor = i % 5 === 0
      arr.push(
        <line
          key={i}
          x1="100"
          y1={isMajor ? 12 : 18}
          x2="100"
          y2={isMajor ? 24 : 22}
          transform={`rotate(${i * 6} 100 100)`}
          stroke={isMajor ? 'var(--clock-tick-major)' : 'var(--clock-tick-minor)'}
          strokeWidth={isMajor ? 3 : 1.5}
          strokeLinecap="round"
        />
      )
    }
    return arr
  }, [])

  return (
    <svg viewBox="0 0 200 200" className="analog-clock">
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <circle cx="100" cy="100" r="98" fill="var(--clock-bg)" stroke="var(--clock-ring)" strokeWidth="2" />
      <circle cx="100" cy="100" r="92" fill="none" stroke="var(--clock-ring)" strokeWidth="1" />
      {markers}
      <g className="hand hour-hand" style={{ transform: `rotate(${hourDeg}deg)` }}>
        <line x1="100" y1="100" x2="100" y2="55" stroke="var(--clock-hour-hand)" strokeWidth="5" strokeLinecap="round" />
      </g>
      <g className="hand minute-hand" style={{ transform: `rotate(${minuteDeg}deg)` }}>
        <line x1="100" y1="100" x2="100" y2="35" stroke="var(--clock-minute-hand)" strokeWidth="3.5" strokeLinecap="round" />
      </g>
      <g className="hand second-hand" style={{ transform: `rotate(${secondDeg}deg)` }}>
        <line x1="100" y1="115" x2="100" y2="28" stroke="var(--clock-second-hand)" strokeWidth="1.5" strokeLinecap="round" filter="url(#glow)" />
      </g>
      <circle cx="100" cy="100" r="4" fill="var(--clock-center)" />
      <circle cx="100" cy="100" r="2" fill="#ffffff" />
    </svg>
  )
}

function AlarmManager({ alarms, setAlarms, activeAlarms, snoozeAlarm, dismissAlarm, onToggleAlarm, onDeleteAlarm }) {
  const [showForm, setShowForm] = useState(false)
  const [newTime, setNewTime] = useState('07:00')
  const [newLabel, setNewLabel] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editTime, setEditTime] = useState('')
  const [editLabel, setEditLabel] = useState('')

  const addAlarm = () => {
    if (!newTime) return
    setAlarms(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        time: newTime,
        label: newLabel || 'Alarm',
        enabled: true,
      },
    ])
    setNewLabel('')
    setShowForm(false)
  }

  const startEdit = (alarm) => {
    setEditingId(alarm.id)
    setEditTime(alarm.time)
    setEditLabel(alarm.label)
  }

  const saveEdit = () => {
    if (!editTime) return
    setAlarms(prev => prev.map(a => a.id === editingId ? { ...a, time: editTime, label: editLabel || a.label } : a))
    setEditingId(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
  }

  const sorted = useMemo(() => {
    return [...alarms].sort((a, b) => a.time.localeCompare(b.time))
  }, [alarms])

  return (
    <div className="alarm-card">
      <div className="alarm-header">
        <h3>Alarms</h3>
        <button className="btn-primary" onClick={() => setShowForm(s => !s)}>
          {showForm ? 'Cancel' : '+ Add Alarm'}
        </button>
      </div>
      {showForm && (
        <form className="alarm-form" onSubmit={e => { e.preventDefault(); addAlarm() }}>
          <input
            type="time"
            value={newTime}
            onChange={e => setNewTime(e.target.value)}
            className="time-input"
          />
          <input
            type="text"
            placeholder="Label (optional)"
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            className="label-input"
          />
          <button type="submit" className="btn-add">Save</button>
        </form>
      )}
      <ul className="alarm-list">
        {sorted.map(alarm => (
          <li key={alarm.id} className={`alarm-item ${alarm.enabled ? 'enabled' : 'disabled'} ${activeAlarms.has(alarm.id) ? 'ringing' : ''}`}>
            {editingId === alarm.id ? (
              <form className="alarm-edit-form" onSubmit={e => { e.preventDefault(); saveEdit() }}>
                <input
                  type="time"
                  value={editTime}
                  onChange={e => setEditTime(e.target.value)}
                  className="time-input"
                />
                <input
                  type="text"
                  value={editLabel}
                  onChange={e => setEditLabel(e.target.value)}
                  className="label-input"
                />
                <div className="alarm-edit-actions">
                  <button type="button" className="btn-save-edit" onClick={saveEdit}>Save</button>
                  <button type="button" className="btn-cancel-edit" onClick={cancelEdit}>Cancel</button>
                </div>
              </form>
            ) : (
              <>
                <div className="alarm-info">
                  <span className="alarm-time">{alarm.time}</span>
                  <span className="alarm-label">{alarm.label}</span>
                </div>
                <div className="alarm-actions">
                  <button
                    className={`toggle-btn ${alarm.enabled ? 'on' : 'off'}`}
                    onClick={() => onToggleAlarm(alarm.id)}
                    aria-label={alarm.enabled ? 'Disable alarm' : 'Enable alarm'}
                  >
                    {alarm.enabled ? 'ON' : 'OFF'}
                  </button>
                  <button className="edit-btn" onClick={() => startEdit(alarm)} aria-label="Edit alarm" title="Edit">
                    ✎
                  </button>
                  <button className="delete-btn" onClick={() => onDeleteAlarm(alarm.id)} aria-label="Delete alarm">
                    ×
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
        {alarms.length === 0 && !showForm && (
          <li className="empty-state">No alarms yet. Tap "Add Alarm" to create one.</li>
        )}
      </ul>
    </div>
  )
}

function App() {
  const [theme, setTheme] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_THEME_KEY)
      if (stored === 'light' || stored === 'dark') return stored
    } catch {}
    return 'dark'
  })
  const [tz, setTz] = useState(DEFAULT_TZ)
  const [alarms, setAlarms] = useState([])
  const [activeAlarms, setActiveAlarms] = useState(new Set())
  const [muted, setMuted] = useState(false)
  const [snoozing, setSnoozing] = useState(false)
  const audioCtxRef = useRef(null)
  const oscillatorsRef = useRef([])
  const alarmTimersRef = useRef([])
  const lastFiredHMRef = useRef({})

  const { hour, minute, second, dateStr } = useClock(tz)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'light') {
      root.setAttribute('data-theme', 'light')
    } else {
      root.removeAttribute('data-theme')
    }
    try {
      localStorage.setItem(STORAGE_THEME_KEY, theme)
    } catch {}
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  const playBeep = () => {
    if (muted) return
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    const ctx = audioCtxRef.current
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 880
    gain.gain.value = 0.2
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.15)
    oscillatorsRef.current.push(osc)
    osc.onended = () => {
      oscillatorsRef.current = oscillatorsRef.current.filter(o => o !== osc)
    }
  }

  const startAlarmRing = (id) => {
    if (activeAlarms.has(id)) return
    setActiveAlarms(prev => new Set(prev).add(id))
    playBeep()

    const interval = setInterval(() => {
      playBeep()
    }, 1200)
    alarmTimersRef.current.push({ id, interval })
  }

  const stopAlarmRing = (id) => {
    alarmTimersRef.current = alarmTimersRef.current.filter(t => t.id !== id)
    const oscs = oscillatorsRef.current
    oscs.forEach(o => {
      try { o.stop() } catch {}
    })
    oscillatorsRef.current = []
    setActiveAlarms(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const dismissAlarm = (id) => {
    stopAlarmRing(id)
  }

  const snoozeMinutes = 5
  const snoozeAlarm = (id) => {
    const now = new Date()
    const options = { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }
    const f = new Intl.DateTimeFormat('en-US', options)
    const parts = f.formatToParts(now)
    const currentMinute = parseInt(parts.find(p => p.type === 'minute').value, 10)
    const currentHour = parseInt(parts.find(p => p.type === 'hour').value, 10)

    let newMinute = currentMinute + snoozeMinutes
    let newHour = currentHour
    if (newMinute >= 60) {
      newMinute -= 60
      newHour = (newHour + 1) % 24
    }

    const newTime = `${String(newHour).padStart(2, '0')}:${String(newMinute).padStart(2, '0')}`

    setAlarms(prev => prev.map(a => a.id === id ? { ...a, time: newTime } : a))
    stopAlarmRing(id)
    setSnoozing(true)
    setTimeout(() => setSnoozing(false), 2000)
  }

  const markFired = (id, hm) => {
    lastFiredHMRef.current[id] = hm
  }

  const clearFired = (id) => {
    delete lastFiredHMRef.current[id]
  }

  useEffect(() => {
    const now = new Date()
    const options = { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }
    const f = new Intl.DateTimeFormat('en-US', options)
    const parts = f.formatToParts(now)
    const currentHM =
      `${parts.find(p => p.type === 'hour').value}:${parts.find(p => p.type === 'minute').value}`

    alarms.forEach(alarm => {
      if (alarm.enabled && alarm.time === currentHM && lastFiredHMRef.current[alarm.id] !== currentHM) {
        startAlarmRing(alarm.id)
        lastFiredHMRef.current[alarm.id] = currentHM
      }
    })
  }, [second, tz, alarms])

  const toggleAlarm = (id) => {
    setAlarms(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a))
  }

  const deleteAlarm = (id) => {
    clearFired(id)
    setAlarms(prev => prev.filter(a => a.id !== id))
    dismissAlarm(id)
  }

  const currentHM = useMemo(() => {
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
  }, [hour, minute])

  const timeZonesRemaining = useMemo(() => {
    return TIMEZONES.filter(z => z.value !== tz)
  }, [tz])

  return (
    <div className="dashboard" data-theme={theme}>
      <header className="dashboard-header">
        <h1>Chrono Dashboard</h1>
        <div className="dashboard-controls">
          <div className="tz-selector">
            <label htmlFor="tz">Timezone</label>
            <select id="tz" value={tz} onChange={e => setTz(e.target.value)}>
              {TIMEZONES.map(z => (
                <option key={z.value} value={z.value}>{z.label}</option>
              ))}
            </select>
          </div>
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <section className="clock-card primary">
          <AnalogClock hour={hour} minute={minute} second={second} />
          <div className="digital-clock">
            <div className="time-large">
              {String(hour).padStart(2, '0')}:{String(minute).padStart(2, '0')}:{String(second).padStart(2, '0')}
            </div>
            <div className="date-str">{dateStr}</div>
            <div className="tz-badge">{tz}</div>
          </div>
        </section>

        <section className="world-clocks">
          <h3>World Clocks</h3>
          <div className="world-grid">
            {timeZonesRemaining.slice(0, 8).map(z => (
              <WorldClockItem key={z.value} tz={z.value} label={z.label} currentHM={currentHM} />
            ))}
          </div>
        </section>

        <AlarmManager
          alarms={alarms}
          setAlarms={setAlarms}
          activeAlarms={activeAlarms}
          snoozeAlarm={snoozeAlarm}
          dismissAlarm={dismissAlarm}
          onToggleAlarm={toggleAlarm}
          onDeleteAlarm={deleteAlarm}
        />
      </main>

      {activeAlarms.size > 0 && (
        <div className={`alarm-overlay ${muted ? 'muted' : ''}`} onClick={() => {
          activeAlarms.forEach(id => dismissAlarm(id))
        }}>
          <div className="alarm-popup" onClick={e => e.stopPropagation()}>
            <div className="alarm-popup-icon">⏰</div>
            <h2>Alarm Ringing</h2>
            <p>
              {alarms.filter(a => activeAlarms.has(a.id)).map(a => a.label).join(', ')}
            </p>
            <p className="alarm-popup-times">
              {alarms.filter(a => activeAlarms.has(a.id)).map(a => a.time).join(' · ')}
            </p>
            <div className="alarm-popup-actions">
              <button className="btn-snooze" onClick={() => {
                activeAlarms.forEach(id => snoozeAlarm(id))
              }}>
                Snooze ({snoozeMinutes}m)
              </button>
              <button className="btn-dismiss" onClick={() => {
                activeAlarms.forEach(id => dismissAlarm(id))
              }}>
                Dismiss
              </button>
            </div>
            <button className="btn-mute" onClick={() => setMuted(m => !m)}>
              {muted ? 'Unmute' : 'Mute Sound'}
            </button>
          </div>
        </div>
      )}
      {snoozing && (
        <div className="snooze-toast">Alarm snoozed for {snoozeMinutes} minutes</div>
      )}
    </div>
  )
}

function WorldClockItem({ tz, label, currentHM }) {
  const { hour, minute, second, dateStr } = useClock(tz)
  return (
    <div className="world-clock-item">
      <div className="world-time">
        {String(hour).padStart(2, '0')}:{String(minute).padStart(2, '0')}:{String(second).padStart(2, '0')}
      </div>
      <div className="world-label">{label.split(' ')[0]}</div>
      <div className="world-date">{dateStr.split(',')[0]}</div>
    </div>
  )
}

export default App
