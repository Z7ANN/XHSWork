import { useState, useEffect } from 'react'
import { configApi, type SystemConfig } from '@/api'
import { Button, Switch, Input, Spin, Tabs, Upload, message } from 'antd'
import { SaveOutlined, UploadOutlined } from '@ant-design/icons'

const API_BASE = import.meta.env.DEV ? 'http://localhost:3200' : ''

interface ConfigField {
  key: string
  label: string
  type: 'text' | 'switch' | 'password' | 'select'
  options?: { value: string; label: string }[]
}

interface ConfigTab {
  key: string
  label: string
  fields: ConfigField[]
}

const configTabs: ConfigTab[] = [
  {
    key: 'points',
    label: '积分与邀请',
    fields: [
      { key: 'points_per_publish', label: '一键发布消耗积分', type: 'text' },
      { key: 'invite_reward_mode', label: '邀请奖励模式', type: 'select', options: [{ value: 'register', label: '注册即奖励' }, { value: 'paid', label: '充值后奖励' }] },
      { key: 'invite_reward_points', label: '邀请人奖励积分', type: 'text' },
      { key: 'invitee_reward_points', label: '被邀请人奖励积分', type: 'text' },
      { key: 'invite_recharge_bonus_mode', label: '充值奖励次数', type: 'select', options: [{ value: 'first', label: '仅首次充值' }, { value: 'every', label: '每次充值' }] },
      { key: 'invite_recharge_bonus_rate', label: '好友充值赠送比例(%)', type: 'text' },
      { key: 'output_clean_days', label: '生成图片自动清理天数（0=不清理）', type: 'text' },
    ],
  },
  {
    key: 'smtp',
    label: '邮箱设置',
    fields: [
      { key: 'smtp_host', label: 'SMTP 服务器', type: 'text' },
      { key: 'smtp_port', label: 'SMTP 端口', type: 'text' },
      { key: 'smtp_user', label: '邮箱账号', type: 'text' },
      { key: 'smtp_pass', label: '邮箱授权码', type: 'password' },
      { key: 'smtp_from_name', label: '发件人名称', type: 'text' },
    ],
  },
  {
    key: 'wechat',
    label: '微信支付',
    fields: [
      { key: 'pay_wechat_enabled', label: '启用', type: 'switch' },
      { key: 'pay_wechat_appid', label: 'AppID', type: 'text' },
      { key: 'pay_wechat_mchid', label: '商户号', type: 'text' },
      { key: 'pay_wechat_api_key', label: 'API 密钥', type: 'password' },
      { key: 'pay_wechat_notify_url', label: '回调地址', type: 'text' },
    ],
  },
  {
    key: 'alipay',
    label: '支付宝',
    fields: [
      { key: 'pay_alipay_enabled', label: '启用', type: 'switch' },
      { key: 'pay_alipay_appid', label: 'AppID', type: 'text' },
      { key: 'pay_alipay_private_key', label: '应用私钥', type: 'password' },
      { key: 'pay_alipay_public_key', label: '支付宝公钥', type: 'password' },
      { key: 'pay_alipay_notify_url', label: '回调地址', type: 'text' },
    ],
  },
]

export const SettingsPage = () => {
  const [configs, setConfigs] = useState<SystemConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [edited, setEdited] = useState<Record<string, string>>({})

  useEffect(() => {
    configApi.list().then(setConfigs).catch(console.error).finally(() => setLoading(false))
  }, [])

  const getVal = (key: string) => edited[key] ?? configs.find(c => c.configKey === key)?.configValue ?? ''

  const handleChange = (key: string, value: string) => {
    setEdited({ ...edited, [key]: value })
  }

  const save = async () => {
    const changed = Object.entries(edited).map(([configKey, configValue]) => ({ configKey, configValue }))
    if (!changed.length) return
    setSaving(true)
    try {
      await configApi.update(changed)
      const fresh = await configApi.list()
      setConfigs(fresh)
      setEdited({})
      message.success('保存成功')
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  const hasChanges = Object.keys(edited).length > 0

  if (loading) return <div className="p-8 flex justify-center"><Spin /></div>

  const renderFields = (fields: ConfigField[]) => (
    <div className="bg-white rounded-2xl border border-gray-100">
      <div className="divide-y divide-gray-100">
        {fields.map(field => (
          <div key={field.key} className="px-5 py-4 flex items-center gap-6">
            <div className="w-40 shrink-0">
              <p className="text-sm font-medium text-gray-700">{field.label}</p>
            </div>
            <div className="flex-1 max-w-md">
              {field.type === 'switch' ? (
                <Switch
                  checked={getVal(field.key) === '1'}
                  onChange={(checked) => handleChange(field.key, checked ? '1' : '0')}
                />
              ) : field.type === 'select' && field.options ? (
                <select
                  value={getVal(field.key)}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  className="w-full h-8 px-3 rounded-md border border-gray-200 text-sm bg-white focus:outline-none focus:border-blue-400 cursor-pointer"
                >
                  {field.options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              ) : (
                <Input
                  type={field.type === 'password' ? 'password' : 'text'}
                  value={getVal(field.key)}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder={`请输入${field.label}`}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const handleUploadQr = async (key: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    const token = localStorage.getItem('admin_token') || ''
    const res = await fetch(`${API_BASE}/api/admin/configs/upload-qrcode`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    })
    const json = await res.json()
    if (!json.success) { message.error(json.error?.message || '上传失败'); return }
    handleChange(key, json.data.url)
    message.success('上传成功，请点击保存配置')
  }

  const renderQrcodeTab = () => (
    <div className="bg-white rounded-2xl border border-gray-100">
      <div className="divide-y divide-gray-100">
        {[
          { key: 'qr_wechat', label: '微信公众号二维码' },
          { key: 'qr_contact', label: '客服微信二维码' },
        ].map(item => (
          <div key={item.key} className="px-5 py-4 flex items-center gap-6">
            <div className="w-40 shrink-0">
              <p className="text-sm font-medium text-gray-700">{item.label}</p>
            </div>
            <div className="flex items-center gap-4">
              <Upload
                listType="picture-card"
                showUploadList={false}
                accept="image/*"
                beforeUpload={(file) => { handleUploadQr(item.key, file as File); return false }}
              >
                {getVal(item.key) ? (
                  <img src={`${API_BASE}${getVal(item.key)}`} alt={item.label} className="w-full h-full object-contain rounded" />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-gray-400">
                    <UploadOutlined />
                    <span className="text-xs">上传</span>
                  </div>
                )}
              </Upload>
              {getVal(item.key) && (
                <Button size="small" danger onClick={() => handleChange(item.key, '')}>清除</Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="p-8">
      <div className="flex items-center justify-end mb-6">
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={save}
          disabled={!hasChanges}
          loading={saving}
        >
          保存配置
        </Button>
      </div>
      <Tabs
        items={[
          ...configTabs.map(tab => ({
            key: tab.key,
            label: tab.label,
            children: renderFields(tab.fields),
          })),
          { key: 'qrcode', label: '二维码设置', children: renderQrcodeTab() },
        ]}
      />
    </div>
  )
}
