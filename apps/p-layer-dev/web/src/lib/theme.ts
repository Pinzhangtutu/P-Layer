/**
 * 主题配色（与旧版 palette-controller.js 同一套 14 套调色板、同一个 localStorage 键 pLayerColorTheme）。
 * 点击「主题配色」卡片时 applyTheme(key) 把 CSS 变量写到 :root，整个应用即时换肤。
 */

export type Palette = {
  key: string
  zh: string
  en: string
  noteZh: string
  noteEn: string
  swatches: string[]
  light?: LightVars
}

export type LightVars = {
  page: string
  surface: string
  surfaceSoft: string
  raised: string
  text: string
  muted: string
  border: string
  accent: string
  accentStrong: string
  accentSoft: string
  success: string
  warning: string
  shadow: string
}

const STORAGE_KEY = 'pLayerColorTheme'

export const PALETTES: Palette[] = [
  {
    key: 'lancet', zh: '柳叶刀蓝', en: 'Lancet Blue',
    noteZh: '清晰、理性，适合分析与研究记录', noteEn: 'Clear and analytical for research work',
    swatches: ['#00468B', '#ED0000', '#42B540', '#0099B4', '#925E9F', '#FDAF91'],
    light: {
      // 默认主题，page 用 Apple 官网同款暖白 #fbfaf7，蓝调从 accent 体现
      page: '#fbfaf7', surface: '#ffffff', surfaceSoft: '#eaf1f7', raised: '#ffffff',
      text: '#1d1d1f', muted: '#6e6e73', border: '#d2d2d7', accent: '#00468B',
      accentStrong: '#003664', accentSoft: '#e5eff9', success: '#34864a', warning: '#a8691c',
      shadow: '0 12px 35px rgba(29,35,48,.07)',
    },
  },
  {
    key: 'neumorphism', zh: '新拟态浅色', en: 'Neumorphism Light',
    noteZh: '柔和、克制，适合长时间工作', noteEn: 'Soft and calm for long research sessions',
    swatches: ['#E0E5EC', '#A3B1C6', '#FFFFFF', '#4D5B70', '#6D7C94'],
    light: {
      page: '#e0e5ec', surface: '#e0e5ec', surfaceSoft: '#d5dce6', raised: '#ffffff',
      text: '#4d5b70', muted: '#6d7c94', border: '#c1cad7', accent: '#6d7c94',
      accentStrong: '#4d5b70', accentSoft: '#d7dee8', success: '#668a74', warning: '#9b7a4f',
      shadow: '8px 8px 18px rgba(163,177,198,.55), -8px -8px 18px rgba(255,255,255,.82)',
    },
  },
  {
    key: 'luxury', zh: '奢华金', en: 'Luxury Gold',
    noteZh: '沉稳、聚焦，适合展示与决策', noteEn: 'Focused and considered for decisions',
    swatches: ['#000000', '#1A1A1A', '#333333', '#D4AF37', '#F4C430', '#FFFFFF'],
    light: {
      page: '#f4f1e9', surface: '#fffdf7', surfaceSoft: '#f0ead8', raised: '#ffffff',
      text: '#29261d', muted: '#706957', border: '#d7cba9', accent: '#9b781d',
      accentStrong: '#6f5110', accentSoft: '#f5ebc7', success: '#5d8768', warning: '#9b651f',
      shadow: '0 18px 50px rgba(100,78,18,.13)',
    },
  },
  { key: 'zang', zh: '藏族五色', en: 'Tibetan Five Colors', noteZh: '高原经幡与藏式织染', noteEn: 'Highland prayer flags and Tibetan dyeing', swatches: ['#F5F0E8', '#993030', '#D4A248', '#224978', '#348C77'] },
  { key: 'uyghur', zh: '维吾尔·艾德莱斯绸', en: 'Uyghur Atlas Silk', noteZh: '艾德莱斯绸的流动色彩', noteEn: 'The flowing colors of Atlas silk', swatches: ['#F7E8D0', '#D63B3B', '#E8AA48', '#254A86', '#243031'] },
  { key: 'korean', zh: '现代朝鲜族', en: 'Modern Korean', noteZh: '现代韩式设计的柔和五色', noteEn: 'Soft modern hues of contemporary Korean design', swatches: ['#F8F8FA', '#D84A5E', '#94C2E0', '#4A72A8', '#222222'] },
  { key: 'miaoyao', zh: '苗瑶·绣色', en: 'Miao & Yao Embroidery', noteZh: '苗绣瑶绣传统五色', noteEn: 'Traditional five colors of Miao and Yao embroidery', swatches: ['#1E2228', '#B73434', '#EDE8E2', '#275482', '#D4A349'] },
  { key: 'dunhuang', zh: '敦煌飞天', en: 'Dunhuang Feitian', noteZh: '唐代壁画矿物色', noteEn: 'Tang-dynasty mural mineral colors', swatches: ['#D9BC9C', '#B84438', '#468C79', '#234B7D', '#C8A458'] },
  { key: 'qin', zh: '大秦帝国', en: 'Qin Empire', noteZh: '兵马俑与秦代陶彩，含中国紫', noteEn: 'Terracotta Army hues, including Han purple', swatches: ['#1A1C22', '#EAE3D7', '#A8362E', '#447C66', '#604886'] },
  { key: 'song', zh: '南宋·宋画', en: 'Southern Song', noteZh: '宋画与龙泉窑青瓷', noteEn: 'Song painting and Longquan celadon', swatches: ['#F2EBDF', '#87B39E', '#54748C', '#C49A73', '#B85858'] },
  { key: 'northernqi', zh: '北齐·墓室壁画', en: 'Northern Qi Murals', noteZh: '北朝墓葬壁画矿物色', noteEn: 'Northern-dynasty tomb mural colors', swatches: ['#E2D2BC', '#A63A32', '#325980', '#588270', '#D2AB66'] },
  { key: 'baikal', zh: '贝加尔湖·蓝冰', en: 'Baikal Blue Ice', noteZh: '湖冰由浅至深的蓝调', noteEn: 'Ice blues from pale to deep', swatches: ['#E6F2F7', '#84C6DD', '#448CBF', '#286899', '#14446E'] },
  { key: 'ancestry', zh: '血脉色谱', en: 'Bloodline Spectrum', noteZh: '祖源五色：燕赵、钢都、高原、北亚、燧石', noteEn: 'Ancestry spectrum: Yan-Zhao, Anshan, plateau, North Asia, flint', swatches: ['#D85A30', '#185FA5', '#A32D2D', '#0F6E56', '#854F0B'] },
  { key: 'prayerflag', zh: '经幡五色', en: 'Prayer-Flag Five Colors', noteZh: '藏地经幡：天蓝、云白、火红、水绿、土黄', noteEn: 'Tibetan prayer flags: sky blue, cloud white, flame red, water green, earth yellow', swatches: ['#1A3D7C', '#F3EFE4', '#C0392B', '#1E8449', '#A67C1B'] },
]

function hexToRgb(hex: string): [number, number, number] {
  const h = String(hex).replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')
}

function mix(hex: string, ratio: number, target = '#ffffff'): string {
  const a = hexToRgb(hex)
  const b = hexToRgb(target)
  return rgbToHex(a[0] + (b[0] - a[0]) * ratio, a[1] + (b[1] - a[1]) * ratio, a[2] + (b[2] - a[2]) * ratio)
}

function hslOf(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      default: h = (r - g) / d + 4
    }
    h /= 6
  }
  return [h, s, l]
}

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 1) + 1) % 1
  let r: number, g: number, b: number
  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }
  return rgbToHex(r * 255, g * 255, b * 255)
}

function adjustLightness(hex: string, delta: number): string {
  const [h, s, l] = hslOf(hex)
  return hslToHex(h, s, Math.max(0, Math.min(1, l + delta / 100)))
}

function pickAccent(swatches: string[]): string {
  let best = swatches[0]
  let bestScore = -1
  swatches.forEach((color) => {
    const [, s, l] = hslOf(color)
    if (s > 0.12 && l > 0.16 && l < 0.82) {
      const score = s * 10 + (1 - Math.abs(l - 0.45)) * 2
      if (score > bestScore) {
        bestScore = score
        best = color
      }
    }
  })
  return best
}

/** 从 swatches 里挑最亮的当作页面底色——让 11 套推得的主题各自有特色背景 */
function pickPage(swatches: string[]): string | null {
  let best: string | null = null
  let bestL = -1
  swatches.forEach((color) => {
    const [, , l] = hslOf(color)
    if (l > bestL) {
      bestL = l
      best = color
    }
  })
  // 亮到一定程度（L>0.7）才算可作页面底色；否则回退到柔和白
  return bestL > 0.7 ? best : null
}

function deriveLight(swatches: string[]): LightVars {
  const accent = pickAccent(swatches)
  // 页面底色直接用 swatches 里最亮的那一格（保证 L>0.7 才采用）——让 11 套主题各自有明显特色背景
  const page = pickPage(swatches) ?? '#f7f7f5'
  // 边框跟着 page 的色相走 20% 混入白，让每套主题的卡片边缘都有微弱色调
  const border = mix(page, 0.8, '#ffffff')
  return {
    page,
    surface: '#ffffff',
    surfaceSoft: mix(accent, 0.9),
    raised: '#ffffff',
    text: '#1d1d1f',
    muted: '#6e6e73',
    border,
    accent,
    accentStrong: adjustLightness(accent, -12),
    accentSoft: mix(accent, 0.88),
    success: '#2e7d4f',
    warning: '#b26a1b',
    shadow: '0 18px 50px rgba(17,24,28,.08)',
  }
}

function paletteOf(key: string): Palette {
  return PALETTES.find((p) => p.key === key) ?? PALETTES[0]
}

export function readTheme(): string {
  try {
    const key = localStorage.getItem(STORAGE_KEY)
    return PALETTES.some((p) => p.key === key) ? (key as string) : 'lancet'
  } catch {
    return 'lancet'
  }
}

/** 把某套主题的浅色变量写到 :root，整个应用即时换肤 */
export function applyTheme(key: string): void {
  const p = paletteOf(key)
  const vars = p.light ?? deriveLight(p.swatches)
  const root = document.documentElement
  root.style.setProperty('--paper', vars.page)
  root.style.setProperty('--card', vars.surface)
  root.style.setProperty('--ink', vars.text)
  root.style.setProperty('--muted', vars.muted)
  root.style.setProperty('--line', vars.border)
  root.style.setProperty('--blue', vars.accent)
  root.style.setProperty('--soft', vars.accentSoft)
  root.style.setProperty('--green', vars.success)
  root.style.setProperty('--gold', vars.warning)
  root.style.setProperty('--shadow', vars.shadow)
}

export function selectTheme(key: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, key)
  } catch {
    /* 隐私模式也能用当前会话主题 */
  }
  applyTheme(key)
}

/** 应用层启动时调用一次 */
export function initTheme(): void {
  applyTheme(readTheme())
}
