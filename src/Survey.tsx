import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { AGAIN, FACES, PRODUCTS, RATINGS, RESULTS_ROUTE, type Again, type Product, type RatingKey } from './data'
import { saveResponse } from './storage'
import Header, { HeaderLink } from './Header'

type Answers = { email: string; productIds: string[]; otherText: string; again: Again | '' } & Record<RatingKey, number>
type Field = 'email' | 'product' | RatingKey | 'again'
type Errors = Partial<Record<Field, string>>

const EMPTY: Answers = { email: '', productIds: [], otherText: '', taste: 0, texture: 0, overall: 0, again: '' }
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const EMAIL_DOMAINS = ['gmail.com', 'hotmail.co.uk', 'outlook.com', 'icloud.com']
const RESET_SECONDS = 8

const productById = (id: string) => PRODUCTS.find((p) => p.id === id)!

export default function Survey() {
  const [answers, setAnswers] = useState<Answers>(EMPTY)
  const [errors, setErrors] = useState<Errors>({})
  const [saveError, setSaveError] = useState('')
  const [done, setDone] = useState(false)
  const cards = useRef<Partial<Record<Field, HTMLElement | null>>>({})
  const emailInput = useRef<HTMLInputElement>(null)

  const clearError = (key: Field) => setErrors((e) => ({ ...e, [key]: undefined }))

  const setEmail = (email: string) => { setAnswers((a) => ({ ...a, email })); clearError('email') }
  const setOtherText = (otherText: string) => { setAnswers((a) => ({ ...a, otherText })); clearError('product') }

  const toggleProduct = (id: string) => {
    setAnswers((a) => ({
      ...a,
      productIds: a.productIds.includes(id) ? a.productIds.filter((p) => p !== id) : [...a.productIds, id],
    }))
    clearError('product')
  }

  const rate = <K extends RatingKey | 'again'>(key: K, value: Answers[K]) => {
    setAnswers((a) => ({ ...a, [key]: value }))
    clearError(key)
  }

  // Show domains once typing starts; after "@", narrow to the ones that match
  const typedDomain = answers.email.includes('@') ? answers.email.split('@')[1].trim().toLowerCase() : ''
  const domainSuggestions = answers.email.trim() ? EMAIL_DOMAINS.filter((d) => d.startsWith(typedDomain)) : []

  // Replace whatever follows "@" with the tapped domain, keeping the name part.
  const pickDomain = (domain: string) => {
    const name = answers.email.split('@')[0].trim()
    setEmail(`${name}@${domain}`)
    const input = emailInput.current
    if (!input) return
    input.focus()
    // No name yet: put the cursor before "@" so the person types it next
    requestAnimationFrame(() => input.setSelectionRange(name.length, name.length))
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const next: Errors = {}
    if (!answers.email.trim()) next.email = 'Enter your email.'
    else if (!EMAIL_RE.test(answers.email.trim())) next.email = 'Check your email. It should look like name@example.com.'
    if (!answers.productIds.length) next.product = 'Choose at least one product you tried.'
    else if (answers.productIds.includes('other') && !answers.otherText.trim()) next.product = 'Write the name of the other product you tried.'
    RATINGS.forEach((r) => { if (!answers[r.key]) next[r.key] = 'Choose a score from 1 to 5.' })
    if (!answers.again) next.again = 'Choose one answer.'
    setErrors(next)

    const first = (Object.keys(next) as Field[])[0]
    if (first) { cards.current[first]?.scrollIntoView({ behavior: 'smooth', block: 'center' }); return }

    try {
      saveResponse({
        productIds: answers.productIds,
        productNames: answers.productIds.map((id) => {
          const product = productById(id)
          return product.other ? answers.otherText.trim() : product.name
        }),
        taste: answers.taste, texture: answers.texture, overall: answers.overall,
        again: answers.again as Again,
        email: answers.email.trim().toLowerCase(),
      })
      setSaveError('')
      setDone(true)
      window.scrollTo({ top: 0 })
    } catch {
      setSaveError('Your answers didn’t save. The device storage may be full or blocked. Let a staff member know.')
    }
  }

  const reset = () => {
    setAnswers(EMPTY)
    setErrors({})
    setDone(false)
    window.scrollTo({ top: 0 })
  }

  return (
    <div className="min-h-dvh pb-14">
      <Header title="Product Tasting" subtitle="We’d love to know what you think."
        action={<HeaderLink href={`#/${RESULTS_ROUTE}`}>Results</HeaderLink>} />
      <main className="mx-auto max-w-3xl px-4">
        {done ? <Thanks onRestart={reset} /> : (
          <form onSubmit={submit} noValidate className="-mt-10 grid gap-5">
            <Card error={errors.email} ref={(el) => { cards.current.email = el }}>
              <div className="grid gap-2">
                <label htmlFor="email" className="p-0 font-display text-[1.3rem] leading-snug font-semibold text-balance">
                  What’s your email?
                </label>
                <input id="email" ref={emailInput} name="email" type="text" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false}
                  maxLength={120} placeholder="name@example.com"
                  value={answers.email} onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 w-full rounded-xl border-2 border-line bg-white px-3.5 py-3 text-base outline-none focus:border-beth-green" />
                <AnimatePresence initial={false}>
                  {domainSuggestions.length > 0 && (
                    <motion.div key="domains" aria-label="Email domains"
                      initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                      className="overflow-hidden">
                      <motion.div layout className="flex flex-wrap gap-2 pt-1 pb-0.5">
                        <AnimatePresence mode="popLayout" initial={false}>
                          {domainSuggestions.map((d, i) => {
                            const active = answers.email.trim().toLowerCase().endsWith('@' + d)
                            return (
                              <motion.button key={d} type="button" layout
                                initial={{ opacity: 0, y: 8, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 500, damping: 30, delay: i * 0.04 } }}
                                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.12 } }}
                                whileTap={{ scale: 0.94 }}
                                onPointerDown={(e) => e.preventDefault()} onClick={() => pickDomain(d)}
                                className={`cursor-pointer rounded-full border-2 px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink ${active ? 'border-beth-green bg-beth-green-soft text-beth-green' : 'border-line bg-white hover:border-beth-yellow-deep'}`}>
                                @{d}
                              </motion.button>
                            )
                          })}
                        </AnimatePresence>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Card>

            <Card error={errors.product} ref={(el) => { cards.current.product = el }}>
              <fieldset className="m-0 min-w-0 border-0 p-0">
                <Legend>Which products did you try?</Legend>
                <p className="m-0 mt-1 text-ink-muted">Choose all that apply.</p>
                <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
                  {PRODUCTS.map((p) => (
                    <ProductOption key={p.id} product={p} checked={answers.productIds.includes(p.id)}
                      onChange={() => toggleProduct(p.id)} />
                  ))}
                </div>
                {answers.productIds.includes('other') && (
                  <div className="mt-3">
                    <label htmlFor="other-text" className="text-sm text-ink-muted">Tell us which other product</label>
                    <input id="other-text" autoFocus type="text" maxLength={80} autoComplete="off" placeholder="Product name"
                      value={answers.otherText} onChange={(e) => setOtherText(e.target.value)}
                      className="mt-1 w-full rounded-xl border-2 border-line bg-white px-3.5 py-3 text-base outline-none focus:border-beth-green" />
                  </div>
                )}
              </fieldset>
            </Card>

            {RATINGS.map((r) => (
              <Card key={r.key} error={errors[r.key]} ref={(el) => { cards.current[r.key] = el }}>
                <fieldset className="m-0 min-w-0 border-0 p-0">
                  <Legend n={r.n}>{r.question}</Legend>
                  <div className="mt-4 grid grid-cols-5 gap-1.5 sm:gap-2">
                    {FACES.map((f) => {
                      const checked = answers[r.key] === f.value
                      return (
                        <label key={f.value} className={`grid cursor-pointer justify-items-center gap-0.5 rounded-xl border-2 px-1 pt-3 pb-2.5 transition has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink sm:rounded-2xl ${checked ? '-translate-y-0.5 border-ink bg-beth-yellow' : 'border-line bg-white hover:border-beth-yellow-deep'}`}>
                          <input type="radio" name={r.key} value={f.value} checked={checked}
                            onChange={() => rate(r.key, f.value)} className="sr-only" />
                          <span aria-hidden="true" className="text-[clamp(1.7rem,7vw,2.4rem)] leading-tight">{f.emoji}</span>
                          <span className="font-bold tabular-nums">{f.value}</span>
                        </label>
                      )
                    })}
                  </div>
                  <div aria-hidden="true" className="mt-1.5 flex justify-between text-[0.82rem] text-ink-muted">
                    <span>Didn’t like it</span><span>Loved it</span>
                  </div>
                </fieldset>
              </Card>
            ))}

            <Card error={errors.again} ref={(el) => { cards.current.again = el }}>
              <fieldset className="m-0 min-w-0 border-0 p-0">
                <Legend n={4}>Would you choose to eat {answers.productIds.length > 1 ? 'these products' : 'this product'} again?</Legend>
                <div className="mt-4 grid gap-2">
                  {AGAIN.map((a) => {
                    const checked = answers.again === a
                    return (
                      <label key={a} className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3.5 font-medium has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink ${checked ? 'border-beth-green bg-beth-green-soft' : 'border-line bg-white hover:border-beth-yellow-deep'}`}>
                        <input type="radio" name="again" value={a} checked={checked}
                          onChange={() => rate('again', a)} className="sr-only" />
                        <Tick checked={checked} />{a}
                      </label>
                    )
                  })}
                </div>
              </fieldset>
            </Card>

            <div className="grid gap-2.5">
              {saveError && <p className="m-0 rounded-xl bg-beth-red-soft px-4 py-3 font-medium text-beth-red">{saveError}</p>}
              <button type="submit" className="cursor-pointer rounded-full bg-beth-yellow px-7 py-4.5 font-display text-lg font-extrabold tracking-wide uppercase shadow-[0_3px_0_var(--color-beth-yellow-deep)] transition hover:-translate-y-px active:translate-y-0.5 active:shadow-[0_1px_0_var(--color-beth-yellow-deep)] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ink">
                Send my answers
              </button>
              <p className="m-0 mx-auto max-w-[52ch] text-center text-sm leading-relaxed text-ink-muted">
                We’ll use your email only to follow up about this tasting. We won’t share it or add you to marketing emails.
                To have your data deleted, email <span className="font-semibold text-ink select-all">hello@beths.uk</span>.
              </p>
            </div>
          </form>
        )}
      </main>
    </div>
  )
}

function Card({ error, children, ref }: { error?: string; children: ReactNode; ref?: React.Ref<HTMLElement> }) {
  return (
    <section ref={ref} className={`grid gap-4 rounded-2xl border bg-white p-5 sm:p-6 ${error ? 'border-beth-red ring-3 ring-beth-red-soft' : 'border-line'}`}>
      {children}
      {error && <p className="m-0 text-[0.95rem] font-medium text-beth-red">{error}</p>}
    </section>
  )
}

function Legend({ n, children }: { n?: number; children: ReactNode }) {
  return (
    <legend className="p-0 font-display text-[1.3rem] leading-snug font-semibold text-balance">
      {n && <span className="mr-2.5 inline-grid size-[1.8em] place-items-center rounded-full bg-beth-yellow align-[0.1em] text-[0.8em] font-extrabold">{n}</span>}
      {children}
    </legend>
  )
}

function Tick({ checked }: { checked: boolean }) {
  return (
    <span aria-hidden="true" className={`mt-px grid size-5 flex-none place-items-center rounded-full border-2 ${checked ? 'border-beth-green bg-beth-green' : 'border-line'}`}>
      <span className={`size-2 rounded-full ${checked ? 'bg-white' : ''}`} />
    </span>
  )
}

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span aria-hidden="true" className={`mt-px grid size-5 flex-none place-items-center rounded-md border-2 ${checked ? 'border-beth-green bg-beth-green' : 'border-line bg-white'}`}>
      {checked && (
        <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
      )}
    </span>
  )
}

function ProductOption({ product, checked, onChange }: { product: Product; checked: boolean; onChange: () => void }) {
  const [photoOk, setPhotoOk] = useState(!!product.photo)
  return (
    <label className={`grid h-full cursor-pointer grid-rows-[auto_1fr] overflow-hidden rounded-2xl border-2 bg-white transition has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink ${checked ? 'border-beth-green ring-3 ring-beth-green-soft' : 'border-line hover:border-beth-yellow-deep'}`}>
      <input type="checkbox" name="products" value={product.id} checked={checked} onChange={onChange} className="sr-only" />
      <span className="photo-placeholder relative grid aspect-[4/3] place-items-center overflow-hidden text-xs tracking-widest text-ink-muted uppercase">
        {photoOk
          ? <img src={product.photo} alt={product.name} onError={() => setPhotoOk(false)} className={product.other ? 'absolute inset-0 size-full bg-beth-yellow object-contain p-[18%]' : 'absolute inset-0 size-full object-cover'} />
          : <span className="grid justify-items-center gap-1"><CameraIcon />Photo</span>}
      </span>
      <span className="flex items-start gap-2 px-3 pt-2.5 pb-3 leading-tight font-medium">
        <Checkbox checked={checked} />
        <span>{product.name}{product.sub && <span className="block text-sm font-normal text-ink-muted">{product.sub}</span>}</span>
      </span>
    </label>
  )
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 8h3l2-2.5h6L17 8h3v11H4z" /><circle cx="12" cy="13" r="3.5" />
    </svg>
  )
}

function Thanks({ onRestart }: { onRestart: () => void }) {
  const [left, setLeft] = useState(RESET_SECONDS)
  useEffect(() => {
    if (left <= 0) { onRestart(); return }
    const t = setTimeout(() => setLeft((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [left, onRestart])

  return (
    <section aria-live="polite" className="-mt-10 grid justify-items-center gap-3.5 rounded-2xl border border-line bg-white px-6 py-12 text-center">
      <div aria-hidden="true" className="grid size-18 place-items-center rounded-full bg-beth-green">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
      </div>
      <h2 className="m-0 font-display text-3xl font-extrabold text-beth-green">Thank you!</h2>
      <p className="m-0 max-w-[40ch] text-ink/75">Your answers were saved. Enjoy the rest of the tasting.</p>
      <button type="button" onClick={onRestart} className="cursor-pointer rounded-full bg-beth-yellow px-7 py-4 font-display text-lg font-extrabold tracking-wide uppercase shadow-[0_3px_0_var(--color-beth-yellow-deep)] active:translate-y-0.5">
        Start a new response
      </button>
      <span className="text-sm text-ink-muted tabular-nums">New response in {left}s</span>
    </section>
  )
}
