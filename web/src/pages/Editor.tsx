

import { useState, useMemo, useRef, useEffect } from 'react'
import type { Value } from 'platejs'
import { useSearchParams } from 'react-router-dom'
import {
  Plus, ShieldCheck, ClipboardCopy, Send, X, ChevronDown,
  Loader2, ScanLine, Check,
} from 'lucide-react'
import { PlateEditor } from '@/components/editor/PlateEditor'
import { PhonePreview } from '@/components/editor/PhonePreview'
import { editorApi, modelApi, API_BASE } from '@/api'
import type { AiModelOption } from '@/api'
import { stripMarkdown } from '@/utils/stripMarkdown'
import { SensitiveCheck } from '@/components/SensitiveCheck'
import { ModelSelector } from '@/components/ModelSelector'

const toneStyles = [
  { value: 'lively', label: '活泼俏皮' },
  { value: 'professional', label: '专业干货' },
  { value: 'literary', label: '文艺清新' },
  { value: 'funny', label: '搞笑幽默' },
  { value: 'warm', label: '温暖治愈' },
  { value: 'sassy', label: '犀利毒舌' },
  { value: 'storytelling', label: '故事叙述' },
  { value: 'tutorial', label: '教程攻略' },
  { value: 'review', label: '测评种草' },
  { value: 'emotional', label: '情感共鸣' },
  { value: 'minimalist', label: '极简高级' },
  { value: 'conversational', label: '闺蜜聊天' },
  { value: 'inspirational', label: '励志鸡汤' },
  { value: 'suspense', label: '悬念反转' },
  { value: 'listicle', label: '清单盘点' },
  { value: 'debate', label: '观点输出' },
  { value: 'diary', label: '日记随笔' },
  { value: 'science', label: '科普解读' },
  { value: 'retro', label: '复古怀旧' },
  { value: 'luxury', label: '轻奢精致' },
]

const roleOptions = [
  { value: 'blogger', label: '美妆博主' },
  { value: 'foodie', label: '美食达人' },
  { value: 'traveler', label: '旅行博主' },
  { value: 'fitness', label: '健身达人' },
  { value: 'tech', label: '数码科技' },
  { value: 'fashion', label: '时尚穿搭' },
  { value: 'lifestyle', label: '生活方式' },
  { value: 'skincare', label: '护肤达人' },
  { value: 'mother', label: '宝妈育儿' },
  { value: 'student', label: '学生党' },
  { value: 'office', label: '职场白领' },
  { value: 'home', label: '家居好物' },
  { value: 'pet', label: '萌宠博主' },
  { value: 'photography', label: '摄影达人' },
  { value: 'reading', label: '读书博主' },
  { value: 'diy', label: '手工DIY' },
  { value: 'music', label: '音乐博主' },
  { value: 'movie', label: '影视剧评' },
  { value: 'game', label: '游戏玩家' },
  { value: 'car', label: '汽车博主' },
  { value: 'finance', label: '理财达人' },
  { value: 'medical', label: '医学科普' },
  { value: 'law', label: '法律科普' },
  { value: 'psychology', label: '心理咨询' },
  { value: 'education', label: '教育培训' },
  { value: 'wedding', label: '婚礼策划' },
  { value: 'decoration', label: '装修设计' },
  { value: 'outdoor', label: '户外探险' },
  { value: 'wine', label: '品酒达人' },
  { value: 'garden', label: '园艺花艺' },
]

function CustomSelect({ value, onChange, options, placeholder, allowClear }: {
  value: string | undefined
  onChange: (v: string | undefined) => void
  options: { value: string; label: string }[]
  placeholder?: string
  allowClear?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find(o => o.value === value)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full h-9 px-3 rounded-lg border border-border bg-white text-sm text-left flex items-center justify-between gap-2 hover:border-primary/40 transition-colors cursor-pointer"
      >
        <span className={selected ? 'text-text-primary' : 'text-text-muted'}>{selected?.label || placeholder}</span>
        <div className="flex items-center gap-1">
          {allowClear && value && (
            <span
              onClick={(e) => { e.stopPropagation(); onChange(undefined); setOpen(false) }}
              className="w-4 h-4 rounded-full hover:bg-surface-secondary flex items-center justify-center"
            >
              <X className="w-3 h-3 text-text-muted" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg py-1 max-h-60 overflow-y-auto">
          {options.map(o => (
            <button
              key={o.value}
              type="button"
              onClick={() => { onChange(o.value); setOpen(false) }}
              className={`w-full px-3 py-2 text-sm text-left hover:bg-surface-secondary transition-colors cursor-pointer flex items-center justify-between ${o.value === value ? 'text-primary bg-primary/5' : 'text-text-primary'}`}
            >
              {o.label}
              {o.value === value && <Check className="w-3.5 h-3.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function EditorPage() {
  const [searchParams] = useSearchParams()
  const [topic, setTopic] = useState('')
  const [tone, setTone] = useState('lively')
  const [role, setRole] = useState<string | undefined>(undefined)
  const [tags, setTags] = useState<string[]>([])
  const [generating, setGenerating] = useState(false)
  const [editorValue, setEditorValue] = useState<Value>([{ type: 'p', children: [{ text: '' }] }])
  const [editorKey, setEditorKey] = useState(0)
  const [noteTitle, setNoteTitle] = useState('')
  const [coverImages, setCoverImages] = useState<string[]>([])
  const [publishing, setPublishing] = useState(false)
  const [qrcode, setQrcode] = useState('')
  const [toast, setToast] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning'>('success')
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [textModels, setTextModels] = useState<AiModelOption[]>([])
  const [textModelId, setTextModelId] = useState<number | null>(null)
  const [enableThinking, setEnableThinking] = useState(false)

  useEffect(() => {
    modelApi.list().then(({ text }) => {
      setTextModels(text)
      if (text.length > 0) setTextModelId(text[0].id)
    }).catch(console.error)
  }, [])

  const showToast = (msg: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast(msg)
    setToastType(type)
    setTimeout(() => setToast(''), 3000)
  }

  useEffect(() => {
    const historyId = searchParams.get('historyId')
    if (!historyId) return
    editorApi.historyDetail(Number(historyId)).then((record) => {
      setNoteTitle(record.title || '')
      setTopic(record.topic || '')
      setCoverImages(record.images || [])
      setTags(record.tags || [])
      const lines = (record.content || '').split('\n').filter(Boolean)
      const tagLine = record.tags?.length ? record.tags.map(t => `#${t}`).join(' ') : ''
      const value: Value = [
        ...lines.map((line: string) => ({ type: 'p' as const, children: [{ text: line }] })),
        ...(tagLine ? [{ type: 'p' as const, children: [{ text: tagLine }] }] : []),
      ]
      setEditorValue(value.length ? value : [{ type: 'p', children: [{ text: '' }] }])
      setEditorKey(k => k + 1)
    }).catch(() => {
      showToast('加载历史记录失败', 'error')
    })
  }, [searchParams])

  const wordCount = useMemo(() => {
    return editorValue.reduce((count, node: any) => {
      const text = (node.children || []).map((c: any) => c.text ?? '').join('')
      return count + text.length
    }, 0)
  }, [editorValue])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    const remaining = 18 - coverImages.length
    const toAdd = Array.from(files).slice(0, remaining)
    e.target.value = ''
    for (const file of toAdd) {
      try {
        const { url } = await editorApi.uploadImage(file)
        const fullUrl = `${API_BASE.startsWith('/') ? window.location.origin : ''}${url}`
        setCoverImages((prev) => prev.length < 18 ? [...prev, fullUrl] : prev)
      } catch (err: any) {
        showToast(err.message || '图片上传失败', 'error')
      }
    }
  }

  const removeCoverImage = (index: number) => {
    setCoverImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleCopyContent = () => {
    const text = editorValue.map((node: any) => (node.children || []).map((c: any) => c.text ?? '').join('')).join('\n')
    const full = [noteTitle, text, tags.map(t => `#${t}`).join(' ')].filter(Boolean).join('\n\n')
    navigator.clipboard.writeText(full)
    showToast('已复制到剪贴板')
  }

  const handleGenerate = async () => {
    if (!topic.trim()) return showToast('请描述你的需求', 'warning')
    if (!textModelId) return showToast('请选择文本模型', 'warning')
    setGenerating(true)
    setNoteTitle('')
    setTags([])
    setEditorValue([{ type: 'p', children: [{ text: '' }] }])
    setEditorKey(k => k + 1)

    try {
      const res = await editorApi.generateSSE({ topic: topic.trim(), tone, textModelId: textModelId!, role, enableThinking })
      if (!res.ok) {
        const json = await res.json().catch(() => null)
        throw new Error(json?.error?.message || '生成失败')
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error('无法读取流')

      const decoder = new TextDecoder()
      let buffer = ''
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        let currentEvent = ''
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7).trim()
          } else if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6))

            if (currentEvent === 'delta') {
              fullText += data.text
              const titleMatch = fullText.match(/【标题】(.+)/)
              if (titleMatch) {
                setNoteTitle(titleMatch[1].replace(/【标签】.*/, '').trim())
              }
              let content = fullText
              const tIdx = content.indexOf('【标题】')
              if (tIdx !== -1) {
                const nlAfterTitle = content.indexOf('\n', tIdx)
                content = nlAfterTitle !== -1 ? content.slice(nlAfterTitle + 1) : ''
              }
              const tagIdx = content.indexOf('【标签】')
              if (tagIdx !== -1) content = content.slice(0, tagIdx)
              content = stripMarkdown(content.trim())

              const contentLines = content ? content.split('\n').filter(Boolean) : ['']
              const newValue: Value = contentLines.map(line => ({
                type: 'p' as const,
                children: [{ text: line }],
              }))
              setEditorValue(newValue)
              setEditorKey(k => k + 1)
            } else if (currentEvent === 'done') {
              setNoteTitle(data.title)
              setTags(data.tags)
              const contentLines = stripMarkdown(data.content).split('\n').filter(Boolean)
              const tagLine = data.tags.map((t: string) => `#${t}`).join(' ')
              const finalValue: Value = [
                ...contentLines.map((line: string) => ({ type: 'p' as const, children: [{ text: line }] })),
                { type: 'p' as const, children: [{ text: tagLine }] },
              ]
              setEditorValue(finalValue)
              setEditorKey(k => k + 1)
              editorApi.save({
                type: 'editor',
                title: data.title,
                content: data.content,
                tags: data.tags,
                topic: topic.trim(),
              }).catch(() => {})
            } else if (currentEvent === 'error') {
              showToast(data.message || '生成失败', 'error')
            }
          }
        }
      }
    } catch (err: any) {
      console.error('生成失败:', err)
      showToast(err.message || '生成失败', 'error')
    } finally {
      setGenerating(false)
    }
  }

  const handlePublish = async () => {
    if (!noteTitle.trim()) return showToast('请先填写标题', 'warning')
    const text = editorValue.map((node: any) => (node.children || []).map((c: any) => c.text ?? '').join('')).join('\n')
    if (!text.trim()) return showToast('请先填写内容', 'warning')

    const contentWithTags = [text, tags.length ? tags.map(t => `#${t}`).join(' ') : ''].filter(Boolean).join('\n\n')

    setPublishing(true)
    try {
      const result = await editorApi.publish({
        title: noteTitle.trim(),
        content: contentWithTags,
        images: coverImages,
      })
      setQrcode(result.qrcode)
    } catch (err: any) {
      showToast(err.message || '发布失败', 'error')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="flex flex-col animate-page-in max-w-[1400px] mx-auto w-full p-4 md:p-6 lg:p-8 min-h-[calc(100dvh-4rem)] lg:h-[calc(100dvh-4rem)]">
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] lg:grid-cols-[280px_1fr_400px] gap-4 flex-1 min-h-0">

        {/* 左侧：AI 面板 */}
        <div className="flex flex-col min-h-0">
          <div className="rounded-2xl border border-border bg-white p-5 overflow-y-auto flex-1" style={{ scrollbarWidth: 'none' }}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">选择风格</label>
                <CustomSelect value={tone} onChange={(v) => setTone(v || 'lively')} options={toneStyles} placeholder="请选择文案风格" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">选择角色</label>
                <CustomSelect value={role} onChange={setRole} options={roleOptions} placeholder="请选择创作角色" allowClear />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">描述你的需求</label>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value.slice(0, 1000))}
                  placeholder={'例如：写一篇关于护肤的小红书文案，要求轻松日常的风格，要求200字...'}
                  rows={10}
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-white text-sm text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all resize-none"
                />
              </div>
              <div className="flex items-center justify-end">
                <span className="text-xs text-text-muted">{topic.length}/1000</span>
              </div>
              <ModelSelector models={textModels} value={textModelId} onChange={setTextModelId} label="文本模型" enableThinking={enableThinking} onThinkingChange={setEnableThinking} storageKey="editor_text" />
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full h-10 rounded-lg bg-primary hover:bg-primary-dark text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-primary/25 disabled:opacity-60 cursor-pointer"
              >
                {generating ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />生成中...</>
                ) : (
                  <><Send className="w-4 h-4" />生成内容</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 中间：编辑区 */}
        <div className="flex flex-col min-h-0 bg-white rounded-2xl border border-border overflow-hidden">
          <div className="p-5 space-y-4 shrink-0">
            {/* 标题 */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">笔记标题</label>
              <input
                type="text"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="请输入笔记标题..."
                className="w-full h-9 px-3 rounded-lg border border-border bg-white text-sm text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
              />
            </div>

            {/* 封面图片 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-text-primary">封面图片</label>
                <span className="text-xs text-text-muted">{coverImages.length}/18</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {coverImages.map((img, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border group">
                    <img
                      src={img}
                      alt={`封面${i + 1}`}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => setPreviewImage(img)}
                    />
                    <div className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => removeCoverImage(i)}
                        className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center cursor-pointer hover:bg-red-600 transition-colors"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                ))}
                {coverImages.length < 18 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center hover:border-primary/40 hover:bg-primary/[0.02] transition-all cursor-pointer"
                  >
                    <Plus className="w-5 h-5 text-text-muted" />
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* 编辑器 */}
          <div className="flex-1 min-h-0 flex flex-col">
            <PlateEditor key={editorKey} initialValue={editorValue} placeholder="开始编辑你的小红书笔记内容..." onChange={setEditorValue} textModelId={textModelId} enableThinking={enableThinking} />
          </div>

          {/* 底部工具栏 */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-border shrink-0">
            <div className="flex items-center gap-2">
              <SensitiveCheck
                getText={() => editorValue.map((node: any) => (node.children || []).map((c: any) => c.text ?? '').join('')).join('\n')}
                onReplace={(oldWord, newWord) => {
                  setEditorValue(prev => prev.map((node: any) => ({
                    ...node,
                    children: (node.children || []).map((c: any) => ({
                      ...c,
                      text: typeof c.text === 'string' ? c.text.replaceAll(oldWord, newWord) : c.text,
                    })),
                  })))
                  setEditorKey(k => k + 1)
                }}
              />
              <button onClick={handleCopyContent} className="h-8 px-3 rounded-lg bg-surface-secondary text-text-secondary text-xs font-medium flex items-center gap-1.5 hover:bg-border transition-colors cursor-pointer">
                <ClipboardCopy className="w-3.5 h-3.5" />复制内容
              </button>
            </div>
            <div className="flex items-center gap-3 text-xs text-text-muted">
              <span>字数: {wordCount}</span>
              <span>图片: {coverImages.length}/18</span>
            </div>
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="h-8 px-4 rounded-sm bg-primary hover:bg-primary-dark text-white text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-60 cursor-pointer"
            >
              {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              一键发布
            </button>
          </div>
        </div>

        {/* 右侧：手机预览 */}
        <div className="hidden lg:block overflow-y-auto">
          <PhonePreview title={noteTitle} tags={tags} editorValue={editorValue} coverImages={coverImages} />
        </div>
      </div>

      {/* 图片预览弹窗 */}
      {previewImage && (
        <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <img src={previewImage} alt="预览" className="max-w-full max-h-[90vh] object-contain rounded-lg" />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center cursor-pointer hover:bg-surface-secondary transition-colors"
            >
              <X className="w-4 h-4 text-text-primary" />
            </button>
          </div>
        </div>
      )}

      {/* 发布二维码弹窗 */}
      {qrcode && (
        <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center" onClick={() => setQrcode('')}>
          <div className="bg-white rounded-2xl p-6 w-[360px] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
                <ScanLine className="w-5 h-5 text-primary" />
                扫码发布到小红书
              </h3>
              <button onClick={() => setQrcode('')} className="w-7 h-7 rounded-full hover:bg-surface-secondary flex items-center justify-center cursor-pointer transition-colors">
                <X className="w-4 h-4 text-text-muted" />
              </button>
            </div>
            <div className="flex flex-col items-center py-4 gap-3">
              <img src={qrcode} alt="发布二维码" className="w-52 h-52" />
              <span className="text-sm text-text-muted">请使用小红书 App 扫描二维码完成发布</span>
            </div>
          </div>
        </div>
      )}

      {/* Toast 提示 */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[10000] animate-page-in">
          <div className={`px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 ${
            toastType === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
            toastType === 'error' ? 'bg-red-50 text-red-600 border border-red-100' :
            'bg-amber-50 text-amber-700 border border-amber-200'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              toastType === 'success' ? 'bg-green-500' :
              toastType === 'error' ? 'bg-red-500' : 'bg-amber-500'
            }`} />
            {toast}
          </div>
        </div>
      )}
    </div>
  )
}
