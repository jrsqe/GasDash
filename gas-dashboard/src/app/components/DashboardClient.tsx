'use client'

import { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts'

// ── Colour palette (light, Squadron Energy-aligned) ───────────────────────────
const FACILITY_COLOURS = [
  '#1D6FD4', '#00A878', '#E07B2A', '#9B3FCF', '#D4281D',
  '#0891B2', '#65A30D', '#B45309', '#6D28D9', '#0E7490',
  '#4D7C0F', '#92400E', '#5B21B6',
]
const PRICE_COLOUR  = '#E07B2A'
const NAVY          = '#0B1F3A'
const TEAL          = '#00A878'
const MUTED         = '#7A8FA6'
const BORDER        = '#DDE2EA'
const SURFACE       = '#FFFFFF'
const SURFACE2      = '#F0F3F7'
const BG            = '#F4F6F9'
const TEAL_PALE     = '#E6F7F2'

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
const fmtPrice = (v: number | null) => v == null ? '—' : `$${fmt(v, 2)}`

function tickFormatter(val: string) {
  if (!val) return ''
  const [date, time] = val.split(' ')
  if (!date || !time) return val
  const [, mm, dd] = date.split('-')
  return `${dd}/${mm} ${time}`
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, delay }: { label: string; value: string; sub?: string; delay: number }) {
  return (
    <div className={`stat-card fade-up delay-${delay}`}>
      <div style={{ color: MUTED, fontSize: '0.68rem', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: '0.5rem', fontWeight: 500 }}>
        {label}
      </div>
      <div style={{ fontSize: '1.55rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1, color: NAVY }}>
        {value}
      </div>
      {sub && (
        <div style={{ color: MUTED, fontSize: '0.72rem', marginTop: '0.35rem', fontFamily: 'DM Mono, monospace' }}>
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
      background: SURFACE, border: `1px solid ${BORDER}`,
      borderRadius: 8, padding: '0.75rem 1rem', fontSize: '0.78rem',
      fontFamily: 'DM Mono, monospace', minWidth: 210,
      boxShadow: '0 4px 16px rgba(11,31,58,0.10)',
    }}>
      <div style={{ color: MUTED, marginBottom: '0.5rem', fontSize: '0.68rem', fontWeight: 500 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', gap: '1.5rem', marginBottom: 3 }}>
          <span style={{ color: p.color, fontWeight: 500 }}>{p.name}</span>
          <span style={{ color: NAVY, fontWeight: 600 }}>
            {p.name === 'Spot Price ($/MWh)'
              ? `$${Number(p.value).toFixed(2)}`
              : `${Number(p.value).toFixed(1)} MW`}
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
  const accentColor = region === 'NSW' ? '#1D6FD4' : TEAL

  const chartRows = rows.length > 200 ? rows.filter((_, i) => i % 2 === 0) : rows

  return (
    <div>
      {/* Region header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{
          width: 10, height: 10, borderRadius: '50%',
          background: accentColor,
        }} />
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, letterSpacing: '-0.01em', color: NAVY, margin: 0 }}>
          {region === 'NSW' ? 'New South Wales' : 'Victoria'}
        </h2>
        <span style={{ color: MUTED, fontFamily: 'DM Mono, monospace', fontSize: '0.72rem', fontWeight: 400 }}>
          {summary.facilityCount} facilities
        </span>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <StatCard label="Avg Spot Price"  value={fmtPrice(summary.avgPrice)}        sub="$/MWh" delay={1} />
        <StatCard label="Max Spot Price"  value={fmtPrice(summary.maxPrice)}        sub="Peak interval" delay={2} />
        <StatCard label="Min Spot Price"  value={fmtPrice(summary.minPrice)}        sub="Floor interval" delay={3} />
        <StatCard label="Avg Generation"  value={`${fmt(summary.avgTotalGen, 0)} MW`} sub="All facilities" delay={4} />
        <StatCard label="Peak Generation" value={`${fmt(summary.peakTotalGen, 0)} MW`} sub="Max interval" delay={5} />
      </div>

      {/* Chart */}
      <div className="card fade-up delay-2" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <h3 style={{ fontWeight: 600, fontSize: '0.95rem', color: NAVY, margin: 0 }}>Gas Generation by Facility</h3>
          <span style={{ color: MUTED, fontFamily: 'DM Mono, monospace', fontSize: '0.7rem' }}>MW · hourly</span>
        </div>

        <ResponsiveContainer width="100%" height={340}>
          <LineChart data={chartRows} margin={{ top: 5, right: 24, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
            <XAxis
              dataKey="datetime"
              tickFormatter={tickFormatter}
              tick={{ fill: MUTED, fontSize: 10, fontFamily: 'DM Mono, monospace' }}
              tickLine={false}
              axisLine={{ stroke: BORDER }}
              interval="preserveStartEnd"
            />
            <YAxis
              yAxisId="gen"
              tick={{ fill: MUTED, fontSize: 10, fontFamily: 'DM Mono, monospace' }}
              tickLine={false}
              axisLine={false}
              width={58}
              tickFormatter={v => `${v} MW`}
            />
            <YAxis
              yAxisId="price"
              orientation="right"
              tick={{ fill: PRICE_COLOUR, fontSize: 10, fontFamily: 'DM Mono, monospace' }}
              tickLine={false}
              axisLine={false}
              width={62}
              tickFormatter={v => `$${v}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '0.72rem', fontFamily: 'DM Mono, monospace', paddingTop: '0.75rem', color: NAVY }}
            />
            {facilities.map((name, i) => (
              <Line
                key={name}
                yAxisId="gen"
                type="monotone"
                dataKey={name}
                stroke={FACILITY_COLOURS[i % FACILITY_COLOURS.length]}
                strokeWidth={1.75}
                dot={false}
                activeDot={{ r: 3, strokeWidth: 0 }}
                connectNulls
              />
            ))}
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="price"
              name="Spot Price ($/MWh)"
              stroke={PRICE_COLOUR}
              strokeWidth={1.25}
              strokeDasharray="5 3"
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Data table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <button
          onClick={() => setShowTable(v => !v)}
          style={{
            width: '100%', padding: '0.9rem 1.5rem',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: NAVY,
          }}
        >
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Raw Data Table</span>
          <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.72rem', color: MUTED }}>
            {rows.length} rows · {showTable ? '▲ hide' : '▼ show'}
          </span>
        </button>

        {showTable && (
          <div style={{ maxHeight: 380, overflowY: 'auto', borderTop: `1px solid ${BORDER}` }}>
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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: BG }}>
        <div className="card" style={{ padding: '2rem', maxWidth: 480 }}>
          <div style={{ color: '#D4281D', fontFamily: 'DM Mono, monospace', fontSize: '0.78rem', marginBottom: '0.5rem', fontWeight: 600 }}>ERROR</div>
          <div style={{ color: MUTED, fontSize: '0.85rem' }}>{error}</div>
        </div>
      </div>
    )
  }

  if (!payload?.ok || !payload.data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BG }}>
        <div style={{ color: MUTED, fontFamily: 'DM Mono, monospace', fontSize: '0.85rem' }}>No data available.</div>
      </div>
    )
  }

  const { data } = payload
  const activeData = data[activeTab]
  const tabAccent = activeTab === 'NSW' ? '#1D6FD4' : TEAL

  return (
    <div style={{ minHeight: '100vh', background: BG }}>

      {/* Header */}
      <header style={{
        background: NAVY,
        borderBottom: `3px solid ${TEAL}`,
        position: 'sticky', top: 0, zIndex: 100,
        padding: '0 2rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 58,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Squadron-style wordmark */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: 6,
              background: TEAL,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: '0.8rem', color: NAVY,
              fontFamily: 'Inter, sans-serif',
            }}>SQ</div>
            <div>
              <div style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '0.95rem', letterSpacing: '-0.01em', lineHeight: 1.1 }}>
                Gas Dashboard
              </div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.65rem', fontFamily: 'DM Mono, monospace', lineHeight: 1 }}>
                Squadron Energy
              </div>
            </div>
          </div>
          <div style={{
            fontFamily: 'DM Mono, monospace', fontSize: '0.65rem',
            color: 'rgba(255,255,255,0.4)',
            padding: '2px 8px',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 4,
          }}>
            NEM · {payload.interval}
          </div>
        </div>
        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.68rem', color: 'rgba(255,255,255,0.45)' }}>
          NSW & VIC · Gas Peakers
        </div>
      </header>

      {/* Tab bar */}
      <div style={{
        background: SURFACE,
        borderBottom: `1px solid ${BORDER}`,
        padding: '0 2rem',
        display: 'flex', gap: '0',
        boxShadow: '0 1px 3px rgba(11,31,58,0.05)',
      }}>
        {(['NSW', 'VIC'] as const).map(tab => {
          const isActive = activeTab === tab
          const colour = tab === 'NSW' ? '#1D6FD4' : TEAL
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '0.85rem 1.5rem',
                border: 'none', background: 'transparent', cursor: 'pointer',
                fontFamily: 'Inter, sans-serif', fontWeight: isActive ? 600 : 400,
                fontSize: '0.875rem',
                color: isActive ? colour : MUTED,
                borderBottom: isActive ? `2px solid ${colour}` : '2px solid transparent',
                marginBottom: -1,
                transition: 'color 0.15s, border-color 0.15s',
              }}
            >
              {tab === 'NSW' ? 'New South Wales' : 'Victoria'}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '2rem' }}>
        {activeData ? (
          <RegionPanel key={activeTab} region={activeTab} data={activeData} />
        ) : (
          <div style={{ color: MUTED, fontFamily: 'DM Mono, monospace', fontSize: '0.85rem', padding: '3rem 0' }}>
            No data for {activeTab}.
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{
        borderTop: `1px solid ${BORDER}`,
        background: SURFACE,
        padding: '0.9rem 2rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: TEAL }} />
          <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.68rem', color: MUTED }}>
            Data: Open Electricity API · openelectricity.org.au
          </span>
        </div>
        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.68rem', color: MUTED }}>
          Refreshes every 30 min
        </span>
      </footer>
    </div>
  )
}
