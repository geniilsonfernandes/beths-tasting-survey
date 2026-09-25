import type { Again, RatingKey } from './data'

// One response can cover several products; the ratings apply to all of them.
export type Response = {
  id: string
  submittedAt: string
  productIds: string[]
  productNames: string[]
  again: Again
  email: string
} & Record<RatingKey, number>

// Responses are kept on this device (same approach as spin-to-win).
// Export them as CSV from the results page after the event.
const KEY = 'beths-tasting-responses'

type StoredResponse = Response & { productId?: string; productName?: string }

export function loadResponses(): Response[] {
  try {
    const rows: StoredResponse[] = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    // Responses saved before multi-select had a single product
    return rows.map((r) => r.productNames ? r : { ...r, productIds: [r.productId!], productNames: [r.productName!] })
  } catch { return [] }
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
  const header = ['submitted_at', 'email', 'products', 'taste', 'texture', 'overall', 'would_eat_again']
  return [header.join(','), ...rows.map((r) =>
    [r.submittedAt, r.email, r.productNames.join('; '), r.taste, r.texture, r.overall, r.again].map(q).join(','))].join('\n')
}
