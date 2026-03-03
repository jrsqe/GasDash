'use client'

import { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine
} from 'recharts'

// ── Colour palette ────────────────────────────────────────────────────────────
const FACILITY_COLOURS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
  '#14b8a6', '#fb923c', '#a78bfa',
]
const PRICE_COLOUR = '#00c2ff'

// ── Types ─────────────────────────────────────────────────────────────────────
interface RegionData {
  facilities: string[]
  rows: Record<string, any>[]
  summary: {
    avgPrice: number | null
    maxPrice: number | null
    minPrice: number | null
    avgTotalGen: number | null
    peakTotalGen: number | null
    facilityCount: number
  }
}

interface Payload {
  ok: boolean
  interval: string
  data: { NSW: RegionData; VIC: RegionData }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (v: number | null, dec = 0) =>
  v == null ? '—' : v.toLocaleString('en-AU', { minimumFractionDigits: dec, maximumFractionDigits: dec })

const fmtPrice = (v: number | null) =>
  v == null ? '—' : `$${fmt(v, 2)}`

function tickFormatter(val: string) {
  if (!val) return ''
  // val is "YYYY-MM-DD HH:MM"
  const parts = val.split(' ')
  if (parts.length < 2) return val
  const [date, time] = parts
  const [, mm, dd] = date.split('-')
  return `${dd}/${mm} ${time}`
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, delay }: { label: string; value: string; sub?: string; delay: number }) {
  return (
    <div className={`stat-card fade-up fade-up-${delay}`}>
      <div style={{ color: 'var(--muted)', fontSize: '0.7rem', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
        {label}
      </div>
      <div style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: '0.35rem', fontFamily: 'DM Mono, monospace' }}>
          {sub}
        </div>
      )}
    </div>
  )
}

// ── Custom Tooltip ────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--surface2)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '0.75rem 1rem', fontSize: '0.78rem',
      fontFamily: 'DM Mono, monospace', minWidth: 200,
    }}>
      <div style={{ color: 'var(--muted)', marginBottom: '0.5rem', fontSize: '0.7rem' }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', gap: '1.5rem', marginBottom: 2 }}>
          <span style={{ color: p.color }}>{p.name}</span>
          <span style={{ color: 'var(--text)', fontWeight: 500 }}>
            {p.name === 'Spot Price ($/MWh)' ? `$${Number(p.value).toFixed(2)}` : `${Number(p.value).toFixed(1)} MW`}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Region Panel ──────────────────────────────────────────────────────────────
function RegionPanel({ region, data }: { region: 'NSW' | 'VIC'; data: RegionData }) {
  const [showTable, setShowTable] = useState(false)
  const { facilities, rows, summary } = data
  const accentColor = region === 'NSW' ? 'var(--nsw)' : 'var(--vic)'

  // Thin rows for chart (every nth if many)
  const chartRows = rows.length > 200 ? rows.filter((_, i) => i % 2 === 0) : rows

  return (
    <div>
      {/* Region header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{
          width: 10, height: 10, borderRadius: '50%',
          background: accentColor, boxShadow: `0 0 12px ${accentColor}`,
        }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.01em' }}>
          {region === 'NSW' ? 'New South Wales' : 'Victoria'}
        </h2>
        <span style={{ color: 'var(--muted)', fontFamily: 'DM Mono, monospace', fontSize: '0.75rem' }}>
          {summary.facilityCount} facilities
        </span>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <StatCard label="Avg Spot Price"   value={fmtPrice(summary.avgPrice)}   sub="$/MWh" delay={1} />
        <StatCard label="Max Spot Price"   value={fmtPrice(summary.maxPrice)}   sub="Peak interval" delay={2} />
        <StatCard label="Min Spot Price"   value={fmtPrice(summary.minPrice)}   sub="Floor interval" delay={3} />
        <StatCard label="Avg Generation"   value={`${fmt(summary.avgTotalGen, 0)} MW`} sub="All facilities" delay={4} />
        <StatCard label="Peak Generation"  value={`${fmt(summary.peakTotalGen, 0)} MW`} sub="Max interval" delay={5} />
      </div>

      {/* Generation chart */}
      <div className="card fade-up fade-up-2" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <h3 style={{ fontWeight: 700, fontSize: '0.95rem' }}>Gas Generation by Facility</h3>
          <span style={{ color: 'var(--muted)', fontFamily: 'DM Mono, monospace', fontSize: '0.7rem' }}>MW · hourly</span>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartRows} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="datetime"
              tickFormatter={tickFormatter}
              tick={{ fill: 'var(--muted)', fontSize: 10, fontFamily: 'DM Mono, monospace' }}
              tickLine={false}
              axisLine={{ stroke: 'var(--border)' }}
              interval="preserveStartEnd"
            />
            <YAxis
              yAxisId="gen"
              tick={{ fill: 'var(--muted)', fontSize: 10, fontFamily: 'DM Mono, monospace' }}
              tickLine={false}
              axisLine={false}
              width={55}
              tickFormatter={v => `${v} MW`}
            />
            <YAxis
              yAxisId="price"
              orientation="right"
              tick={{ fill: PRICE_COLOUR, fontSize: 10, fontFamily: 'DM Mono, monospace' }}
              tickLine={false}
              axisLine={false}
              width={65}
              tickFormatter={v => `$${v}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '0.75rem', fontFamily: 'DM Mono, monospace', paddingTop: '0.75rem' }}
            />
            {facilities.map((name, i) => (
              <Line
                key={name}
                yAxisId="gen"
                type="monotone"
                dataKey={name}
                stroke={FACILITY_COLOURS[i % FACILITY_COLOURS.length]}
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3 }}
                connectNulls
              />
            ))}
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="price"
              name="Spot Price ($/MWh)"
              stroke={PRICE_COLOUR}
              strokeWidth={1}
              strokeDasharray="4 2"
              dot={false}
              activeDot={{ r: 3 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Data table toggle */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <button
          onClick={() => setShowTable(v => !v)}
          style={{
            width: '100%', padding: '0.9rem 1.5rem',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'var(--text)',
          }}
        >
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Raw Data Table</span>
          <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.75rem', color: 'var(--muted)' }}>
            {rows.length} rows · {showTable ? '▲ hide' : '▼ show'}
          </span>
        </button>

        {showTable && (
          <div style={{ maxHeight: 360, overflowY: 'auto', borderTop: '1px solid var(--border)' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Datetime</th>
                  <th>Price $/MWh</th>
                  {facilities.map(f => <th key={f}>{f}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i}>
                    <td>{row.datetime}</td>
                    <td>{row.price != null ? `$${Number(row.price).toFixed(2)}` : '—'}</td>
                    {facilities.map(f => (
                      <td key={f}>{row[f] != null ? Number(row[f]).toFixed(1) : '—'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function DashboardClient({ payload, error }: { payload: Payload | null; error: string | null }) {
  const [activeTab, setActiveTab] = useState<'NSW' | 'VIC'>('NSW')

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="card" style={{ padding: '2rem', maxWidth: 480 }}>
          <div style={{ color: '#ef4444', fontFamily: 'DM Mono, monospace', fontSize: '0.8rem', marginBottom: '0.5rem' }}>ERROR</div>
          <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{error}</div>
        </div>
      </div>
    )
  }

  if (!payload?.ok || !payload.data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--muted)', fontFamily: 'DM Mono, monospace', fontSize: '0.85rem' }}>
          No data available.
        </div>
      </div>
    )
  }

  const { data } = payload
  const activeData = data[activeTab]

  return (
    <div style={{ minHeight: '100vh', padding: '0' }}>

      {/* Header */}
      <header style={{
        borderBottom: '1px solid var(--border)',
        background: 'rgba(10,14,20,0.9)',
        backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 100,
        padding: '0 2rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 60,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Logo mark */}
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.7rem', fontWeight: 800, color: '#000',
          }}>G</div>
          <span style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.01em' }}>
            Gas Dashboard
          </span>
          <span style={{
            fontFamily: 'DM Mono, monospace', fontSize: '0.65rem',
            color: 'var(--muted)', padding: '2px 8px',
            border: '1px solid var(--border)', borderRadius: 4,
          }}>
            NEM · {payload.interval} interval
          </span>
        </div>
        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.7rem', color: 'var(--muted)' }}>
          NSW & VIC · Gas Peakers
        </div>
      </header>

      {/* Tab bar */}
      <div style={{ borderBottom: '1px solid var(--border)', padding: '0 2rem', display: 'flex', gap: '0.25rem' }}>
        {(['NSW', 'VIC'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '0.75rem 1.25rem',
              border: 'none', background: 'transparent', cursor: 'pointer',
              fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.85rem',
              color: activeTab === tab ? (tab === 'NSW' ? 'var(--nsw)' : 'var(--vic)') : 'var(--muted)',
              borderBottom: activeTab === tab ? `2px solid ${tab === 'NSW' ? 'var(--nsw)' : 'var(--vic)'}` : '2px solid transparent',
              marginBottom: -1,
              transition: 'color 0.2s',
            }}
          >
            {tab === 'NSW' ? 'New South Wales' : 'Victoria'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '2rem' }}>
        {activeData ? (
          <RegionPanel key={activeTab} region={activeTab} data={activeData} />
        ) : (
          <div style={{ color: 'var(--muted)', fontFamily: 'DM Mono, monospace', fontSize: '0.85rem', padding: '3rem 0' }}>
            No data for {activeTab}.
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border)', padding: '1rem 2rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.7rem', color: 'var(--muted)' }}>
          Data: Open Electricity API · openelectricity.org.au
        </span>
        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.7rem', color: 'var(--muted)' }}>
          Refreshes every 30 min
        </span>
      </footer>
    </div>
  )
}
