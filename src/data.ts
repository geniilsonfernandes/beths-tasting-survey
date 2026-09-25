// Product photos: drop a file in public/products/ named after the product id
// (e.g. public/products/churros.webp). Missing photos show a placeholder.
export type Product = { id: string; name: string; sub?: string; photo?: string; other?: boolean }

export const PRODUCTS: Product[] = [
  { id: 'chicken-croquette', name: 'Chicken Croquette', photo: '/products/chicken-croquette.webp' },
  { id: 'four-cheese-balls', name: 'Four Cheese Balls', photo: '/products/four-cheese-balls.webp' },
  { id: 'sausage-roll', name: 'Sausage Roll', photo: '/products/sausage-roll.webp' },
  { id: 'churros', name: 'Churros', photo: '/products/churros.webp' },
  { id: 'cheese-bread', name: 'Cheese Bread', photo: '/products/cheese-bread.webp' },
  { id: 'cheese-bread-chocolate', name: 'Cheese Bread with Chocolate', photo: '/products/cheese-bread-chocolate.webp' },
  { id: 'kibe', name: 'Kibe', sub: 'Beef & Bulgur Croquette', photo: '/products/kibe.webp' },
  { id: 'vegan-kibe', name: 'Vegan Kibe', sub: 'Vegan Beef & Bulgur Croquette', photo: '/products/vegan-kibe.webp' },
  { id: 'other', name: 'Other', sub: 'Something else', photo: '/logo-beths.svg', other: true },
]

export const FACES = [
  { emoji: '😞', value: 1 },
  { emoji: '🙁', value: 2 },
  { emoji: '😐', value: 3 },
  { emoji: '🙂', value: 4 },
  { emoji: '😍', value: 5 },
]

export type RatingKey = 'taste' | 'texture' | 'overall'

export const RATINGS: { key: RatingKey; n: number; label: string; question: string }[] = [
  { key: 'taste', n: 1, label: 'Taste', question: 'How much did you like the taste?' },
  { key: 'texture', n: 2, label: 'Texture', question: 'How much did you like the texture?' },
  { key: 'overall', n: 3, label: 'Overall', question: 'Overall, how much did you like the product?' },
]

export const AGAIN = ['Definitely', 'Probably', 'Maybe', 'Probably not', 'Definitely not'] as const
export type Again = (typeof AGAIN)[number]

// The results page lives at /#/<RESULTS_ROUTE>. It is not linked anywhere.
// Override with VITE_RESULTS_ROUTE in .env.local.
export const RESULTS_ROUTE = import.meta.env.VITE_RESULTS_ROUTE || 'bths-results-7k2'
