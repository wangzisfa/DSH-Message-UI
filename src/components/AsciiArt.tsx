import { useEffect, useRef } from 'react'
import { mount } from 'ascii.rest'
import { piece, type Surface } from 'ascii.rest/kit'
import type { Facility } from './facilities'

// A rotating wireframe octahedron. This is decoration, never execution progress.
function drawCore(t: number, surface: Surface) {
  const angle = t * .45 + .45
  const vertices = [[0, 1.2, 0], [1, 0, 0], [0, 0, 1], [-1, 0, 0], [0, 0, -1], [0, -1.2, 0]]
  const points = vertices.map(([x, y, z]) => {
    const rx = x * Math.cos(angle) - z * Math.sin(angle)
    const rz = x * Math.sin(angle) + z * Math.cos(angle)
    return [14 + rx * 8, 5 + (y * .92 + rz * .38) * 3.7]
  })
  const edges = [[0, 1], [0, 2], [0, 3], [0, 4], [5, 1], [5, 2], [5, 3], [5, 4], [1, 2], [2, 3], [3, 4], [4, 1]]
  for (const [a, b] of edges) {
    const [ax, ay] = points[a], [bx, by] = points[b]
    const dx = bx - ax, dy = by - ay
    const steps = Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) * 2)
    const char = Math.abs(dy) < .8 ? '-' : Math.abs(dx) < 1.5 ? '|' : dx * dy > 0 ? '\\' : '/'
    for (let s = 0; s <= steps; s++) surface.set(Math.round(ax + dx * s / steps), Math.round(ay + dy * s / steps), char)
  }
  for (const [x, y] of points) surface.set(Math.round(x), Math.round(y), '+')
  surface.set(14, 5, '@')
  for (let i = 0; i < 42; i++) {
    const theta = i * Math.PI * 2 / 42
    surface.set(Math.round(14 + Math.cos(theta) * 13), Math.round(6 + Math.sin(theta) * 3), i % 7 === Math.floor(t * 2) % 7 ? ':' : '.')
  }
  surface.write(5, 11, '.:============:.')
  surface.write(4, 12, '/___[__CORE__]___\\')
}

export function AsciiArt({ facility, active }: { facility: Facility; active: boolean }) {
  const ref = useRef<HTMLPreElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const rows = facility.art.split('\n')
    const core = facility.id === 'hq'
    try {
      const art = piece({ name: `agentarium-${facility.id}`, cols: core ? 29 : Math.max(...rows.map(r => r.length)), rows: core ? 13 : rows.length, fps: active ? 12 : 0 }, (t, surface) => {
        if (core) { drawCore(t, surface); return }
        surface.write(0, 0, facility.art)
        if (!active) return
        const step = Math.floor(t * 3)
        rows.forEach((row, y) => [...row].forEach((char, x) => {
          if (char === '#') surface.set(x, y, ['#', '=', '+', '#'][(step + x + y) % 4])
          if (char === '@') surface.set(x, y, ['@', '*', 'o', '*'][step % 4])
          if (char === '0' || char === '1') surface.set(x, y, (step + x + y) % 3 ? '1' : '0')
          if (char === '~') surface.set(x, y, ['~', '-', '~', '='][(step + x) % 4])
        }))
      })
      return mount(el, art)
    } catch {
      // Keep every facility operable even if the decorative renderer fails.
      el.textContent = facility.art
    }
  }, [facility, active])
  return <span className="ascii-art"><pre ref={ref} aria-hidden="true">{facility.art}</pre><span className="art-scan" aria-hidden="true" /></span>
}
