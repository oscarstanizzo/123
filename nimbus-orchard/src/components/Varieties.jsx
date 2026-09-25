import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { TIERS, VARIETIES } from '../data.js'
import { Fruit } from './Art.jsx'
import { img } from '../images.js'

const fmt = (n) => n.toLocaleString('en-GB')

export default function Varieties() {
  const [tier, setTier] = useState('all')
  const [openId, setOpenId] = useState(null)
  const shown = VARIETIES.filter((v) => tier === 'all' || v.tier === tier)
  const open = VARIETIES.find((v) => v.id === openId)

  return (
    <section className="section" id="varieties" aria-labelledby="varieties-title">
      <header className="section-head">
        <p className="eyebrow">Six crops, three cloud tiers</p>
        <h2 id="varieties-title" className="display h2">What grows up there</h2>
        <p className="section-lede">
          Each fruit belongs to one kind of cloud. Filter by height, then open a card for its harvest window and
          yearly yield.
        </p>
      </header>

      <div className="tabs" role="tablist" aria-label="Filter by cloud tier">
        {TIERS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tier === t.id}
            className={`tab${tier === t.id ? ' is-active' : ''}`}
            onClick={() => setTier(t.id)}
          >
            {tier === t.id && (
              <motion.span layoutId="tier-pill" className="tab-pill" transition={{ type: 'spring', stiffness: 420, damping: 32 }} />
            )}
            <span className="tab-label">{t.label}</span>
            {t.range && <span className="tab-range">{t.range}</span>}
          </button>
        ))}
      </div>

      <motion.ul className="variety-grid" layout>
        <AnimatePresence mode="popLayout">
          {shown.map((v) => (
            <motion.li
              key={v.id}
              layout
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            >
              <motion.button
                type="button"
                layoutId={`card-${v.id}`}
                className="variety-card"
                onClick={() => setOpenId(v.id)}
                whileHover="hover"
                whileTap={{ scale: 0.98 }}
                aria-haspopup="dialog"
              >
                {img(v.id) ? (
                  <span className="variety-photo">
                    <motion.img
                      src={img(v.id)}
                      alt=""
                      variants={{ hover: { scale: 1.07, y: -4 } }}
                      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    />
                  </span>
                ) : (
                  <motion.span
                    className="variety-art"
                    variants={{ hover: { y: -6, rotate: -8 } }}
                    transition={{ type: 'spring', stiffness: 300, damping: 12 }}
                  >
                    <Fruit kind={v.kind} size={58} />
                  </motion.span>
                )}
                <span className="variety-alt mono">{fmt(v.altitude)} m</span>
                <span className="variety-name">{v.name}</span>
                <span className="variety-cloud">{v.cloud}</span>
                <span className="variety-taste">{v.taste}</span>
                <motion.span className="variety-more" variants={{ hover: { x: 4 } }}>
                  Harvest details →
                </motion.span>
              </motion.button>
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>

      <AnimatePresence>{open && <Detail v={open} onClose={() => setOpenId(null)} />}</AnimatePresence>
    </section>
  )
}

function Detail({ v, onClose }) {
  const closeRef = useRef(null)
  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-layer">
      <motion.div
        className="modal-backdrop"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      <motion.div
        layoutId={`card-${v.id}`}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`detail-${v.id}`}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      >
        <motion.div
          className="modal-body"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: 0.12 } }}
          exit={{ opacity: 0, transition: { duration: 0.08 } }}
        >
          {img(v.id) && (
            <motion.img
              src={img(v.id)}
              alt={`Illustration of ${v.name} hanging from ${v.cloud}`}
              className="modal-photo"
              initial={{ scale: 1.12 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
            />
          )}
          <div className="modal-top">
            <motion.span
              initial={{ rotate: -20, scale: 0.6 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 10, delay: 0.1 }}
            >
              <Fruit kind={v.kind} size={84} label={v.name} />
            </motion.span>
            <div>
              <p className="variety-alt mono">{fmt(v.altitude)} m · {v.tier} tier</p>
              <h3 id={`detail-${v.id}`} className="display h3">{v.name}</h3>
              <p className="variety-cloud">{v.cloud}</p>
            </div>
          </div>
          <p className="modal-note">{v.note}</p>
          <dl className="facts">
            <div><dt>Taste</dt><dd>{v.taste}</dd></div>
            <div><dt>Harvest window</dt><dd>{v.window}</dd></div>
            <div><dt>Sweetness</dt><dd className="mono">{v.brix} °Bx</dd></div>
            <div><dt>Crates a year</dt><dd className="mono">{fmt(v.crates)}</dd></div>
          </dl>
          <button ref={closeRef} type="button" className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
        </motion.div>
      </motion.div>
    </div>
  )
}
