import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { STEPS } from '../data.js'
import { Cloud } from './Art.jsx'
import { img } from '../images.js'

const list = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.12 } },
}
// Only transforms animate here, so every step is readable before it scrolls in.
const item = {
  hidden: { x: -28 },
  shown: { x: 0, transition: { type: 'spring', stiffness: 160, damping: 20 } },
}

export default function Harvest() {
  return (
    <section className="section harvest" id="harvest" aria-labelledby="harvest-title">
      <header className="section-head">
        <p className="eyebrow">A picking day, start to finish</p>
        <h2 id="harvest-title" className="display h2">How a harvest works</h2>
      </header>

      <div className="harvest-grid">
        <motion.ol className="steps" initial="hidden" whileInView="shown" viewport={{ once: true, amount: 0.3 }} variants={list}>
          {STEPS.map((s, i) => (
            <motion.li key={s.title} variants={item} className="step">
              <span className="step-num mono" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <h3 className="step-title">{s.title}</h3>
                <p>{s.body}</p>
              </div>
            </motion.li>
          ))}
        </motion.ol>

        <div className="kite-scene">
          {img('picker') ? <PickerArt /> : <KiteDrawing />}
          <p className="kite-caption mono">Tether 1,400 m · climb rate 0.6 m/s</p>
        </div>
      </div>
    </section>
  )
}

function PickerArt() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['-6%', '6%'])
  return (
    <div ref={ref} className="picker-frame">
      <motion.img
        src={img('picker')}
        alt="Illustration of a picker in a teal suit hanging from a tether inside a cloud, reaching for a plum"
        style={{ y, scale: 1.14 }}
      />
    </div>
  )
}

function KiteDrawing() {
  return (
    <div aria-hidden="true">
    <Cloud width={260} className="kite-cloud" />
    <svg viewBox="0 0 300 420" className="kite-svg">
      <motion.path
        d="M40 410 C 120 330, 90 240, 170 160 S 230 70, 220 60"
        fill="none"
        stroke="var(--ink)"
        strokeWidth="1.5"
        strokeDasharray="1 0"
        initial={{ pathLength: 0.55 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 2.2, ease: 'easeInOut' }}
      />
      <motion.g
        animate={{ rotate: [-6, 6, -6], y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ originX: '220px', originY: '60px' }}
      >
        <path d="M220 20 L250 60 L220 110 L190 60 Z" fill="var(--plum)" />
        <path d="M220 20 L220 110 M190 60 L250 60" stroke="var(--bg)" strokeWidth="1.5" />
        <path d="M220 110 q -8 14 0 24 q 8 10 0 22" stroke="var(--plum)" strokeWidth="2" fill="none" />
      </motion.g>
      <motion.g
        initial={{ y: 60 }}
        whileInView={{ y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 2.6, ease: 'easeOut', delay: 0.6 }}
      >
        <circle cx="128" cy="262" r="7" fill="var(--dew)" />
        <path d="M128 269 v 18 M118 276 h 20 M128 287 l -7 12 M128 287 l 7 12" stroke="var(--dew)" strokeWidth="3" strokeLinecap="round" />
      </motion.g>
    </svg>
    </div>
  )
}
