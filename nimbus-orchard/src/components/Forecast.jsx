import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FORECAST } from '../data.js'

const TIER_LABEL = { low: 'Low tier', middle: 'Middle tier', high: 'High tier' }
const LAUNCH_AT = 70

function wedge(i) {
  const toXY = (deg) => {
    const r = (deg * Math.PI) / 180
    return [40 + 34 * Math.cos(r), 40 + 34 * Math.sin(r)]
  }
  const [x0, y0] = toXY(-90 + i * 45)
  const [x1, y1] = toXY(-45 + i * 45)
  return `M40 40 L${x0.toFixed(2)} ${y0.toFixed(2)} A34 34 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`
}

function OktaDial({ oktas }) {
  return (
    <svg viewBox="0 0 80 80" className="okta" role="img" aria-label={`${oktas} of 8 oktas of cloud cover`}>
      <circle cx="40" cy="40" r="36" fill="none" stroke="var(--line)" strokeWidth="2" />
      {Array.from({ length: 8 }, (_, i) => (
        <motion.path
          key={i}
          d={wedge(i)}
          fill="var(--dew)"
          stroke="var(--surface)"
          strokeWidth="1.5"
          initial={false}
          animate={{ opacity: i < oktas ? 1 : 0.1, scale: i < oktas ? 1 : 0.9 }}
          style={{ originX: '40px', originY: '40px' }}
          transition={{ delay: i * 0.05, type: 'spring', stiffness: 300, damping: 20 }}
        />
      ))}
    </svg>
  )
}

export default function Forecast() {
  const [idx, setIdx] = useState(0)
  const d = FORECAST[idx]
  const best = Object.entries(d.ripe).sort((a, b) => b[1] - a[1])[0]
  const launch = best[1] >= LAUNCH_AT

  return (
    <section className="section" id="forecast" aria-labelledby="forecast-title">
      <header className="section-head">
        <p className="eyebrow">Picking forecast · week 40</p>
        <h2 id="forecast-title" className="display h2">This week's sky</h2>
        <p className="section-lede">
          We launch when any tier reaches {LAUNCH_AT}% ripe. Pick a day to see the cloud cover and what is ready.
        </p>
      </header>

      <div className="forecast">
        <div className="days" role="tablist" aria-label="Day">
          {FORECAST.map((f, i) => (
            <button
              key={f.day}
              role="tab"
              aria-selected={i === idx}
              className={`day${i === idx ? ' is-active' : ''}`}
              onClick={() => setIdx(i)}
            >
              {i === idx && <motion.span layoutId="day-pill" className="day-pill" transition={{ type: 'spring', stiffness: 420, damping: 32 }} />}
              <span className="day-name">{f.day}</span>
              <span className="day-date mono">{f.date}</span>
            </button>
          ))}
        </div>

        <div className="board" role="tabpanel" aria-live="polite">
          <div className="board-left">
            <OktaDial oktas={d.oktas} />
            <dl className="readings">
              <div><dt>Cover</dt><dd className="mono">{d.oktas}/8 oktas</dd></div>
              <div><dt>Cloud base</dt><dd className="mono">{d.base.toLocaleString('en-GB')} m</dd></div>
              <div><dt>Dew point</dt><dd className="mono">{d.dew} °C</dd></div>
              <div><dt>Wind</dt><dd className="mono">{d.wind}</dd></div>
            </dl>
          </div>

          <div className="board-right">
            <div className="bars">
              {Object.entries(d.ripe).map(([tier, pct]) => (
                <div key={tier} className="bar-row">
                  <span className="bar-label">{TIER_LABEL[tier]}</span>
                  <div className="bar-track">
                    <motion.div
                      className={`bar-fill${pct >= LAUNCH_AT ? ' is-ripe' : ''}`}
                      initial={false}
                      animate={{ scaleX: pct / 100 }}
                      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                    />
                    <span className="bar-threshold" style={{ left: `${LAUNCH_AT}%` }} aria-hidden="true" />
                  </div>
                  <span className="bar-value mono">{pct}%</span>
                </div>
              ))}
            </div>

            <div className="verdict">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={launch ? 'go' : 'hold'}
                  className={`chip ${launch ? 'chip-go' : 'chip-hold'}`}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.6, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  {launch ? `Launch: ${TIER_LABEL[best[0]].toLowerCase()}` : 'Hold on the ground'}
                </motion.span>
              </AnimatePresence>
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={d.day}
                  className="verdict-note"
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -8, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {d.note}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
