'use client'

import { useEffect, useState } from 'react'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { ListItemNode, ListNode } from '@lexical/list'
import { LinkNode } from '@lexical/link'
import { EditorState, LexicalEditor } from 'lexical'
import { cn } from '@/lib/utils'
import ToolbarPlugin from './rich-text-toolbar'
import type { LexicalContent } from '@/types/lexical'

type RichTextEditorProps = {
  value?: LexicalContent | null
  onChange?: (value: LexicalContent | null) => void
  placeholder?: string
  className?: string
  readOnly?: boolean
}

// Create Payload-compatible Lexical state from editor state
function editorStateToPayloadFormat(editorState: EditorState): LexicalContent {
  const json = editorState.toJSON()
  return {
    root: json.root,
  }
}

// Parse Payload format to initial editor state
function payloadFormatToEditorState(value: LexicalContent | null | undefined): string | undefined {
  if (!value || !value.root) return undefined

  return JSON.stringify({
    root: value.root,
  })
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Enter description...',
  className,
  readOnly = false,
}: RichTextEditorProps) {
  const [editorState, setEditorState] = useState<string | undefined>(
    payloadFormatToEditorState(value)
  )

  // Update editor state when value changes from outside (e.g., form reset)
  useEffect(() => {
    const newState = payloadFormatToEditorState(value)
    if (newState !== editorState) {
      setEditorState(newState)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const handleChange = (editorState: EditorState, _editor: LexicalEditor) => {
    const payloadFormat = editorStateToPayloadFormat(editorState)
    onChange?.(payloadFormat)
  }

  const initialConfig = {
    namespace: 'RichTextEditor',
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
    editable: !readOnly,
  }

  return (
    <div className={cn('relative rounded-md border border-input', className)}>
      <LexicalComposer initialConfig={initialConfig}>
        <div className="flex flex-col">
          {!readOnly && <ToolbarPlugin />}
          <div className="relative">
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  className={cn(
                    'min-h-[120px] w-full px-3 py-2 text-sm outline-none',
                    'prose prose-sm max-w-none',
                    readOnly && 'cursor-default'
                  )}
                  aria-placeholder={placeholder}
                  placeholder={
                    <div className="pointer-events-none absolute left-3 top-2 text-sm text-muted-foreground">
                      {placeholder}
                    </div>
                  }
                />
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
            <OnChangePlugin onChange={handleChange} />
            <HistoryPlugin />
          </div>
        </div>
      </LexicalComposer>
    </div>
  )
}
