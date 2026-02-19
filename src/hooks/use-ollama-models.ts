import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteOllamaModel, fetchOllamaModels } from '@/utils/ollama-api'

export const OLLAMA_MODELS_QUERY_KEY = ['ollama', 'models'] as const

export function useOllamaModels() {
  return useQuery({
    queryKey: OLLAMA_MODELS_QUERY_KEY,
    queryFn: fetchOllamaModels,
    staleTime: 30_000,
    retry: 1,
  })
}

export function useDeleteModel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => deleteOllamaModel(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OLLAMA_MODELS_QUERY_KEY })
    },
  })
}
