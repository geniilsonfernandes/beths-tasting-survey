import { useEffect, useState } from 'react'
import { RESULTS_ROUTE } from './data'
import Survey from './Survey'
import Results from './Results'

const isResults = () => window.location.hash === `#/${RESULTS_ROUTE}`

export default function App() {
  const [results, setResults] = useState(isResults)

  useEffect(() => {
    const onHash = () => setResults(isResults())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  return results ? <Results /> : <Survey />
}
