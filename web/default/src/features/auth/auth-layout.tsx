/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@/context/theme-provider'
import { useNotifications } from '@/hooks/use-notifications'
import { LanguageSwitcher } from '@/components/language-switcher'
import { NotificationPopover } from '@/components/notification-popover'
import { ThemeSwitch } from '@/components/theme-switch'

type AuthLayoutProps = {
  children: React.ReactNode
}

type BrandIntroProps = {
  isDark: boolean
  compact?: boolean
  chipStyle: React.CSSProperties
}

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  alpha: number
  pulse: number
  depth: number
  color: [number, number, number]
}

type GlobeNode = {
  lat: number
  lng: number
}

function GlobeCanvas({ tone }: { tone: 'light' | 'dark' }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const isDark = tone === 'dark'
    const colors = {
      globeStart: isDark ? 'rgba(255,255,255,0.105)' : 'rgba(219,234,254,0.48)',
      globeEnd: isDark ? 'rgba(255,255,255,0.018)' : 'rgba(191,219,254,0.16)',
      globeStroke: isDark ? 'rgba(226,232,240,0.28)' : 'rgba(147,197,253,0.58)',
      grid: isDark ? 'rgba(226,232,240,0.10)' : 'rgba(147,197,253,0.28)',
      meridian: isDark ? 'rgba(226,232,240,0.075)' : 'rgba(147,197,253,0.20)',
      dot: isDark ? [226, 232, 240] : [96, 165, 250],
      dotBase: isDark ? 0.22 : 0.2,
      dotBoost: isDark ? 0.46 : 0.48,
      arc: isDark ? 'rgba(226,232,240,0.50)' : 'rgba(79,70,229,0.58)',
      arcSoft: isDark ? 'rgba(34,211,238,0.18)' : 'rgba(56,189,248,0.22)',
      node: isDark ? [248, 250, 252] : [99, 102, 241],
      halo: isDark ? 'rgba(34,211,238,0.10)' : 'rgba(99,102,241,0.10)',
      ring: isDark ? [252, 211, 133] : [99, 102, 241],
      ringHot: isDark ? [255, 247, 209] : [125, 211, 252],
      ringGlow: isDark ? 'rgba(252,211,133,0.52)' : 'rgba(99,102,241,0.34)',
    }

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 1.25)
      canvas.width = canvas.offsetWidth * ratio
      canvas.height = canvas.offsetHeight * ratio
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const W = () => canvas.offsetWidth
    const H = () => canvas.offsetHeight
    const R = () => Math.min(W(), H()) * 0.46
    const globeMotionTilt = -0.24
    const ringMotionTilt = -0.33

    const DOTS: { lat: number; lng: number }[] = []
    for (let lat = -80; lat <= 80; lat += 8) {
      const r = Math.cos((lat * Math.PI) / 180)
      const count = Math.max(1, Math.round(r * 30))
      for (let i = 0; i < count; i++) {
        DOTS.push({ lat, lng: (i / count) * 360 })
      }
    }

    const NODES: GlobeNode[] = [
      { lat: 40, lng: -74 },
      { lat: 51, lng: 0 },
      { lat: 35, lng: 139 },
      { lat: 31, lng: 121 },
      { lat: 37, lng: -122 },
      { lat: 1, lng: 103 },
      { lat: -33, lng: 151 },
      { lat: 48, lng: 2 },
      { lat: 52, lng: 13 },
      { lat: 25, lng: 55 },
      { lat: 19, lng: 72 },
      { lat: 37, lng: 127 },
      { lat: 22, lng: 114 },
      { lat: 25, lng: 121 },
      { lat: 13, lng: 100 },
      { lat: -6, lng: 106 },
      { lat: 49, lng: -123 },
      { lat: 43, lng: -79 },
      { lat: 34, lng: -118 },
      { lat: 19, lng: -99 },
      { lat: -23, lng: -46 },
      { lat: -34, lng: -58 },
      { lat: 59, lng: 18 },
      { lat: 41, lng: 29 },
    ]
    const ARCS: [number, number][] = [
      [0, 1],
      [0, 4],
      [1, 7],
      [2, 3],
      [3, 5],
      [4, 5],
      [6, 2],
      [7, 3],
      [1, 8],
      [8, 15],
      [15, 9],
      [9, 2],
      [2, 11],
      [11, 3],
      [3, 12],
      [12, 5],
      [5, 14],
      [14, 7],
      [4, 16],
      [16, 10],
      [10, 0],
      [0, 17],
      [17, 18],
      [18, 19],
      [19, 6],
      [7, 23],
    ]
    const arcProgress = ARCS.map(() => Math.random())
    const ringParticleCount = 760
    const ringParticles = Array.from({ length: ringParticleCount }, (_, index) => ({
      angle: (index / ringParticleCount) * Math.PI * 2,
      lane: (Math.random() - 0.5) * 2.7,
      size: 0.9 + Math.random() * 2.05,
      alpha: 0.42 + Math.random() * 0.7,
      drift: 0.55 + Math.random() * 0.85,
      twinkle: Math.random() * Math.PI * 2,
      hot: index % 14 === 0,
    }))

    function project(lat: number, lng: number, rot: number) {
      const phi = (lat * Math.PI) / 180
      const theta = ((lng + rot) * Math.PI) / 180
      return {
        x: Math.cos(phi) * Math.sin(theta),
        y: Math.sin(phi),
        z: Math.cos(phi) * Math.cos(theta),
      }
    }
    function toScreen(p: { x: number; y: number; z: number }) {
      const cosTilt = Math.cos(globeMotionTilt)
      const sinTilt = Math.sin(globeMotionTilt)
      const px = p.x * R()
      const py = -p.y * R()
      return {
        sx: W() / 2 + px * cosTilt - py * sinTilt,
        sy: H() / 2 + px * sinTilt + py * cosTilt,
        visible: p.z > -0.15,
        b: (p.z + 1) / 2,
      }
    }
    function arcPt(
      la1: number,
      lo1: number,
      la2: number,
      lo2: number,
      f: number,
      rot: number
    ) {
      const p1 = project(la1, lo1, rot),
        p2 = project(la2, lo2, rot)
      const dot = p1.x * p2.x + p1.y * p2.y + p1.z * p2.z
      const omega = Math.acos(Math.min(1, Math.max(-1, dot)))
      if (Math.abs(omega) < 0.001) return p1
      const s = Math.sin(omega)
      const f1 = Math.sin((1 - f) * omega) / s,
        f2 = Math.sin(f * omega) / s
      return {
        x: f1 * p1.x + f2 * p2.x,
        y: f1 * p1.y + f2 * p2.y,
        z: f1 * p1.z + f2 * p2.z,
      }
    }

    function drawRingLayer(layer: 'back' | 'front') {
      const radius = R()
      const tilt = ringMotionTilt
      const cosTilt = Math.cos(tilt)
      const sinTilt = Math.sin(tilt)
      const spin = -t * 0.0028
      const cx = W() / 2
      const cy = H() / 2

      ctx.save()
      ctx.globalCompositeOperation = 'lighter'

      for (const particle of ringParticles) {
        const phase = particle.angle + spin * particle.drift
        const depth = Math.sin(phase)
        if (layer === 'back' ? depth > 0.34 : depth <= -0.08) continue

        const laneOffset = particle.lane * radius * 0.24
        const major = radius * 1.76 + laneOffset
        const minor = radius * 0.5 + particle.lane * radius * 0.068
        const localX = Math.cos(phase) * major
        const localY = Math.sin(phase) * minor
        const x = cx + localX * cosTilt - localY * sinTilt
        const y = cy + localX * sinTilt + localY * cosTilt
        const pulse = 0.66 + Math.sin(t * 0.035 + particle.twinkle) * 0.34
        const rightSweepBoost =
          localX > radius * 0.2 && localY < radius * 0.3 ? 1.72 : 1
        const depthBoost =
          layer === 'front' ? 1.3 + depth * 0.4 : 0.88 * rightSweepBoost
        const opacity = particle.alpha * pulse * depthBoost
        const color = particle.hot ? colors.ringHot : colors.ring
        const size = particle.size * (layer === 'front' ? 1.16 : 0.92)

        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${color.join(',')},${Math.min(0.96, opacity)})`
        if (particle.hot) {
          ctx.shadowColor = `rgba(${colors.ringHot.join(',')},${layer === 'front' ? 0.64 : 0.44})`
          ctx.shadowBlur = size * (layer === 'front' ? 6 : 4)
        }
        ctx.fill()
        ctx.shadowBlur = 0
      }

      ctx.restore()
    }

    let rot = 0,
      t = 0

    function draw() {
      ctx.clearRect(0, 0, W(), H())
      const cx = W() / 2,
        cy = H() / 2

      drawRingLayer('back')

      const fill = ctx.createRadialGradient(
        cx - R() * 0.2,
        cy - R() * 0.2,
        0,
        cx,
        cy,
        R()
      )
      fill.addColorStop(0, colors.globeStart)
      fill.addColorStop(1, colors.globeEnd)
      ctx.beginPath()
      ctx.arc(cx, cy, R(), 0, Math.PI * 2)
      ctx.fillStyle = fill
      ctx.fill()
      const halo = ctx.createRadialGradient(cx, cy, R() * 0.42, cx, cy, R() * 1.28)
      halo.addColorStop(0, colors.halo)
      halo.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = halo
      ctx.fillRect(cx - R() * 1.35, cy - R() * 1.35, R() * 2.7, R() * 2.7)
      ctx.beginPath()
      ctx.arc(cx, cy, R(), 0, Math.PI * 2)
      ctx.strokeStyle = colors.globeStroke
      ctx.lineWidth = 1
      ctx.stroke()
      ;[-60, -30, 0, 30, 60].forEach((lat) => {
        const phi = (lat * Math.PI) / 180
        const ry = Math.cos(phi) * R(),
          oy = Math.sin(phi) * R()
        ctx.beginPath()
        ctx.ellipse(cx, cy - oy, ry, ry * 0.14, 0, 0, Math.PI * 2)
        ctx.strokeStyle = colors.grid
        ctx.lineWidth = 0.5
        ctx.stroke()
      })

      for (let lng = 0; lng < 180; lng += 30) {
        const theta = ((lng + rot) * Math.PI) / 180
        ctx.save()
        ctx.translate(cx, cy)
        ctx.rotate(theta)
        ctx.beginPath()
        ctx.ellipse(0, 0, R() * 0.14, R(), 0, 0, Math.PI * 2)
        ctx.strokeStyle = colors.meridian
        ctx.lineWidth = 0.5
        ctx.stroke()
        ctx.restore()
      }

      DOTS.forEach(({ lat, lng }) => {
        const p = project(lat, lng, rot)
        const s = toScreen(p)
        if (!s.visible) return
        ctx.beginPath()
        ctx.arc(s.sx, s.sy, 0.9 + s.b * 0.8, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${colors.dot.join(',')},${colors.dotBase + s.b * colors.dotBoost})`
        ctx.fill()
      })

      ARCS.forEach(([a, b], i) => {
        arcProgress[i] = (arcProgress[i] + 0.0025) % 1
        const n1 = NODES[a],
          n2 = NODES[b]
        const prog = arcProgress[i],
          trail = 0.22
        const start = Math.max(0, prog - trail)
        ctx.beginPath()
        let first = true
        for (let s = 0; s <= 50; s++) {
          const f = start + (s / 50) * (prog - start)
          if (f < 0 || f > 1) continue
          const ap = arcPt(n1.lat, n1.lng, n2.lat, n2.lng, f, rot)
          const sc = toScreen(ap)
          if (!sc.visible) {
            first = true
            continue
          }
          if (first) {
            ctx.moveTo(sc.sx, sc.sy)
            first = false
          } else ctx.lineTo(sc.sx, sc.sy)
        }
        ctx.strokeStyle = colors.arcSoft
        ctx.lineWidth = 2.4
        ctx.shadowColor = colors.arc
        ctx.shadowBlur = 6
        ctx.stroke()
        ctx.shadowBlur = 0
        ctx.strokeStyle = colors.arc
        ctx.lineWidth = 1.05
        ctx.stroke()
        const head = arcPt(n1.lat, n1.lng, n2.lat, n2.lng, prog, rot)
        const hs = toScreen(head)
        if (hs.visible) {
          ctx.beginPath()
          ctx.arc(hs.sx, hs.sy, 3, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(${colors.node.join(',')},0.92)`
          ctx.shadowColor = colors.arc
          ctx.shadowBlur = 6
          ctx.fill()
          ctx.shadowBlur = 0
        }
      })

      NODES.forEach(({ lat, lng }) => {
        const p = project(lat, lng, rot)
        const s = toScreen(p)
        if (!s.visible || s.b < 0.5) return
        const pulse = (Math.sin(t * 0.05 + lat) + 1) / 2
        ctx.beginPath()
        ctx.arc(s.sx, s.sy, 3 + pulse * 4, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(${colors.node.join(',')},${0.28 * s.b})`
        ctx.lineWidth = 1
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(s.sx, s.sy, 2.5, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${colors.node.join(',')},${0.9 * s.b})`
        ctx.fill()
      })

      drawRingLayer('front')

      rot = (rot + 0.1) % 360
      t++
      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [tone])

  return <canvas ref={canvasRef} className='h-full w-full' />
}

function ParticleField({ tone }: { tone: 'light' | 'dark' }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const particlesRef = useRef<Particle[]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const isDark = tone === 'dark'
    const palette: [number, number, number][] = isDark
      ? [
          [125, 211, 252],
          [168, 85, 247],
          [248, 250, 252],
        ]
      : [
          [56, 189, 248],
          [96, 165, 250],
          [255, 255, 255],
        ]
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
    const pointer = { x: 0, y: 0 }
    const scroll = { y: window.scrollY || 0 }

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 1.25)
      const width = canvas.offsetWidth
      const height = canvas.offsetHeight
      canvas.width = width * ratio
      canvas.height = height * ratio
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)

      const count = Math.max(
        48,
        Math.min(96, Math.floor((width * height) / 12000))
      )
      particlesRef.current = Array.from({ length: count }, (_, index) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * (prefersReducedMotion ? 0 : 0.09),
        vy: (Math.random() - 0.5) * (prefersReducedMotion ? 0 : 0.09),
        r:
          index % 13 === 0
            ? 2.3 + Math.random() * 1.9
            : 0.7 + Math.random() * 1.6,
        alpha: 0.16 + Math.random() * 0.46,
        pulse: Math.random() * Math.PI * 2,
        depth: 0.25 + Math.random() * 0.75,
        color: palette[index % palette.length],
      }))
    }

    const handlePointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      pointer.x = ((event.clientX - rect.left) / Math.max(rect.width, 1) - 0.5) * 2
      pointer.y =
        ((event.clientY - rect.top) / Math.max(rect.height, 1) - 0.5) * 2
    }

    const handleScroll = () => {
      scroll.y = window.scrollY || 0
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    window.addEventListener('scroll', handleScroll, { passive: true })

    let tick = 0
    const draw = () => {
      const width = canvas.offsetWidth
      const height = canvas.offsetHeight
      ctx.clearRect(0, 0, width, height)

      const parallaxX = prefersReducedMotion ? 0 : pointer.x * 18
      const parallaxY = prefersReducedMotion
        ? 0
        : pointer.y * 14 + (scroll.y % 220) * 0.045

      const nebula = ctx.createRadialGradient(
        width * 0.56 + parallaxX * 0.5,
        height * 0.42 + parallaxY * 0.4,
        0,
        width * 0.5,
        height * 0.46,
        Math.max(width, height) * 0.62
      )
      nebula.addColorStop(
        0,
        isDark ? 'rgba(59,130,246,0.14)' : 'rgba(125,211,252,0.22)'
      )
      nebula.addColorStop(
        0.42,
        isDark ? 'rgba(139,92,246,0.10)' : 'rgba(96,165,250,0.07)'
      )
      nebula.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = nebula
      ctx.fillRect(0, 0, width, height)

      const distantCloud = ctx.createRadialGradient(
        width * 0.18 - parallaxX,
        height * 0.74 - parallaxY,
        0,
        width * 0.18,
        height * 0.74,
        Math.max(width, height) * 0.42
      )
      distantCloud.addColorStop(
        0,
        isDark ? 'rgba(125,211,252,0.075)' : 'rgba(56,189,248,0.055)'
      )
      distantCloud.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = distantCloud
      ctx.fillRect(0, 0, width, height)

      const particles = particlesRef.current
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        if (!prefersReducedMotion) {
          p.x += p.vx
          p.y += p.vy
          if (p.x < -12) p.x = width + 12
          if (p.x > width + 12) p.x = -12
          if (p.y < -12) p.y = height + 12
          if (p.y > height + 12) p.y = -12
        }

        const depthOffsetX = parallaxX * (p.depth - 0.45)
        const depthOffsetY = parallaxY * (p.depth - 0.45)
        const drawX = p.x + depthOffsetX
        const drawY = p.y + depthOffsetY
        const pulse = 0.68 + Math.sin(tick * 0.016 + p.pulse) * 0.32
        const size = p.r * (0.75 + p.depth * 0.95) * pulse
        const opacity = p.alpha * (0.42 + p.depth * 0.58)
        ctx.beginPath()
        ctx.arc(drawX, drawY, size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${p.color.join(',')},${opacity})`
        if (i % 13 === 0) {
          ctx.shadowColor = `rgba(${p.color.join(',')},${isDark ? 0.34 : 0.24})`
          ctx.shadowBlur = size * 4
        }
        ctx.fill()
        ctx.shadowBlur = 0
      }

      let linesDrawn = 0
      for (let i = 0; i < particles.length; i++) {
        if (linesDrawn > 62) break
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i]
          const b = particles[j]
          if (Math.abs(a.depth - b.depth) > 0.2) continue
          const ax = a.x + parallaxX * (a.depth - 0.45)
          const ay = a.y + parallaxY * (a.depth - 0.45)
          const bx = b.x + parallaxX * (b.depth - 0.45)
          const by = b.y + parallaxY * (b.depth - 0.45)
          const dx = ax - bx
          const dy = ay - by
          const distance = Math.hypot(dx, dy)
          if (distance > 96) continue
          const opacity =
            (1 - distance / 96) *
            (0.06 + Math.min(a.depth, b.depth) * (isDark ? 0.12 : 0.1))
          ctx.beginPath()
          ctx.moveTo(ax, ay)
          ctx.lineTo(bx, by)
          ctx.strokeStyle = `rgba(147,197,253,${opacity})`
          ctx.lineWidth = 0.7
          ctx.stroke()
          linesDrawn++
          if (linesDrawn > 62) break
        }
      }

      tick++
      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [tone])

  return <canvas ref={canvasRef} aria-hidden className='h-full w-full' />
}

function BrandIntro({ isDark, compact = false, chipStyle }: BrandIntroProps) {
  const { t } = useTranslation()

  return (
    <>
      {isDark && !compact && (
        <div className='absolute -inset-x-8 -inset-y-6 -z-10 rounded-[2rem] bg-[radial-gradient(circle_at_18%_20%,rgba(255,255,255,0.08),rgba(255,255,255,0)_58%)]' />
      )}
      <p
        className='mb-2 max-w-full text-xs tracking-[0.18em] uppercase sm:mb-3 sm:tracking-[0.2em]'
        style={{ color: isDark ? '#e5e7eb' : '#818cf8', fontWeight: 700 }}
      >
        {t('Global AI API Platform')}
      </p>
      <h2
        className={
          compact
            ? 'mb-2 max-w-[min(100%,36rem)] break-words sm:mb-3'
            : 'mb-3 max-w-[38rem]'
        }
        style={{
          fontSize: compact
            ? 'clamp(1.85rem, 8.5vw, 2.55rem)'
            : 'clamp(2.1rem, 5.4vw, 3rem)',
          fontWeight: 800,
          color: isDark ? '#f8fafc' : '#1e1b4b',
          lineHeight: compact ? 1.12 : 1.2,
          textShadow: isDark
            ? '0 0 28px rgba(255,255,255,0.18)'
            : undefined,
        }}
      >
        {t('Unified API, Connected World')}
      </h2>
      <p
        className={
          compact
            ? 'max-w-[42rem] text-sm leading-relaxed sm:text-[15px]'
            : 'hidden max-w-[42rem] text-sm leading-relaxed sm:block sm:text-[15px]'
        }
        style={{ color: isDark ? '#aeb7c6' : '#6b7280' }}
      >
        {t(
          'Aggregate DeepSeek, OpenAI, Anthropic and other mainstream providers. One key connects global leading AI models.'
        )}
      </p>
      {!compact && (
        <div className='mt-5 hidden max-w-2xl flex-wrap gap-2 sm:flex'>
          {[
            'OpenAI Compatible',
            'Low Latency Routing',
            'Pay Per Use',
            'Global Nodes',
          ].map((f) => (
            <span
              key={f}
              className='rounded-full border px-3 py-1 text-xs'
              style={chipStyle}
            >
              {t(f)}
            </span>
          ))}
        </div>
      )}
    </>
  )
}

/* ── AuthLayout ──────────────────────────────────────────────── */

export function AuthLayout({ children }: AuthLayoutProps) {
  const { resolvedTheme } = useTheme()
  const notifications = useNotifications()
  const isDark = resolvedTheme === 'dark'
  const pageBackground = isDark
    ? 'radial-gradient(circle at 82% 43%,rgba(255,255,255,0.045),rgba(255,255,255,0) 22%),linear-gradient(180deg,#030303 0%,#070707 48%,#030303 100%)'
    : 'radial-gradient(circle at 78% 36%,rgba(255,255,255,0.82),rgba(255,255,255,0) 28%),linear-gradient(135deg,#edf6ff 0%,#f3f8ff 48%,#f8fbff 100%)'
  const navPanelClass = isDark
    ? 'border-white/12 bg-zinc-950/72 shadow-[0_14px_38px_rgba(0,0,0,0.84),0_0_0_1px_rgba(255,255,255,0.03),inset_0_1px_0_rgba(255,255,255,0.08)] [&_[data-slot=button]]:text-zinc-500 [&_[data-slot=button]]:hover:bg-zinc-800/70 [&_[data-slot=button]]:hover:text-zinc-200'
    : 'border-indigo-200/45 bg-white/45 shadow-[0_10px_30px_rgba(99,102,241,0.10),inset_0_1px_0_rgba(255,255,255,0.72)] [&_[data-slot=button]]:text-slate-600 [&_[data-slot=button]]:hover:bg-white/70 [&_[data-slot=button]]:hover:text-indigo-950'
  const chipStyle = isDark
    ? {
        borderColor: 'rgba(255,255,255,0.22)',
        color: '#d4d4d8',
        background: 'rgba(255,255,255,0.08)',
      }
    : {
        borderColor: 'rgba(99,102,241,0.25)',
        color: '#6366f1',
        background: 'rgba(99,102,241,0.06)',
      }
  const authFormSurfaceClass = isDark
    ? 'border-white/14 bg-zinc-900/58 text-slate-50 shadow-[0_28px_92px_rgba(0,0,0,0.56),0_16px_48px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,255,255,0.10)] backdrop-blur-2xl transition-[transform,border-color,background-color,box-shadow] duration-700 ease-out hover:-translate-y-1 hover:border-white/22 hover:bg-zinc-900/66 hover:shadow-[0_36px_112px_rgba(0,0,0,0.62),0_20px_58px_rgba(0,0,0,0.38),0_0_32px_rgba(252,211,133,0.07),inset_0_1px_0_rgba(255,255,255,0.14)] [&_input]:border-white/14 [&_input]:bg-white/7 [&_input]:text-slate-100 [&_input]:placeholder:text-slate-500 [&_label]:text-slate-300 [&_[data-slot=checkbox]]:border-white/18 [&_[data-slot=checkbox]]:bg-white/6'
    : 'border-white/75 bg-white/72 text-slate-950 shadow-[0_28px_90px_rgba(79,70,229,0.16),0_16px_44px_rgba(30,41,59,0.10),inset_0_1px_0_rgba(255,255,255,0.92)] backdrop-blur-2xl transition-[transform,border-color,background-color,box-shadow] duration-700 ease-out hover:-translate-y-1 hover:border-white hover:bg-white/82 hover:shadow-[0_34px_108px_rgba(79,70,229,0.20),0_20px_58px_rgba(30,41,59,0.13),0_0_48px_rgba(125,211,252,0.18),inset_0_1px_0_rgba(255,255,255,0.98)]'

  return (
    <div
      className='flex min-h-screen flex-col overflow-x-hidden'
      style={{ background: pageBackground }}
    >
      {/* Top bar */}
      <header className='z-30 flex h-16 flex-shrink-0 items-center justify-end bg-transparent px-4 sm:px-6 lg:px-10'>
        <div
          className={`flex items-center gap-1 rounded-full border p-1 backdrop-blur-xl [&_[data-slot=button]]:rounded-full ${navPanelClass}`}
        >
          <LanguageSwitcher />
          <ThemeSwitch />
          <NotificationPopover
            open={notifications.popoverOpen}
            onOpenChange={notifications.setPopoverOpen}
            unreadCount={notifications.unreadCount}
            activeTab={notifications.activeTab}
            onTabChange={notifications.setActiveTab}
            notice={notifications.notice}
            announcements={notifications.announcements}
            loading={notifications.loading}
            onCloseToday={notifications.closeToday}
          />
        </div>
      </header>

      {/* Body */}
      <div className='relative flex flex-1 flex-col overflow-x-hidden overflow-y-auto lg:min-h-0 lg:flex-row lg:overflow-hidden'>
        <div className='pointer-events-none absolute inset-y-[-10rem] right-[-7vw] z-0 hidden w-[58vw] opacity-70 [mask-image:linear-gradient(90deg,transparent_0%,black_20%,black_88%,transparent_100%)] lg:block dark:opacity-58'>
          <ParticleField tone={resolvedTheme} />
        </div>

        <div
          className='pointer-events-none absolute z-0 hidden opacity-60 lg:block lg:opacity-100'
          style={{
            width: 'clamp(1120px, calc(116vw + 340px), 2600px)',
            height: 'clamp(700px, calc(108vh + 18vh - 44px), 1320px)',
            left: 'clamp(-840px, calc(-20vw - 380px), -360px)',
            top: 'clamp(142px, 18vh, 250px)',
          }}
        >
          <GlobeCanvas tone={resolvedTheme} />
        </div>

        {/* Left — overlay text */}
        <div className='relative z-10 hidden min-w-0 shrink-0 overflow-visible lg:block lg:flex-1 lg:overflow-hidden'>
          <div className='pointer-events-none relative max-w-3xl px-6 pt-7 select-none sm:px-10 sm:pt-9 lg:px-14 lg:pt-8 xl:px-16'>
            <BrandIntro isDark={isDark} chipStyle={chipStyle} />
          </div>
        </div>

        <div className='relative z-10 px-4 pt-1 pb-5 select-none sm:px-8 sm:pt-3 sm:pb-6 md:px-10 lg:hidden'>
          <BrandIntro isDark={isDark} compact chipStyle={chipStyle} />
        </div>

        {/* Right — auth form */}
        <div
          className='relative z-10 flex w-full flex-1 items-start justify-center px-5 pt-0 pb-8 sm:px-8 md:px-10 lg:mr-[clamp(44px,7vw,140px)] lg:w-[clamp(360px,34vw,520px)] lg:flex-none lg:items-center lg:px-0 lg:pt-4 lg:pb-12'
        >
          <div
            className={`w-full max-w-[min(408px,100%)] rounded-[1.35rem] border px-5 py-7 sm:px-7 sm:py-8 md:px-8 lg:max-w-[392px] ${authFormSurfaceClass}`}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
