import type { Again, RatingKey } from './data'

export type Response = {
  id: string
  submittedAt: string
  productId: string
  productName: string
  again: Again
} & Record<RatingKey, number>

// Responses are kept on this device (same approach as spin-to-win).
// Export them as CSV from the results page after the event.
const KEY = 'beths-tasting-responses'

export function loadResponses(): Response[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') } catch { return [] }
}

export function saveResponse(r: Omit<Response, 'id' | 'submittedAt'>): Response {
  const full: Response = { ...r, id: crypto.randomUUID(), submittedAt: new Date().toISOString() }
  localStorage.setItem(KEY, JSON.stringify([...loadResponses(), full]))
  return full
}

export function clearResponses() {
  try { localStorage.removeItem(KEY) } catch { /* ignore */ }
}

export function toCsv(rows: Response[]): string {
  const q = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const header = ['submitted_at', 'product', 'taste', 'texture', 'overall', 'would_eat_again']
  return [header.join(','), ...rows.map((r) =>
    [r.submittedAt, r.productName, r.taste, r.texture, r.overall, r.again].map(q).join(','))].join('\n')
}
