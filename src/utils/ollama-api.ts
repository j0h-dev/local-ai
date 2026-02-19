const OLLAMA_BASE = 'http://localhost:11434'

export interface OllamaModelInfo {
  name: string
  model: string
  modified_at: string
  size: number
  digest: string
  details: {
    format: string
    family: string
    families: string[] | null
    parameter_size: string
    quantization_level: string
  }
}

export interface OllamaPullProgress {
  status: string
  digest?: string
  total?: number
  completed?: number
}

export async function fetchOllamaModels(): Promise<OllamaModelInfo[]> {
  const response = await fetch(`${OLLAMA_BASE}/api/tags`)
  if (!response.ok) {
    throw new Error(`Failed to fetch models: ${response.status}`)
  }
  const data = await response.json()
  return data.models as OllamaModelInfo[]
}

export async function pullOllamaModel(
  name: string,
  onProgress: (progress: OllamaPullProgress) => void,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch(`${OLLAMA_BASE}/api/pull`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, stream: true }),
    signal,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Pull failed: ${response.status} ${text}`)
  }

  const reader = response.body!.getReader()

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.trim()) continue
      onProgress(JSON.parse(line) as OllamaPullProgress)
    }
  }

  if (buffer.trim()) {
    onProgress(JSON.parse(buffer) as OllamaPullProgress)
  }
}

export async function deleteOllamaModel(name: string): Promise<void> {
  const response = await fetch(`${OLLAMA_BASE}/api/delete`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Delete failed: ${response.status} ${text}`)
  }
}
