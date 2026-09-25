import { useEffect, useState } from 'react'
import { MotionConfig, motion, useScroll, useSpring, useTransform } from 'framer-motion'
import Hero from './components/Hero.jsx'
import Varieties from './components/Varieties.jsx'
import Harvest from './components/Harvest.jsx'
import Forecast from './components/Forecast.jsx'
import Faq from './components/Faq.jsx'
import Reserve from './components/Reserve.jsx'

const NAV = [
  { id: 'varieties', label: 'Varieties' },
  { id: 'harvest', label: 'Harvest' },
  { id: 'forecast', label: 'Forecast' },
  { id: 'questions', label: 'Questions' },
]

// Scrolling the page climbs through the sky: ground, low, middle, high, stratosphere.
const STOPS = [0, 0.2, 0.45, 0.72, 1]
const ALTS = [42, 1200, 4500, 9000, 22000]
const TICKS = [
  { at: 0, label: '0' },
  { at: 0.26, label: '2 km' },
  { at: 0.6, label: '7 km' },
  { at: 0.81, label: '13 km' },
  { at: 1, label: '22 km' },
]

function useActiveSection(ids) {
  const [active, setActive] = useState(null)
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-45% 0px -50% 0px' },
    )
    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (el) io.observe(el)
    })
    return () => io.disconnect()
  }, [ids])
  return active
}

function Altimeter() {
  const { scrollYProgress } = useScroll()
  const raw = useTransform(scrollYProgress, STOPS, ALTS)
  const alt = useSpring(raw, { stiffness: 80, damping: 20 })
  const text = useTransform(alt, (v) => `${Math.round(v).toLocaleString('en-GB')} m`)
  const layer = useTransform(alt, (v) => (v < 2000 ? 'Low cloud' : v < 7000 ? 'Middle cloud' : v < 13000 ? 'High cloud' : 'Stratosphere'))
  const top = useTransform(scrollYProgress, [0, 1], ['100%', '0%'])

  return (
    <aside className="altimeter" aria-hidden="true">
      <p className="alt-label mono">Reading altitude</p>
      <motion.p className="alt-value mono">{text}</motion.p>
      <motion.p className="alt-layer">{layer}</motion.p>
      <div className="alt-track">
        {TICKS.map((t) => (
          <span key={t.label} className="alt-tick mono" style={{ bottom: `${t.at * 100}%` }}>{t.label}</span>
        ))}
        <motion.span className="alt-marker" style={{ top }} />
      </div>
    </aside>
  )
}

export default function App() {
  const active = useActiveSection(NAV.map((n) => n.id))
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })

  return (
    <MotionConfig reducedMotion="user">
      <motion.div className="progress" style={{ scaleX: progress }} aria-hidden="true" />
      <header className="topbar">
        <a href="#top" className="brand">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 24" width="30"><circle cx="11" cy="14" r="8" fill="currentColor" /><circle cx="19" cy="10" r="9" fill="currentColor" /><rect x="3" y="14" width="26" height="8" rx="4" fill="currentColor" /><circle cx="16" cy="22" r="3.2" fill="var(--plum)" /></svg>
          </span>
          Nimbus Orchard
        </a>
        <nav aria-label="Sections">
          <ul className="nav">
            {NAV.map((n) => (
              <li key={n.id}>
                <a href={`#${n.id}`} className={`nav-link${active === n.id ? ' is-active' : ''}`} aria-current={active === n.id ? 'true' : undefined}>
                  {active === n.id && <motion.span layoutId="nav-dot" className="nav-dot" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />}
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <motion.a href="#reserve" className="btn btn-primary btn-small" whileHover={{ y: -1 }} whileTap={{ scale: 0.95 }}>
          Reserve
        </motion.a>
      </header>

      <Altimeter />

      <main className="page">
        <Hero />
        <Varieties />
        <Harvest />
        <Forecast />
        <Faq />
        <Reserve />
      </main>

      <footer className="footer">
        <p>Nimbus Orchard, Cloud Base Road. Packing shed open when the sky is.</p>
        <p className="fine">A fictional orchard, made to show off Motion animations. None of this fruit exists.</p>
      </footer>
    </MotionConfig>
  )
}
