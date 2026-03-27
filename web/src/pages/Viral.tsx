

import { useState, useEffect } from 'react'
import {
  Search, Sparkles, Link2, Copy, Loader2,
  FileText, PenLine, Check, Tag, Images, ImageIcon,
} from 'lucide-react'
import { viralApi, modelApi, API_BASE } from '@/api'
import type { AiModelOption } from '@/api'
import { ModelSelector } from '@/components/ModelSelector'
import { PhonePreview } from '@/components/editor/PhonePreview'
import { stripMarkdown } from '@/utils/stripMarkdown'

const SERVER_ORIGIN = API_BASE.replace(/\/api$/, '')

interface NoteData {
  title: string
  content: string
  tags: string[]
  images: string[]
}

export default function ViralPage() {
  const [noteUrl, setNoteUrl] = useState('')
  const [fetching, setFetching] = useState(false)
  const [fetchedNote, setFetchedNote] = useState<NoteData | null>(null)
  const [requirement, setRequirement] = useState('')
  const [rewriting, setRewriting] = useState(false)
  const [rewriteResult, setRewriteResult] = useState<{ title: string; content: string; tags: string[] } | null>(null)
  const [replicateImg, setReplicateImg] = useState(false)
  const [replicating, setReplicating] = useState(false)
  const [replicatedImages, setReplicatedImages] = useState<string[]>([])
  const [toast, setToast] = useState('')
  const [toastType, setToastType] = useState<'success' | 'warning' | 'error'>('success')
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'original' | 'rewrite'>('original')
  const [textModels, setTextModels] = useState<AiModelOption[]>([])
  const [imageModels, setImageModels] = useState<AiModelOption[]>([])
  const [textModelId, setTextModelId] = useState<number | null>(null)
  const [imageModelId, setImageModelId] = useState<number | null>(null)
  const [enableThinking, setEnableThinking] = useState(false)

  useEffect(() => {
    modelApi.list().then(({ text, image }) => {
      setTextModels(text)
      setImageModels(image)
      if (text.length > 0) setTextModelId(text[0].id)
      if (image.length > 0) setImageModelId(image[0].id)
    }).catch(console.error)
  }, [])

  const showToast = (msg: string, type: 'success' | 'warning' | 'error' = 'success') => {
    setToast(msg)
    setToastType(type)
    setTimeout(() => setToast(''), 3000)
  }

  const handleFetch = async () => {
    if (!noteUrl.trim()) return showToast('请输入笔记链接', 'warning')
    setFetching(true)
    setRewriteResult(null)
    setReplicatedImages([])
    setActiveTab('original')
    try {
      const result = await viralApi.fetch(noteUrl.trim())
      setFetchedNote(result)
    } catch (err: any) {
      showToast(err.message || '解析失败', 'error')
    } finally {
      setFetching(false)
    }
  }

  const handleRewrite = async () => {
    if (!requirement.trim()) return showToast('请输入仿写需求', 'warning')
    if (!fetchedNote) return
    if (!textModelId) return showToast('请选择文本模型', 'warning')
    setRewriting(true)
    setRewriteResult(null)
    setReplicatedImages([])
    try {
      const result = await viralApi.rewrite({
        title: fetchedNote.title,
        content: fetchedNote.content,
        tags: fetchedNote.tags,
        requirement: requirement.trim(),
        textModelId: textModelId!,
        url: noteUrl.trim(),
        enableThinking,
      })
      setRewriteResult(result)
      setActiveTab('rewrite')

      if (replicateImg && fetchedNote.images.length > 0) {
        if (!imageModelId) {
          showToast('请选择图片模型', 'warning')
        } else {
          setReplicating(true)
          try {
            const imgResult = await viralApi.replicateImages({
              images: fetchedNote.images,
              requirement: requirement.trim(),
              imageModelId: imageModelId!,
            })
          setReplicatedImages(imgResult.images.map(url => `${SERVER_ORIGIN}${url}`))
        } catch (err: any) {
          showToast(err.message || '图片复刻失败', 'error')
        } finally {
          setReplicating(false)
        }
        }
      }
    } catch (err: any) {
      showToast(err.message || '仿写失败', 'error')
    } finally {
      setRewriting(false)
    }
  }

  const handleCopyResult = () => {
    if (!rewriteResult) return
    const text = `${rewriteResult.title}\n\n${rewriteResult.content}\n\n${rewriteResult.tags.map(t => `#${t}`).join(' ')}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    showToast('已复制到剪贴板')
    setTimeout(() => setCopied(false), 2000)
  }

  const previewValue = rewriteResult
    ? stripMarkdown(rewriteResult.content).split('\n').filter(Boolean).map(line => ({ type: 'p' as const, children: [{ text: line }] }))
    : fetchedNote
    ? stripMarkdown(fetchedNote.content).split('\n').filter(Boolean).map(line => ({ type: 'p' as const, children: [{ text: line }] }))
    : []

  const previewTitle = rewriteResult?.title || fetchedNote?.title || ''
  const previewTags = rewriteResult?.tags || fetchedNote?.tags || []
  const previewImages = replicatedImages.length > 0 ? replicatedImages : fetchedNote?.images || []

  return (
    <div className="animate-page-in flex flex-col max-w-[1400px] mx-auto w-full p-4 md:p-6 lg:p-8 min-h-[calc(100dvh-4rem)] lg:h-[calc(100dvh-4rem)]">
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] lg:grid-cols-[280px_1fr_400px] gap-4 flex-1 min-h-0">

        {/* 左侧：控制面板 */}
        <div className="flex flex-col min-h-0">
          <div className="rounded-2xl border border-border bg-white p-5 overflow-y-auto flex-1" style={{ scrollbarWidth: 'none' }}>
            <div className="space-y-5">
              {/* 笔记链接 */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">笔记链接</label>
                <div className="relative">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="text"
                    value={noteUrl}
                    onChange={(e) => setNoteUrl(e.target.value)}
                    placeholder="粘贴小红书笔记链接..."
                    className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-white text-sm text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
                    onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
                  />
                </div>
                <button
                  onClick={handleFetch}
                  disabled={fetching}
                  className="w-full h-9 mt-2 rounded-lg border border-border bg-surface-secondary hover:bg-border text-text-primary text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {fetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  获取内容
                </button>
              </div>

              {/* 解析状态提示 */}
              {fetchedNote && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 border border-green-200">
                  <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
                  <span className="text-xs text-green-700 truncate">已解析: {fetchedNote.title}</span>
                </div>
              )}

              {/* 分隔线 */}
              <div className="border-t border-border" />

              {/* 仿写需求 */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">仿写需求</label>
                <textarea
                  value={requirement}
                  onChange={(e) => setRequirement(e.target.value)}
                  placeholder={'描述你的仿写需求，例如：\n• 改成化妆主题，语气更活泼\n• 保持同样结构，换成美食探店\n• 改写成旅行攻略风格'}
                  rows={6}
                  disabled={!fetchedNote}
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-white text-sm text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* 复刻图片开关 */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">复刻图片</span>
                <button
                  type="button"
                  onClick={() => setReplicateImg(!replicateImg)}
                  disabled={!fetchedNote}
                  className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${replicateImg ? 'bg-primary' : 'bg-border'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${replicateImg ? 'left-[18px]' : 'left-0.5'}`} />
                </button>
              </div>

              {/* AI 仿写按钮 */}
              <ModelSelector models={textModels} value={textModelId} onChange={setTextModelId} label="文本模型" enableThinking={enableThinking} onThinkingChange={setEnableThinking} storageKey="viral_text" />
              {replicateImg && (
                <ModelSelector models={imageModels} value={imageModelId} onChange={setImageModelId} label="图片模型" storageKey="viral_image" />
              )}
              <button
                onClick={handleRewrite}
                disabled={rewriting || replicating || !fetchedNote}
                className="w-full h-10 rounded-lg bg-primary hover:bg-primary-dark text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-primary/25 disabled:opacity-60 cursor-pointer"
              >
                {(rewriting || replicating) ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />{replicating ? '图片复刻中...' : '仿写中...'}</>
                ) : (
                  <><Sparkles className="w-4 h-4" />AI 仿写</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 中间：内容对比区 */}
        <div className="flex flex-col min-h-0 bg-white rounded-2xl border border-border overflow-hidden">
          {fetchedNote ? (
            <>
              {/* Tab 切换 */}
              <div className="flex items-center border-b border-border shrink-0">
                <button
                  onClick={() => setActiveTab('original')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors cursor-pointer relative ${
                    activeTab === 'original' ? 'text-primary' : 'text-text-muted hover:text-text-secondary'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  原文内容
                  {activeTab === 'original' && <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-primary rounded-full" />}
                </button>
                <button
                  onClick={() => setActiveTab('rewrite')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors cursor-pointer relative ${
                    activeTab === 'rewrite' ? 'text-primary' : 'text-text-muted hover:text-text-secondary'
                  }`}
                >
                  <PenLine className="w-4 h-4" />
                  仿写结果
                  {rewriteResult && (
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  )}
                  {activeTab === 'rewrite' && <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-primary rounded-full" />}
                </button>
              </div>

              {/* Tab 内容 */}
              <div className="flex-1 min-h-0 overflow-y-auto p-5" style={{ scrollbarWidth: 'none' }}>
                {activeTab === 'original' ? (
                  /* 原文内容 */
                  <div className="space-y-4">
                    <div>
                      <span className="text-xs text-text-muted">标题</span>
                      <p className="text-base font-semibold text-text-primary mt-1">{fetchedNote.title}</p>
                    </div>
                    <div>
                      <span className="text-xs text-text-muted">正文</span>
                      <p className="text-sm text-text-secondary mt-1 whitespace-pre-line leading-relaxed">{stripMarkdown(fetchedNote.content)}</p>
                    </div>
                    {fetchedNote.images.length > 0 && (
                      <div>
                        <span className="text-xs text-text-muted flex items-center gap-1 mb-2">
                          <Images className="w-3 h-3" />图片 ({fetchedNote.images.length})
                        </span>
                        <div className="grid grid-cols-4 gap-2">
                          {fetchedNote.images.map((img, i) => (
                            <img key={i} src={img} alt={`原图${i + 1}`} className="w-full aspect-[3/4] object-cover rounded-lg border border-border" />
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <span className="text-xs text-text-muted flex items-center gap-1 mb-2"><Tag className="w-3 h-3" />标签</span>
                      <div className="flex flex-wrap gap-1.5">
                        {fetchedNote.tags.map((tag, i) => (
                          <span key={`${i}-${tag}`} className="px-2.5 py-1 rounded-full bg-primary/8 text-xs text-primary font-medium">#{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* 仿写结果 */
                  rewriteResult ? (
                    <div className="space-y-4">
                      <div>
                        <span className="text-xs text-text-muted">标题</span>
                        <p className="text-base font-semibold text-text-primary mt-1">{rewriteResult.title}</p>
                      </div>
                      <div>
                        <span className="text-xs text-text-muted">正文</span>
                        <p className="text-sm text-text-secondary mt-1 whitespace-pre-line leading-relaxed">{stripMarkdown(rewriteResult.content)}</p>
                      </div>
                      {(replicatedImages.length > 0 || replicating) && (
                        <div>
                          <span className="text-xs text-text-muted flex items-center gap-1 mb-2"><Images className="w-3 h-3" />复刻图片</span>
                          {replicating ? (
                            <div className="flex items-center gap-3 py-6 justify-center">
                              <div className="relative">
                                <div className="w-10 h-10 rounded-full border-3 border-primary/20 border-t-primary animate-spin" />
                                <ImageIcon className="w-4 h-4 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                              </div>
                              <span className="text-sm text-text-muted">图片复刻中...</span>
                            </div>
                          ) : (
                            <div className="grid grid-cols-4 gap-2">
                              {replicatedImages.map((img, i) => (
                                <img key={i} src={img} alt={`复刻${i + 1}`} className="w-full aspect-[3/4] object-cover rounded-lg border border-green-200" />
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      <div>
                        <span className="text-xs text-text-muted flex items-center gap-1 mb-2"><Tag className="w-3 h-3" />标签</span>
                        <div className="flex flex-wrap gap-1.5">
                          {rewriteResult.tags.map((tag, i) => (
                            <span key={`${i}-${tag}`} className="px-2.5 py-1 rounded-full bg-green-50 border border-green-200 text-xs text-green-700 font-medium">#{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : rewriting ? (
                    <div className="flex flex-col items-center justify-center py-16">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                        <Sparkles className="w-5 h-5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      </div>
                      <p className="text-sm text-text-secondary mt-4">AI 正在仿写中...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-surface-secondary flex items-center justify-center mb-3">
                        <PenLine className="w-6 h-6 text-text-muted/40" />
                      </div>
                      <p className="text-sm text-text-muted">输入仿写需求后，结果将显示在这里</p>
                    </div>
                  )
                )}
              </div>

              {/* 底部工具栏 */}
              {rewriteResult && activeTab === 'rewrite' && (
                <div className="flex items-center justify-end px-5 py-3 border-t border-border shrink-0">
                  <button
                    onClick={handleCopyResult}
                    className="h-8 px-4 rounded-lg bg-surface-secondary text-text-secondary text-xs font-medium flex items-center gap-1.5 hover:bg-border transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? '已复制' : '复制全部'}
                  </button>
                </div>
              )}
            </>
          ) : (
            /* 空状态 */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-surface-secondary flex items-center justify-center mx-auto mb-4">
                  <Search className="w-7 h-7 text-text-muted/40" />
                </div>
                <p className="text-sm text-text-muted">粘贴小红书笔记链接</p>
                <p className="text-xs text-text-muted/60 mt-1">获取爆款内容进行 AI 仿写</p>
              </div>
            </div>
          )}
        </div>

        {/* 右侧：手机预览 */}
        <div className="hidden lg:block overflow-y-auto">
          <PhonePreview
            title={previewTitle}
            tags={previewTags}
            editorValue={previewValue}
            coverImages={previewImages}
          />
        </div>
      </div>

      {/* Toast */}
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
