'use client'

export interface DeviceFingerprint {
  canvas: string
  webgl: string
  audio: number
  screen: string
  fonts: string[]
  timezone: string
  language: string
  platform: string
  colorDepth: number
  hardwareConcurrency: number
  deviceMemory: number | null
  touchSupport: boolean
  cookiesEnabled: boolean
  doNotTrack: string | null
  hash: string
}

function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}

function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return ''

    canvas.width = 200
    canvas.height = 50

    ctx.textBaseline = 'top'
    ctx.font = '14px Arial'
    ctx.fillStyle = '#f60'
    ctx.fillRect(125, 1, 62, 20)

    ctx.fillStyle = '#069'
    ctx.fillText('Fingerprint', 2, 15)

    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)'
    ctx.fillText('Canvas', 4, 17)

    ctx.strokeStyle = 'rgb(120, 186, 176)'
    ctx.arc(50, 50, 50, 0, Math.PI * 2, true)
    ctx.stroke()

    return canvas.toDataURL()
  } catch {
    return ''
  }
}

function getWebGLFingerprint(): string {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    if (!gl) return ''

    const webgl = gl as WebGLRenderingContext
    const debugInfo = webgl.getExtension('WEBGL_debug_renderer_info')
    
    if (debugInfo) {
      const vendor = webgl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
      const renderer = webgl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      return `${vendor}~${renderer}`
    }

    return webgl.getParameter(webgl.VENDOR) + '~' + webgl.getParameter(webgl.RENDERER)
  } catch {
    return ''
  }
}

function getAudioFingerprint(): number {
  try {
    const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext
    if (!AudioContext) return 0

    const context = new AudioContext()
    const oscillator = context.createOscillator()
    const analyser = context.createAnalyser()
    const gainNode = context.createGain()
    const scriptProcessor = context.createScriptProcessor(4096, 1, 1)

    gainNode.gain.value = 0
    oscillator.type = 'triangle'
    oscillator.connect(analyser)
    analyser.connect(scriptProcessor)
    scriptProcessor.connect(gainNode)
    gainNode.connect(context.destination)

    oscillator.start(0)
    
    const bins = new Float32Array(analyser.frequencyBinCount)
    analyser.getFloatFrequencyData(bins)
    
    oscillator.stop()
    context.close()

    return bins.reduce((acc, val) => acc + Math.abs(val), 0)
  } catch {
    return 0
  }
}

function getScreenFingerprint(): string {
  return `${screen.width}x${screen.height}x${screen.colorDepth}@${window.devicePixelRatio}`
}

function getFonts(): string[] {
  const baseFonts = ['monospace', 'sans-serif', 'serif']
  const testFonts = [
    'Arial', 'Arial Black', 'Arial Narrow', 'Calibri', 'Cambria',
    'Comic Sans MS', 'Consolas', 'Courier', 'Courier New',
    'Georgia', 'Helvetica', 'Impact', 'Lucida Console',
    'Lucida Sans Unicode', 'Microsoft Sans Serif', 'Monaco',
    'Palatino Linotype', 'Tahoma', 'Times', 'Times New Roman',
    'Trebuchet MS', 'Verdana'
  ]

  const testString = 'mmmmmmmmmmlli'
  const testSize = '72px'
  
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return []

  const detected: string[] = []

  const getWidth = (font: string): number => {
    ctx.font = `${testSize} ${font}`
    return ctx.measureText(testString).width
  }

  const baseWidths = baseFonts.map(getWidth)

  for (const font of testFonts) {
    for (let i = 0; i < baseFonts.length; i++) {
      const width = getWidth(`'${font}', ${baseFonts[i]}`)
      if (width !== baseWidths[i]) {
        detected.push(font)
        break
      }
    }
  }

  return detected
}

export async function generateFingerprint(): Promise<DeviceFingerprint> {
  const canvasFp = getCanvasFingerprint()
  const webglFp = getWebGLFingerprint()
  const audioFp = getAudioFingerprint()
  const screenFp = getScreenFingerprint()
  const fonts = getFonts()

  const fingerprint: Omit<DeviceFingerprint, 'hash'> = {
    canvas: hashString(canvasFp),
    webgl: hashString(webglFp),
    audio: audioFp,
    screen: screenFp,
    fonts,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    platform: navigator.platform,
    colorDepth: screen.colorDepth,
    hardwareConcurrency: navigator.hardwareConcurrency || 0,
    deviceMemory: (navigator as unknown as { deviceMemory?: number }).deviceMemory || null,
    touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    cookiesEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack,
  }

  const combinedString = [
    fingerprint.canvas,
    fingerprint.webgl,
    fingerprint.audio.toString(),
    fingerprint.screen,
    fingerprint.fonts.join(','),
    fingerprint.timezone,
    fingerprint.language,
    fingerprint.platform,
    fingerprint.colorDepth.toString(),
    fingerprint.hardwareConcurrency.toString(),
    fingerprint.deviceMemory?.toString() || '',
    fingerprint.touchSupport.toString(),
  ].join('|')

  return {
    ...fingerprint,
    hash: hashString(combinedString),
  }
}

export function compareFingerprints(fp1: DeviceFingerprint, fp2: DeviceFingerprint): number {
  let matchScore = 0
  let totalChecks = 0

  const checks = [
    { match: fp1.canvas === fp2.canvas, weight: 3 },
    { match: fp1.webgl === fp2.webgl, weight: 3 },
    { match: Math.abs(fp1.audio - fp2.audio) < 0.0001, weight: 2 },
    { match: fp1.screen === fp2.screen, weight: 2 },
    { match: fp1.timezone === fp2.timezone, weight: 1 },
    { match: fp1.language === fp2.language, weight: 1 },
    { match: fp1.platform === fp2.platform, weight: 2 },
    { match: fp1.colorDepth === fp2.colorDepth, weight: 1 },
    { match: fp1.hardwareConcurrency === fp2.hardwareConcurrency, weight: 1 },
    { match: fp1.deviceMemory === fp2.deviceMemory, weight: 1 },
    { match: fp1.touchSupport === fp2.touchSupport, weight: 1 },
  ]

  for (const check of checks) {
    totalChecks += check.weight
    if (check.match) {
      matchScore += check.weight
    }
  }

  const fontOverlap = fp1.fonts.filter(f => fp2.fonts.includes(f)).length
  const fontTotal = Math.max(fp1.fonts.length, fp2.fonts.length)
  if (fontTotal > 0) {
    matchScore += (fontOverlap / fontTotal) * 3
    totalChecks += 3
  }

  return matchScore / totalChecks
}

export function isSuspiciousMatch(similarity: number): boolean {
  return similarity >= 0.85
}
