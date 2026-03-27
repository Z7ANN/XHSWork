const steps = [
  { step: '01', title: '输入创作需求', desc: '选择分类，输入创作主题，可上传参考图片指定风格' },
  { step: '02', title: 'AI 生成大纲', desc: 'AI 秒级生成多页大纲，支持编辑调整每页内容和配图建议' },
  { step: '03', title: '生成文案和配图', desc: '一键生成标题、正文、话题标签，同时批量生成每页配图' },
  { step: '04', title: '编辑发布', desc: '在编辑器中微调内容，实时手机预览效果，复制内容发布到小红书' },
]

export const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-24 px-4 bg-surface-secondary">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-sm font-medium text-primary bg-secondary px-4 py-1.5 rounded-full">使用流程</span>
          <h2 className="mt-6 text-3xl md:text-4xl font-bold text-text-primary">四步完成创作</h2>
          <p className="mt-4 text-text-secondary">简单直觉的操作流程，让创作变得轻松高效</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <div key={s.step} className="relative">
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-full w-full h-px border-t-2 border-dashed border-border-hover z-0" />
              )}
              <div className="relative rounded-md border border-border bg-white p-8 hover:border-border-hover hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                <span className="text-4xl font-bold text-primary/15">{s.step}</span>
                <h3 className="mt-4 text-lg font-semibold text-text-primary">{s.title}</h3>
                <p className="mt-2 text-sm text-text-secondary leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
