import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  OLLAMA_MODELS_QUERY_KEY,
  useDeleteModel,
  useOllamaModels,
} from '@/hooks/use-ollama-models'
import { pullOllamaModel } from '@/utils/ollama-api'
import { useQueryClient } from '@tanstack/react-query'
import { SlidersHorizontalIcon, Trash2Icon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { PromptInputButton } from '@/components/ai-elements/prompt-input'

type PullState =
  | { phase: 'idle' }
  | { phase: 'pulling'; status: string; percent: number | null }
  | { phase: 'error'; message: string }
  | { phase: 'done' }

function formatBytes(bytes: number): string {
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(0)} MB`
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`
}

export function ModelManagerDialog() {
  const [open, setOpen] = useState(false)
  const [pullInput, setPullInput] = useState('')
  const [pullState, setPullState] = useState<PullState>({ phase: 'idle' })
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const queryClient = useQueryClient()

  const { data: models, isLoading, isError, refetch } = useOllamaModels()
  const deleteMutation = useDeleteModel()

  // Auto-clear success message after 2s
  useEffect(() => {
    if (pullState.phase !== 'done') return
    const timer = setTimeout(() => setPullState({ phase: 'idle' }), 2000)
    return () => clearTimeout(timer)
  }, [pullState.phase])

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      abortRef.current?.abort()
      setPullState({ phase: 'idle' })
      setConfirmDelete(null)
    }
    setOpen(next)
  }

  const handlePull = async () => {
    const name = pullInput.trim()
    if (!name) return
    const controller = new AbortController()
    abortRef.current = controller
    setPullState({ phase: 'pulling', status: 'Starting...', percent: null })

    try {
      await pullOllamaModel(
        name,
        (progress) => {
          const percent =
            progress.total && progress.completed
              ? Math.round((progress.completed / progress.total) * 100)
              : null
          setPullState({ phase: 'pulling', status: progress.status, percent })
        },
        controller.signal,
      )
      queryClient.invalidateQueries({ queryKey: OLLAMA_MODELS_QUERY_KEY })
      setPullState({ phase: 'done' })
      setPullInput('')
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        setPullState({ phase: 'idle' })
      } else {
        setPullState({ phase: 'error', message: (err as Error).message })
      }
    }
  }

  const handleCancelPull = () => {
    abortRef.current?.abort()
  }

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return
    await deleteMutation.mutateAsync(confirmDelete)
    setConfirmDelete(null)
  }

  const isPulling = pullState.phase === 'pulling'

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <PromptInputButton tooltip="Manage models">
          <SlidersHorizontalIcon className="size-4" />
        </PromptInputButton>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Models</DialogTitle>
          <DialogDescription>
            Download new models or remove installed ones.
          </DialogDescription>
        </DialogHeader>

        {/* Pull section */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Pull a model</p>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. llama3.2:3b"
              value={pullInput}
              onChange={(e) => setPullInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isPulling) handlePull()
              }}
              disabled={isPulling}
            />
            <Button
              onClick={handlePull}
              disabled={isPulling || !pullInput.trim()}
              variant="default"
              size="sm"
            >
              Pull
            </Button>
          </div>

          {isPulling && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-xs truncate max-w-[80%]">
                  {pullState.status}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={handleCancelPull}
                >
                  Cancel
                </Button>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{
                    width:
                      pullState.percent != null
                        ? `${pullState.percent}%`
                        : '0%',
                  }}
                />
              </div>
            </div>
          )}

          {pullState.phase === 'error' && (
            <p className="text-destructive text-xs">{pullState.message}</p>
          )}

          {pullState.phase === 'done' && (
            <p className="text-xs text-green-600 dark:text-green-400">
              Model pulled successfully.
            </p>
          )}
        </div>

        <div className="border-t" />

        {/* Installed models section */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Installed models</p>

          {isLoading && (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          )}

          {isError && (
            <div className="space-y-2">
              <p className="text-destructive text-sm">
                Could not connect to Ollama. Make sure it is running.
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          )}

          {!isLoading && !isError && models?.length === 0 && (
            <p className="text-muted-foreground text-sm">
              No models installed.
            </p>
          )}

          {!isLoading && !isError && models && models.length > 0 && (
            <ul className="max-h-64 overflow-y-auto space-y-1">
              {models.map((m) => (
                <li key={m.name}>
                  {confirmDelete === m.name ? (
                    <div className="flex items-center justify-between rounded-md px-3 py-2 bg-destructive/10">
                      <p className="text-sm">
                        Remove <span className="font-medium">{m.name}</span>?
                      </p>
                      <div className="flex gap-1">
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={handleConfirmDelete}
                          disabled={deleteMutation.isPending}
                        >
                          Remove
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => setConfirmDelete(null)}
                          disabled={deleteMutation.isPending}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-accent">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{m.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatBytes(m.size)} · {m.details.parameter_size}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 shrink-0"
                        onClick={() => setConfirmDelete(m.name)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2Icon className="size-3.5" />
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
