import type { ReactNode } from 'react'

export default function Header({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <header className="bg-beth-yellow px-4 pt-7 pb-16">
      <div className="mx-auto grid max-w-3xl gap-3.5">
        <div className="flex items-center justify-between gap-3">
          <img src="/logo-beths.svg" alt="Beth's" className="h-auto w-32" />
          {action}
        </div>
        <h1 className="m-0 font-display text-[clamp(2rem,6vw,3.1rem)] leading-none font-extrabold tracking-tight uppercase text-balance">
          {title}
        </h1>
        {subtitle && <p className="m-0 text-lg">{subtitle}</p>}
      </div>
    </header>
  )
}

export function HeaderLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} className="rounded-full border-2 border-ink/80 px-4 py-1.5 text-sm font-bold text-ink no-underline transition hover:bg-ink hover:text-beth-yellow focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink">
      {children}
    </a>
  )
}
