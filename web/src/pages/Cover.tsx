

import { useState, useRef, useEffect } from 'react'
import { Sparkles, Download, Upload, ImageIcon, Loader2, X, Type, Layers, ChevronDown, Check } from 'lucide-react'
import { coverApi, modelApi, API_BASE } from '@/api'
import type { AiModelOption } from '@/api'
import { ModelSelector } from '@/components/ModelSelector'

const SERVER_ORIGIN = API_BASE.replace(/\/api$/, '')

const stylePresets = [
  { value: 'xiaohongshu', label: '小红书风' },
  { value: 'minimal', label: '简约文字' },
  { value: 'collage', label: '拼图对比' },
  { value: 'gradient', label: '渐变背景' },
  { value: 'photo', label: '实拍风格' },
]

const sizeOptions = [
  { value: '3:4', label: '3:4', desc: '竖版', w: 1080, h: 1440 },
  { value: '1:1', label: '1:1', desc: '方图', w: 1080, h: 1080 },
  { value: '9:16', label: '9:16', desc: '全屏', w: 1080, h: 1920 },
]

function CustomSelect({ value, onChange, options, placeholder }: {
  value: string
  onChange: (v: string | undefined) => void
  options: { value: string; label: string }[]
  placeholder?: string
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
        <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
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

export default function CoverPage() {
  const [mode, setMode] = useState<'text2img' | 'img2img'>('text2img')
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState('xiaohongshu')
  const [size, setSize] = useState('3:4')
  const [generating, setGenerating] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [error, setError] = useState('')
  const [referenceImage, setReferenceImage] = useState('')
  const [referencePreview, setReferencePreview] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [imageModels, setImageModels] = useState<AiModelOption[]>([])
  const [imageModelId, setImageModelId] = useState<number | null>(null)

  useEffect(() => {
    modelApi.list().then(({ image }) => {
      setImageModels(image)
      if (image.length > 0) setImageModelId(image[0].id)
    }).catch(console.error)
  }, [])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string
      setReferenceImage(base64)
      setReferencePreview(base64)
    }
    reader.readAsDataURL(file)
  }

  const clearReference = () => {
    setReferenceImage('')
    setReferencePreview('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const showToast = (msg: string) => {
    setError(msg)
    setTimeout(() => setError(''), 3000)
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) return showToast('请输入图片描述')
    if (!imageModelId) return showToast('请选择图片模型')
    setGenerating(true)
    setError('')
    setImageUrl('')
    try {
      const result = await coverApi.generate({
        prompt: prompt.trim(),
        style,
        size,
        imageModelId: imageModelId!,
        referenceImage: mode === 'img2img' ? referenceImage : undefined,
      })
      setImageUrl(`${SERVER_ORIGIN}${result.imageUrl}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败')
    } finally {
      setGenerating(false)
    }
  }

  const handleDownload = () => {
    if (!imageUrl) return
    const a = document.createElement('a')
    a.href = imageUrl
    a.download = `cover_${Date.now()}.png`
    a.click()
  }

  const currentSize = sizeOptions.find(s => s.value === size)!

  return (
    <div className="animate-page-in flex flex-col max-w-[1400px] mx-auto w-full p-4 md:p-6 lg:p-8 min-h-[calc(100dvh-4rem)] lg:h-[calc(100dvh-4rem)]">
      <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-5">

        {/* 左侧控制面板 */}
        <div className="w-full md:w-80 shrink-0 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto rounded-2xl bg-white border border-border p-6 space-y-6" style={{ scrollbarWidth: 'none' }}>

            {/* 模式切换 */}
            <div className="flex bg-surface-secondary rounded-xl p-1 gap-1">
              <button
                onClick={() => setMode('text2img')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  mode === 'text2img'
                    ? 'bg-white text-text-primary shadow-sm'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                <Type className="w-4 h-4" />
                文生图
              </button>
              <button
                onClick={() => setMode('img2img')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  mode === 'img2img'
                    ? 'bg-white text-text-primary shadow-sm'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                <Layers className="w-4 h-4" />
                图生图
              </button>
            </div>

            {/* 图生图：参考图上传 */}
            {mode === 'img2img' && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">参考图片</label>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                {referencePreview ? (
                  <div className="relative group rounded-xl overflow-hidden">
                    <img src={referencePreview} alt="参考图" className="w-full object-cover max-h-44 rounded-xl" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <button
                        onClick={clearReference}
                        className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center transition-opacity cursor-pointer"
                      >
                        <X className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/40 hover:bg-primary/[0.02] transition-all cursor-pointer"
                  >
                    <Upload className="w-7 h-7 text-text-muted mx-auto mb-2" />
                    <p className="text-sm text-text-muted">点击上传参考图片</p>
                    <p className="text-xs text-text-muted/60 mt-1">JPG、PNG，最大 10MB</p>
                  </div>
                )}
              </div>
            )}

            {/* 描述输入 */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                {mode === 'text2img' ? '图片描述' : '生成要求'}
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={mode === 'text2img'
                  ? '描述你想要的封面图片，例如：\n• 粉色背景，护肤品平铺摆拍\n• 秋冬穿搭，街拍风格\n• 简约文字封面，标题居中'
                  : '描述你想要的变化，例如：\n• 保持构图，换成春天的色调\n• 同风格，换成美食主题'
                }
                rows={5}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-white text-sm text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all resize-none"
              />
            </div>

            {/* 风格预设 */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">风格预设</label>
              <CustomSelect value={style} onChange={(v) => setStyle(v || 'xiaohongshu')} options={stylePresets} placeholder="选择风格" />
            </div>

            {/* 尺寸选择 */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">画面尺寸</label>
              <div className="flex gap-2">
                {sizeOptions.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setSize(s.value)}
                    className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-lg transition-all cursor-pointer ${
                      size === s.value
                        ? 'bg-primary/10 border border-primary/20 text-primary'
                        : 'bg-surface-secondary border border-transparent text-text-secondary hover:bg-border/60'
                    }`}
                  >
                    <div className={`rounded border-[1.5px] ${size === s.value ? 'border-primary' : 'border-text-muted/30'}`}
                      style={{ width: s.value === '1:1' ? 16 : 12, height: s.value === '1:1' ? 16 : s.value === '9:16' ? 22 : 18 }}
                    />
                    <span className="text-xs font-semibold">{s.label}</span>
                    <span className="text-[10px] text-text-muted leading-none">{s.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-border" />

            {/* 操作按钮 */}
            <div className="space-y-2">
              <ModelSelector models={imageModels} value={imageModelId} onChange={setImageModelId} label="图片模型" storageKey="cover_image" />
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full h-11 rounded-lg bg-primary hover:bg-primary-dark text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-primary/25 disabled:opacity-60 cursor-pointer"
              >
                {generating ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />生成中...</>
                ) : (
                  <><Sparkles className="w-4 h-4" />AI 生成</>
                )}
              </button>
              {imageUrl && (
                <button
                  onClick={handleDownload}
                  className="w-full h-10 rounded-xl border border-border bg-white text-text-secondary font-medium text-sm flex items-center justify-center gap-2 hover:bg-surface-secondary transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  下载图片
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 右侧预览区 */}
        <div className="flex-1 min-w-0 flex flex-col rounded-2xl bg-white border border-border overflow-hidden">
          {/* 预览头部 */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-border shrink-0">
            <span className="text-sm font-medium text-text-primary">图片预览</span>
            <span className="text-xs text-text-muted bg-surface-secondary px-2.5 py-1 rounded-full">
              {currentSize.w} × {currentSize.h}
            </span>
          </div>

          {/* 预览内容 */}
          <div className="flex-1 min-h-0 flex items-center justify-center p-8 bg-[repeating-conic-gradient(#f5f6fa_0%_25%,#fff_0%_50%)] bg-[length:20px_20px]">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="生成的封面"
                className="rounded-lg object-contain shadow-2xl transition-all duration-500 max-h-full"
                style={{ maxWidth: '100%' }}
              />
            ) : (
              <div
                className="rounded-2xl flex flex-col items-center justify-center transition-all duration-300 relative overflow-hidden"
                style={{
                  width: size === '1:1' ? 400 : 340,
                  height: size === '1:1' ? 400 : size === '9:16' ? 540 : 453,
                  maxHeight: '100%',
                }}
              >
                {generating ? (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-rose-50 to-orange-50 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/20">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                      <Sparkles className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <p className="text-sm font-medium text-text-primary mt-5">AI 正在创作中...</p>
                    <p className="text-xs text-text-muted mt-1.5">预计需要 15-30 秒</p>
                    <div className="mt-4 w-48 h-1.5 bg-primary/10 rounded-full overflow-hidden">
                      <div className="h-full bg-primary/40 rounded-full animate-pulse" style={{ width: '60%' }} />
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-surface-secondary to-border/50 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border">
                    <div className="w-16 h-16 rounded-2xl bg-surface-secondary flex items-center justify-center mb-4">
                      <ImageIcon className="w-8 h-8 text-text-muted/40" />
                    </div>
                    <p className="text-sm text-text-muted">输入描述，生成你的封面</p>
                    <p className="text-xs text-text-muted/60 mt-1">支持文生图和图生图两种模式</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="mx-6 mb-4 px-4 py-2.5 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
