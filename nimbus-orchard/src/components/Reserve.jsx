import { useState } from 'react'
import { AnimatePresence, motion, useAnimate } from 'framer-motion'
import { VARIETIES } from '../data.js'
import { Fruit } from './Art.jsx'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Reserve() {
  const [form, setForm] = useState({ name: '', email: '', variety: 'plum' })
  const [crates, setCrates] = useState(1)
  const [errors, setErrors] = useState({})
  const [done, setDone] = useState(null)
  const [scope, animate] = useAnimate()

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = (e) => {
    e.preventDefault()
    const next = {}
    if (!form.name.trim()) next.name = 'Add a name for the crate label.'
    if (!EMAIL.test(form.email)) next.email = 'Enter an email like you@example.com.'
    setErrors(next)
    if (Object.keys(next).length) {
      animate(scope.current, { x: [0, -10, 10, -7, 7, -3, 0] }, { duration: 0.45 })
      return
    }
    setDone({ ...form, crates, fruit: VARIETIES.find((v) => v.id === form.variety) })
  }

  return (
    <section className="section reserve" id="reserve" aria-labelledby="reserve-title">
      <header className="section-head">
        <p className="eyebrow">Picked to order</p>
        <h2 id="reserve-title" className="display h2">Reserve a crate</h2>
        <p className="section-lede">We pick your crate on the next good day for its cloud and lower it straight to the packing shed.</p>
      </header>

      <div className="reserve-card">
        <AnimatePresence mode="wait">
          {!done ? (
            <motion.form
              key="form"
              ref={scope}
              className="form"
              onSubmit={submit}
              noValidate
              exit={{ opacity: 0, y: -12 }}
            >
              <Field id="r-name" label="Name on the crate" error={errors.name}>
                <input id="r-name" value={form.name} onChange={set('name')} autoComplete="name" aria-invalid={!!errors.name} aria-describedby="r-name-err" />
              </Field>
              <Field id="r-email" label="Email for the picking-day alert" error={errors.email}>
                <input id="r-email" type="email" value={form.email} onChange={set('email')} autoComplete="email" aria-invalid={!!errors.email} aria-describedby="r-email-err" />
              </Field>
              <Field id="r-variety" label="Fruit">
                <select id="r-variety" value={form.variety} onChange={set('variety')}>
                  {VARIETIES.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} · {v.altitude.toLocaleString('en-GB')} m
                    </option>
                  ))}
                </select>
              </Field>
              <div className="field">
                <span className="label" id="r-crates-label">Crates</span>
                <div className="stepper" role="group" aria-labelledby="r-crates-label">
                  <motion.button type="button" whileTap={{ scale: 0.85 }} onClick={() => setCrates((c) => Math.max(1, c - 1))} aria-label="One fewer crate" disabled={crates === 1}>−</motion.button>
                  <span className="stepper-value mono" aria-live="polite">
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.span key={crates} initial={{ y: -14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 14, opacity: 0 }}>
                        {crates}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                  <motion.button type="button" whileTap={{ scale: 0.85 }} onClick={() => setCrates((c) => Math.min(6, c + 1))} aria-label="One more crate" disabled={crates === 6}>+</motion.button>
                </div>
              </div>
              <motion.button type="submit" className="btn btn-primary btn-wide" whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}>
                Reserve {crates} {crates === 1 ? 'crate' : 'crates'}
              </motion.button>
            </motion.form>
          ) : (
            <motion.div key="done" className="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="drop" aria-hidden="true">
                <motion.div
                  className="drop-inner"
                  initial={{ y: -140 }}
                  animate={{ y: 0 }}
                  transition={{ duration: 2.4, ease: [0.2, 0.7, 0.3, 1] }}
                >
                  <motion.div
                    animate={{ rotate: [-7, 7, -7] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ originY: 0 }}
                    className="chute"
                  >
                    <svg viewBox="0 0 120 110" width="120">
                      <path d="M10 44 C 10 6, 110 6, 110 44 C 94 36, 76 36, 60 44 C 44 36, 26 36, 10 44 Z" fill="var(--plum)" />
                      <path d="M12 44 L50 86 M60 44 L60 86 M108 44 L70 86" stroke="var(--muted)" strokeWidth="1.2" />
                      <rect x="42" y="84" width="36" height="24" rx="3" fill="var(--wicker)" />
                    </svg>
                    <span className="chute-fruit"><Fruit kind={done.fruit.kind} size={22} /></span>
                  </motion.div>
                </motion.div>
              </div>
              <h3 className="display h3">Crate reserved on this page</h3>
              <p>
                {done.crates} × {done.fruit.name} for {done.name.trim()}. Picking window: {done.fruit.window.toLowerCase()}.
              </p>
              <p className="fine">Nimbus Orchard is imaginary, so nothing was sent and no crate will arrive.</p>
              <button type="button" className="btn btn-ghost" onClick={() => setDone(null)}>
                Reserve another
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}

function Field({ id, label, error, children }) {
  return (
    <div className="field">
      <label className="label" htmlFor={id}>{label}</label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p
            id={`${id}-err`}
            className="error"
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -6, height: 0 }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
