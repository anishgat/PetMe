import type { LLMClient } from './parser'

type OpenAIResponsesClientOptions = {
  apiKey: string
  model?: string
}

type ResponsesApiResponse = {
  output_text?: string
  output?: Array<{
    content?: Array<{
      type?: string
      text?: string
    }>
  }>
  error?: {
    message?: string
  }
}

const DEFAULT_MODEL = 'gpt-5.2'
const RESPONSES_API_URL = 'https://api.openai.com/v1/responses'

function extractOutputText(payload: ResponsesApiResponse): string {
  if (typeof payload.output_text === 'string' && payload.output_text.trim().length > 0) {
    return payload.output_text.trim()
  }

  const contentText = payload.output
    ?.flatMap((item) => item.content ?? [])
    .filter((content) => content.type === 'output_text' && typeof content.text === 'string')
    .map((content) => content.text?.trim() ?? '')
    .filter(Boolean)
    .join('\n')

  if (contentText && contentText.length > 0) {
    return contentText
  }

  throw new Error('OpenAI returned no text output.')
}

export function createOpenAIResponsesClient({
  apiKey,
  model = DEFAULT_MODEL,
}: OpenAIResponsesClientOptions): LLMClient {
  return {
    async complete(prompt: string): Promise<string> {
      const response = await fetch(RESPONSES_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          input: prompt,
        }),
      })

      const payload = (await response.json()) as ResponsesApiResponse

      if (!response.ok) {
        throw new Error(payload.error?.message ?? 'OpenAI request failed.')
      }

      return extractOutputText(payload)
    },
  }
}

export { DEFAULT_MODEL }
