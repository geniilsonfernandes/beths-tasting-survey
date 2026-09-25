import { useEffect, useMemo, useState } from 'react'
import { PRODUCTS, RATINGS, type RatingKey } from './data'
import { clearResponses, loadResponses, toCsv, type Response } from './storage'
import Header, { HeaderLink } from './Header'

export default function Results() {
  const [rows, setRows] = useState<Response[]>(loadResponses)
  const [confirmClear, setConfirmClear] = useState(false)

  // Pick up responses saved in another tab on this device
  useEffect(() => {
    const onStorage = () => setRows(loadResponses())
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const groups = useMemo(() => {
    const byName = new Map<string, Response[]>()
    PRODUCTS.filter((p) => !p.other).forEach((p) => byName.set(p.name, []))
    rows.forEach((r) => byName.set(r.productName, [...(byName.get(r.productName) ?? []), r]))
    return [...byName.entries()]
  }, [rows])

  const exportCsv = () => {
    const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `beths-tasting-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const clearAll = () => { clearResponses(); setRows([]); setConfirmClear(false) }

  return (
    <div className="min-h-dvh pb-14">
      <Header title="Tasting Results" action={<HeaderLink href="#/">Back to survey</HeaderLink>} />
      <main className="mx-auto -mt-10 grid max-w-3xl gap-4 px-4">
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white p-5">
          <div>
            <div className="text-xs font-bold tracking-widest text-ink-muted uppercase">Responses on this device</div>
            <div className="font-display text-4xl font-extrabold tabular-nums">{rows.length}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={exportCsv} disabled={!rows.length}
              className="cursor-pointer rounded-full bg-beth-yellow px-5 py-2.5 font-bold disabled:cursor-default disabled:opacity-50">
              Export CSV
            </button>
            <button type="button" onClick={() => setConfirmClear(true)} disabled={!rows.length}
              className="cursor-pointer rounded-full border-2 border-beth-red px-5 py-2 font-bold text-beth-red disabled:cursor-default disabled:opacity-40">
              Clear all
            </button>
          </div>
          {confirmClear && (
            <div className="flex w-full flex-wrap items-center gap-3 rounded-xl bg-beth-red-soft px-4 py-3 text-beth-red">
              <span className="flex-1 font-medium">Delete all {rows.length} responses from this device? Export the CSV first if you need them.</span>
              <button type="button" onClick={() => setConfirmClear(false)} className="cursor-pointer font-bold text-ink">Cancel</button>
              <button type="button" onClick={clearAll} className="cursor-pointer rounded-full bg-beth-red px-4 py-2 font-bold text-white">Delete</button>
            </div>
          )}
        </section>

        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full min-w-[560px] border-collapse tabular-nums">
            <thead>
              <tr className="text-left text-xs tracking-wider text-ink-muted uppercase">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3 text-right">Responses</th>
                {RATINGS.map((r) => <th key={r.key} className="px-4 py-3 text-right">{r.label}</th>)}
                <th className="px-4 py-3 text-right">Would eat again</th>
              </tr>
            </thead>
            <tbody>
              {groups.map(([name, list]) => (
                <tr key={name} className="border-t border-line">
                  <td className="px-4 py-3 font-medium">{name}</td>
                  <td className="px-4 py-3 text-right">{list.length}</td>
                  {RATINGS.map((r) => <td key={r.key} className="px-4 py-3 text-right"><Score list={list} k={r.key} /></td>)}
                  <td className="px-4 py-3 text-right">
                    {list.length ? `${Math.round((list.filter((x) => x.again === 'Definitely' || x.again === 'Probably').length / list.length) * 100)}%` : <span className="text-ink-muted">–</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="m-0 text-sm text-ink-muted">Scores are averages on the 1–5 scale. “Would eat again” counts Definitely + Probably.</p>

        {rows.length > 0 && (
          <section className="grid gap-2">
            <h2 className="m-0 font-display text-xl font-bold">Latest responses</h2>
            <ul className="m-0 grid list-none gap-2 p-0">
              {[...rows].reverse().slice(0, 20).map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-line bg-white px-4 py-3 text-sm">
                  <span className="min-w-[10rem] flex-1 font-medium">
                    {r.productName}
                    {r.email && <span className="block font-normal text-ink-muted">{r.email}</span>}
                  </span>
                  <span className="tabular-nums">Taste {r.taste} · Texture {r.texture} · Overall {r.overall}</span>
                  <span className="text-ink-muted">{r.again}</span>
                  <span className="text-ink-muted tabular-nums">{new Date(r.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  )
}

function Score({ list, k }: { list: Response[]; k: RatingKey }) {
  if (!list.length) return <span className="text-ink-muted">–</span>
  const avg = list.reduce((s, r) => s + r[k], 0) / list.length
  return (
    <span className="inline-flex items-center justify-end gap-2">
      {avg.toFixed(1)}
      <span className="inline-block h-1.5 rounded-full bg-beth-yellow" style={{ width: `${(avg / 5) * 36}px` }} />
    </span>
  )
}
