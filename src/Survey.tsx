import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AGAIN, FACES, PRODUCTS, RATINGS, RESULTS_ROUTE, type Again, type Product, type RatingKey } from './data'
import { saveResponse } from './storage'
import Header, { HeaderLink } from './Header'

type Answers = { productId: string; otherText: string; again: Again | '' } & Record<RatingKey, number>
type Field = 'product' | RatingKey | 'again'

const EMPTY: Answers = { productId: '', otherText: '', taste: 0, texture: 0, overall: 0, again: '' }
const RESET_SECONDS = 8

export default function Survey() {
  const [answers, setAnswers] = useState<Answers>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({})
  const [saveError, setSaveError] = useState('')
  const [done, setDone] = useState(false)
  const cards = useRef<Partial<Record<Field, HTMLElement | null>>>({})

  const set = <K extends keyof Answers>(k: K, v: Answers[K], field: Field) => {
    setAnswers((a) => ({ ...a, [k]: v }))
    setErrors((e) => ({ ...e, [field]: undefined }))
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const next: Partial<Record<Field, string>> = {}
    if (!answers.productId) next.product = 'Choose the product you tried.'
    else if (answers.productId === 'other' && !answers.otherText.trim()) next.product = 'Write the name of the product you tried.'
    RATINGS.forEach((r) => { if (!answers[r.key]) next[r.key] = 'Choose a score from 1 to 5.' })
    if (!answers.again) next.again = 'Choose one answer.'
    setErrors(next)

    const first = (Object.keys(next) as Field[])[0]
    if (first) { cards.current[first]?.scrollIntoView({ behavior: 'smooth', block: 'center' }); return }

    const product = PRODUCTS.find((p) => p.id === answers.productId)!
    try {
      saveResponse({
        productId: product.id,
        productName: product.other ? answers.otherText.trim() : product.name,
        taste: answers.taste, texture: answers.texture, overall: answers.overall,
        again: answers.again as Again,
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
            <Card error={errors.product} ref={(el) => { cards.current.product = el }}>
              <fieldset className="m-0 min-w-0 border-0 p-0">
                <Legend>Which product did you try?</Legend>
                <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
                  {PRODUCTS.map((p) => (
                    <ProductOption key={p.id} product={p} checked={answers.productId === p.id}
                      onChange={() => set('productId', p.id, 'product')} />
                  ))}
                </div>
                {answers.productId === 'other' && (
                  <div className="mt-3">
                    <label htmlFor="other-text" className="text-sm text-ink-muted">Tell us which product</label>
                    <input id="other-text" autoFocus type="text" maxLength={80} autoComplete="off" placeholder="Product name"
                      value={answers.otherText} onChange={(e) => set('otherText', e.target.value, 'product')}
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
                            onChange={() => set(r.key, f.value, r.key)} className="sr-only" />
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
                <Legend n={4}>Would you choose to eat this product again?</Legend>
                <div className="mt-4 grid gap-2">
                  {AGAIN.map((a) => {
                    const checked = answers.again === a
                    return (
                      <label key={a} className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3.5 font-medium has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink ${checked ? 'border-beth-green bg-beth-green-soft' : 'border-line bg-white hover:border-beth-yellow-deep'}`}>
                        <input type="radio" name="again" value={a} checked={checked}
                          onChange={() => set('again', a, 'again')} className="sr-only" />
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

function ProductOption({ product, checked, onChange }: { product: Product; checked: boolean; onChange: () => void }) {
  const [photoOk, setPhotoOk] = useState(!!product.photo)
  return (
    <label className={`grid h-full cursor-pointer grid-rows-[auto_1fr] overflow-hidden rounded-2xl border-2 bg-white transition has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink ${checked ? 'border-beth-green ring-3 ring-beth-green-soft' : 'border-line hover:border-beth-yellow-deep'}`}>
      <input type="radio" name="product" value={product.id} checked={checked} onChange={onChange} className="sr-only" />
      <span className="photo-placeholder grid aspect-[4/3] place-items-center text-xs tracking-widest text-ink-muted uppercase">
        {photoOk
          ? <img src={product.photo} alt={product.name} onError={() => setPhotoOk(false)} className="size-full object-cover" />
          : <span className="grid justify-items-center gap-1"><CameraIcon />Photo</span>}
      </span>
      <span className="flex items-start gap-2 px-3 pt-2.5 pb-3 leading-tight font-medium">
        <Tick checked={checked} />
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
