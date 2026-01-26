'use client'

import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { ListItemNode, ListNode } from '@lexical/list'
import { LinkNode } from '@lexical/link'
import { cn } from '@/lib/utils'
import type { LexicalContent } from '@/types/lexical'

type RichTextRendererProps = {
  value?: LexicalContent | null
  className?: string
}

// Parse Payload format to initial editor state
function payloadFormatToEditorState(value: LexicalContent | null | undefined): string | undefined {
  if (!value || !value.root) return undefined

  return JSON.stringify({
    root: value.root,
  })
}

export function RichTextRenderer({ value, className }: RichTextRendererProps) {
  const editorState = payloadFormatToEditorState(value)

  if (!editorState) {
    return null
  }

  const initialConfig = {
    namespace: 'RichTextRenderer',
    theme: {
      paragraph: 'mb-2',
      text: {
        bold: 'font-bold',
        italic: 'italic',
        underline: 'underline',
        strikethrough: 'line-through',
        code: 'bg-muted px-1 py-0.5 rounded font-mono text-sm',
      },
      list: {
        ul: 'list-disc list-inside mb-2',
        ol: 'list-decimal list-inside mb-2',
        listitem: 'ml-4',
      },
      heading: {
        h1: 'text-3xl font-bold mb-2',
        h2: 'text-2xl font-bold mb-2',
        h3: 'text-xl font-bold mb-2',
        h4: 'text-lg font-bold mb-2',
        h5: 'text-base font-bold mb-2',
        h6: 'text-sm font-bold mb-2',
      },
      quote: 'border-l-4 border-muted-foreground pl-4 italic mb-2',
      link: 'text-primary underline',
    },
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode],
    editorState: editorState,
    onError: (error: Error) => {
      console.error('Lexical Error:', error)
    },
    editable: false,
  }

  return (
    <div className={cn('relative', className)}>
      <LexicalComposer initialConfig={initialConfig}>
        <RichTextPlugin
          contentEditable={
            <ContentEditable className="prose prose-sm max-w-none outline-none" />
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
      </LexicalComposer>
    </div>
  )
}
