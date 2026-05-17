'use client'

import { useEffect, useRef, useId } from 'react'

export default function MermaidDiagram({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const id = useId().replace(/:/g, '')

  useEffect(() => {
    let cancelled = false
    import('mermaid').then((mod) => {
      if (cancelled) return
      const mermaid = mod.default
      mermaid.initialize({
        startOnLoad: false,
        theme: 'dark',
        er: { layoutDirection: 'TB' },
      })
      mermaid.render(`mermaid-${id}`, chart).then(({ svg }) => {
        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg
        }
      })
    })
    return () => { cancelled = true }
  }, [chart, id])

  return (
    <div
      ref={ref}
      className="w-full overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm [&_svg]:mx-auto"
    />
  )
}
