import { useCallback } from 'react'
import type { Value } from 'platejs'
import {
  Plate,
  PlateContent,
  PlateElement,
  PlateLeaf,
  usePlateEditor,
  type PlateElementProps,
  type PlateLeafProps,
} from 'platejs/react'
import {
  BoldPlugin,
  ItalicPlugin,
  UnderlinePlugin,
  StrikethroughPlugin,
  H1Plugin,
  H2Plugin,
  H3Plugin,
  BlockquotePlugin,
  CodePlugin,
  HighlightPlugin,
} from '@platejs/basic-nodes/react'
import { ListPlugin } from '@platejs/list/react'
import { ListStyleType, toggleList } from '@platejs/list'
import { IndentPlugin } from '@platejs/indent/react'
import { LinkPlugin } from '@platejs/link/react'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  Code,
  Highlighter,
  RotateCcw,
} from 'lucide-react'
import { FloatingToolbar } from './FloatingToolbar'

function H1Element(props: PlateElementProps) {
  return <PlateElement as="h1" className="text-2xl font-bold mt-6 mb-3 text-text-primary" {...props} />
}
function H2Element(props: PlateElementProps) {
  return <PlateElement as="h2" className="text-xl font-bold mt-5 mb-2 text-text-primary" {...props} />
}
function H3Element(props: PlateElementProps) {
  return <PlateElement as="h3" className="text-lg font-semibold mt-4 mb-2 text-text-primary" {...props} />
}
function BlockquoteEl(props: PlateElementProps) {
  return <PlateElement as="blockquote" className="border-l-3 border-primary/30 pl-4 my-3 text-text-secondary italic" {...props} />
}
function LinkElement(props: PlateElementProps) {
  return <PlateElement as="a" className="text-accent underline cursor-pointer" {...props} />
}

function BoldLeaf(props: PlateLeafProps) {
  return <PlateLeaf as="strong" className="font-bold" {...props} />
}
function ItalicLeaf(props: PlateLeafProps) {
  return <PlateLeaf as="em" className="italic" {...props} />
}
function UnderlineLeaf(props: PlateLeafProps) {
  return <PlateLeaf as="u" className="underline" {...props} />
}
function StrikethroughLeaf(props: PlateLeafProps) {
  return <PlateLeaf as="s" className="line-through" {...props} />
}
function CodeLeaf(props: PlateLeafProps) {
  return <PlateLeaf as="code" className="bg-surface-secondary px-1.5 py-0.5 rounded text-sm font-mono text-primary" {...props} />
}
function HighlightLeaf(props: PlateLeafProps) {
  return <PlateLeaf as="mark" className="bg-yellow-100 px-0.5 rounded" {...props} />
}

const TOPIC_REGEX = /#[^\s#]+/g

function decorateTopics(param: any) {
  let node: any, path: any
  if (Array.isArray(param)) {
    [node, path] = param
  } else if (param?.entry) {
    [node, path] = param.entry
  } else {
    return []
  }
  const ranges: any[] = []
  if (typeof node?.text !== 'string') return ranges
  let match
  while ((match = TOPIC_REGEX.exec(node.text)) !== null) {
    ranges.push({
      anchor: { path, offset: match.index },
      focus: { path, offset: match.index + match[0].length },
      topic: true,
    })
  }
  return ranges
}

function ToolbarBtn({ onClick, active, tooltip, children }: {
  onClick: () => void; active?: boolean; tooltip: string; children: React.ReactNode
}) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      title={tooltip}
      className={`p-1.5 rounded-md transition-colors cursor-pointer ${active ? 'bg-primary/10 text-primary' : 'text-text-muted hover:text-text-primary hover:bg-surface-secondary'}`}
      aria-label={tooltip}
    >{children}</button>
  )
}

interface PlateEditorProps {
  initialValue?: Value
  onChange?: (value: Value) => void
  placeholder?: string
  textModelId?: number | null
  enableThinking?: boolean
}

const defaultValue: Value = [
  { type: 'p', children: [{ text: '' }] },
]

export function PlateEditor({ initialValue, onChange, placeholder = '开始编辑你的笔记内容...', textModelId, enableThinking }: PlateEditorProps) {
  const editor = usePlateEditor({
    plugins: [
      BoldPlugin.withComponent(BoldLeaf),
      ItalicPlugin.withComponent(ItalicLeaf),
      UnderlinePlugin.withComponent(UnderlineLeaf),
      StrikethroughPlugin.withComponent(StrikethroughLeaf),
      CodePlugin.withComponent(CodeLeaf),
      HighlightPlugin.withComponent(HighlightLeaf),
      H1Plugin.withComponent(H1Element),
      H2Plugin.withComponent(H2Element),
      H3Plugin.withComponent(H3Element),
      BlockquotePlugin.withComponent(BlockquoteEl),
      LinkPlugin.withComponent(LinkElement),
      IndentPlugin,
      ListPlugin,
    ],
    value: initialValue ?? defaultValue,
  })

  const isMarkActive = useCallback(
    (mark: string) => {
      try {
        const marks = editor.api.marks()
        return marks ? !!(marks as Record<string, boolean>)[mark] : false
      } catch { return false }
    },
    [editor]
  )

  const iconSize = 'w-4 h-4'

  return (
    <div className="overflow-hidden flex flex-col flex-1 min-h-0">
      <div className="flex items-center gap-0.5 px-3 py-2 border-y border-border bg-surface-secondary/50 flex-wrap shrink-0">
        <ToolbarBtn onClick={() => editor.tf.h1.toggle()} tooltip="标题 1"><Heading1 className={iconSize} /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.tf.h2.toggle()} tooltip="标题 2"><Heading2 className={iconSize} /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.tf.h3.toggle()} tooltip="标题 3"><Heading3 className={iconSize} /></ToolbarBtn>
        <div className="w-px h-5 bg-border mx-1" />
        <ToolbarBtn onClick={() => editor.tf.bold.toggle()} active={isMarkActive('bold')} tooltip="加粗 ⌘B"><Bold className={iconSize} /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.tf.italic.toggle()} active={isMarkActive('italic')} tooltip="斜体 ⌘I"><Italic className={iconSize} /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.tf.underline.toggle()} active={isMarkActive('underline')} tooltip="下划线 ⌘U"><Underline className={iconSize} /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.tf.strikethrough.toggle()} active={isMarkActive('strikethrough')} tooltip="删除线"><Strikethrough className={iconSize} /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.tf.code.toggle()} active={isMarkActive('code')} tooltip="行内代码"><Code className={iconSize} /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.tf.highlight.toggle()} active={isMarkActive('highlight')} tooltip="高亮"><Highlighter className={iconSize} /></ToolbarBtn>
        <div className="w-px h-5 bg-border mx-1" />
        <ToolbarBtn onClick={() => editor.tf.blockquote.toggle()} tooltip="引用"><Quote className={iconSize} /></ToolbarBtn>
        <ToolbarBtn onClick={() => toggleList(editor, { listStyleType: ListStyleType.Disc })} tooltip="无序列表"><List className={iconSize} /></ToolbarBtn>
        <ToolbarBtn onClick={() => toggleList(editor, { listStyleType: ListStyleType.Decimal })} tooltip="有序列表"><ListOrdered className={iconSize} /></ToolbarBtn>
        <div className="flex-1" />
        <ToolbarBtn onClick={() => editor.tf.setValue(defaultValue)} tooltip="清空内容"><RotateCcw className={iconSize} /></ToolbarBtn>
      </div>
      <Plate editor={editor} onChange={onChange ? ({ value }) => onChange(value) : undefined}>
        <FloatingToolbar textModelId={textModelId} enableThinking={enableThinking} />
        <PlateContent
          className="flex-1 overflow-y-auto px-6 py-4 text-sm text-text-primary leading-loose focus:outline-none [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2 [&_li]:my-1 [&_p]:my-2"
          placeholder={placeholder}
          decorate={decorateTopics}
          renderLeaf={({ leaf, children, attributes }) => {
            if ((leaf as any).topic) return <span style={{ color: '#13386c' }} {...attributes}>{children}</span>
            return <span {...attributes}>{children}</span>
          }}
          onPaste={(e) => {
            e.preventDefault()
            const text = e.clipboardData.getData('text/plain')
            if (text) editor.tf.insertText(text)
          }}
        />
      </Plate>
    </div>
  )
}
