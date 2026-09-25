import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Basket, Cloud, Fruit } from './Art.jsx'

const CLOUDS = [
  { id: 'a', kind: 'plum', name: 'Cumulus Plum', left: '4%', top: 34, width: 200, bob: 7 },
  { id: 'b', kind: 'pear', name: 'Lenticular Pear', left: '52%', top: 8, width: 230, bob: 9 },
  { id: 'c', kind: 'fig', name: 'Mammatus Fig', left: '30%', top: 150, width: 180, bob: 6 },
]

const headline = ['Fruit', 'that', 'grows', 'on', 'clouds,', 'picked', 'by', 'kite.']

function HangingFruit({ cloud, basketRef, onPick, setOver }) {
  const [ripe, setRipe] = useState(true)

  const overBasket = (point) => {
    const r = basketRef.current?.getBoundingClientRect()
    if (!r) return false
    const x = point.x - window.scrollX
    const y = point.y - window.scrollY
    return x > r.left - 12 && x < r.right + 12 && y > r.top - 20 && y < r.bottom + 12
  }

  return (
    <div className="hang">
      <span className="stem" aria-hidden="true" />
      <AnimatePresence>
        {ripe && (
          <motion.button
            key="fruit"
            type="button"
            className="hang-fruit"
            aria-label={`${cloud.name}. Drag it into the basket, or press Enter to pick it.`}
            drag
            dragSnapToOrigin
            dragElastic={0.6}
            whileHover={{ rotate: [0, -8, 6, 0], transition: { duration: 0.6 } }}
            whileDrag={{ scale: 1.2, rotate: 8, cursor: 'grabbing', zIndex: 20 }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 260, damping: 14 } }}
            exit={{ scale: 0, opacity: 0, transition: { duration: 0.2 } }}
            onDrag={(_, info) => setOver(overBasket(info.point))}
            onDragEnd={(_, info) => {
              setOver(false)
              if (overBasket(info.point)) pick()
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                pick()
              }
            }}
          >
            <Fruit kind={cloud.kind} size={46} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )

  function pick() {
    setRipe(false)
    onPick(cloud.kind)
    // A new fruit condenses on the same cloud a moment later.
    setTimeout(() => setRipe(true), 2200)
  }
}

export default function Hero() {
  const basketRef = useRef(null)
  const [picked, setPicked] = useState([])
  const [over, setOver] = useState(false)

  return (
    <section className="hero" id="top" aria-labelledby="hero-title">
      <div className="hero-copy">
        <p className="eyebrow">Nimbus Orchard · kite-picked since 1987</p>
        <motion.h1
          id="hero-title"
          className="display"
          initial="hidden"
          animate="shown"
          variants={{ shown: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } } }}
        >
          {headline.map((w, i) => (
            <motion.span
              key={i}
              className={`word${w.startsWith('clouds') ? ' accent' : ''}`}
              variants={{
                hidden: { y: '0.6em', opacity: 0, rotate: 4 },
                shown: { y: 0, opacity: 1, rotate: 0, transition: { type: 'spring', stiffness: 220, damping: 18 } },
              }}
            >
              {w}{' '}
            </motion.span>
          ))}
        </motion.h1>
        <motion.p
          className="lede"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          We grow plums, pears and grapes inside living clouds, from 200 m up to 22,000 m, and bring them down on a
          tether before the weather moves on.
        </motion.p>
        <motion.div
          className="hero-actions"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.5 }}
        >
          <motion.a href="#reserve" className="btn btn-primary" whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}>
            Reserve a crate
          </motion.a>
          <motion.a href="#forecast" className="btn btn-ghost" whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}>
            See this week's sky
          </motion.a>
        </motion.div>
        <dl className="ticker" aria-label="Conditions over the orchard this morning">
          <div><dt>Cover</dt><dd>5 oktas</dd></div>
          <div><dt>Cloud base</dt><dd>1,140 m</dd></div>
          <div><dt>Dew point</dt><dd>11 °C</dd></div>
          <div><dt>Wind</dt><dd>SW 14 km/h</dd></div>
        </dl>
      </div>

      <div className="sky" role="group" aria-label="Try it: pick fruit from the clouds">
        <div className="sun" aria-hidden="true" />
        {CLOUDS.map((c, i) => (
          <motion.div
            key={c.id}
            className="cloud-wrap"
            style={{ left: c.left, top: c.top, width: c.width }}
            initial={{ x: i % 2 ? 40 : -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 + i * 0.15, type: 'spring', stiffness: 60, damping: 16 }}
          >
            <motion.div
              animate={{ y: [0, -c.bob, 0] }}
              transition={{ duration: 5 + i * 1.3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Cloud width={c.width} className="cloud-svg" />
              <HangingFruit
                cloud={c}
                basketRef={basketRef}
                setOver={setOver}
                onPick={(kind) => setPicked((p) => [...p, kind])}
              />
            </motion.div>
          </motion.div>
        ))}

        <motion.div
          ref={basketRef}
          className={`basket${over ? ' is-over' : ''}`}
          animate={{ scale: over ? 1.1 : 1, rotate: over ? -3 : 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 18 }}
        >
          <div className="basket-load" aria-hidden="true">
            <AnimatePresence>
              {picked.slice(-5).map((kind, i) => (
                <motion.span
                  key={picked.length - Math.min(picked.length, 5) + i}
                  initial={{ y: -80, opacity: 0, rotate: -30 }}
                  animate={{ y: 0, opacity: 1, rotate: (i - 2) * 9 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                >
                  <Fruit kind={kind} size={26} />
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
          <Basket size={120} />
          <p className="basket-count" aria-live="polite">
            <motion.span
              key={picked.length}
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="num"
            >
              {picked.length}
            </motion.span>{' '}
            picked
          </p>
        </motion.div>

        <p className="sky-hint">Drag a fruit into the basket</p>
      </div>
    </section>
  )
}
