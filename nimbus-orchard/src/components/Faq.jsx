import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FAQ } from '../data.js'

export default function Faq() {
  const [open, setOpen] = useState(0)
  return (
    <section className="section" id="questions" aria-labelledby="faq-title">
      <header className="section-head">
        <p className="eyebrow">Before you order</p>
        <h2 id="faq-title" className="display h2">Questions</h2>
      </header>
      <ul className="faq">
        {FAQ.map((f, i) => {
          const isOpen = open === i
          return (
            <li key={f.q} className="faq-item">
              <button
                type="button"
                className="faq-q"
                aria-expanded={isOpen}
                aria-controls={`faq-a-${i}`}
                id={`faq-q-${i}`}
                onClick={() => setOpen(isOpen ? -1 : i)}
              >
                <span>{f.q}</span>
                <motion.span className="faq-icon" animate={{ rotate: isOpen ? 45 : 0 }} aria-hidden="true">
                  +
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    id={`faq-a-${i}`}
                    role="region"
                    aria-labelledby={`faq-q-${i}`}
                    className="faq-a"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 30 }}
                  >
                    <p>{f.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
