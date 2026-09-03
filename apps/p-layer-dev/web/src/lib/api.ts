export type ServiceId = 'ollama' | 'r' | 'zotero'

export type ServiceStatus = {
  connected: boolean
  model?: string
  version?: string
}

type HealthPayload = {
  local_model?: { connected?: boolean; model?: string }
  r_available?: boolean
  r_version?: string
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`)
  return (await res.json()) as T
}

/**
 * 三个本地服务的状态检查，端点与旧版 local-services-ui.js 保持一致：
 * ollama -> /api/health (local_model.connected)
 * r      -> /api/health (r_available)
 * zotero -> /api/zotero/status
 */
export async function fetchServiceStatus(id: ServiceId): Promise<ServiceStatus> {
  if (id === 'zotero') {
    try {
      const data = await getJson<{ connected?: boolean }>('/api/zotero/status')
      return { connected: !!data.connected }
    } catch {
      return { connected: false }
    }
  }

  const data = await getJson<HealthPayload>('/api/health')
  if (id === 'ollama') {
    return { connected: !!data.local_model?.connected, model: data.local_model?.model }
  }
  return { connected: !!data.r_available, version: (data.r_version || '').split('\n')[0] }
}

export async function startServices(ids: ServiceId[]): Promise<void> {
  await fetch('/api/services/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  })
}

export type AssistantRequest = {
  page: string
  prompt: string
  project: { id: string; name: string; milestones: unknown[]; steps: unknown[] }
  context: { research_question: string; fields: string[] }
  language: string
  ai_config: Record<string, unknown>
}

/** 与旧版 brainstorm-training.js 的 askPia 用同一个端点、同一份 body 结构 */
export async function askAssistant(
  payload: AssistantRequest,
  signal?: AbortSignal,
): Promise<{ title: string; content: string }> {
  const res = await fetch('/api/assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  })
  const data = (await res.json().catch(() => ({}))) as {
    title?: string
    content?: string
    error?: string
  }
  if (!res.ok) throw new Error(data.error || 'Pia is unavailable right now')
  return { title: data.title || 'Pia!', content: data.content ?? '' }}

const AUTOSTART_KEY = 'pLayerServiceAutoStart'

export function readAutoStart(): Record<ServiceId, boolean> {
  try {
    const saved = JSON.parse(localStorage.getItem(AUTOSTART_KEY) || '{}') as Partial<Record<ServiceId, boolean>>
    return { ollama: !!saved.ollama, r: !!saved.r, zotero: !!saved.zotero }
  } catch {
    return { ollama: false, r: false, zotero: false }
  }
}

export function writeAutoStart(state: Record<ServiceId, boolean>): void {
  localStorage.setItem(AUTOSTART_KEY, JSON.stringify(state))
}
