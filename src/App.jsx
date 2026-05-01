import { useState, useCallback } from 'react'
import { parseCronExpression, formatCronDescription } from './utils/cronParser'
import RunTimesPreview from './components/RunTimesPreview'
import Calendar from './components/Calendar'

const DEFAULT_CRON = '0 9 * * 1-5'

function App() {
  const [cronExpression, setCronExpression] = useState(DEFAULT_CRON)
  const [parsedCron, setParsedCron] = useState(null)
  const [error, setError] = useState(null)
  const [description, setDescription] = useState('')

  const handleParse = useCallback(() => {
    try {
      const parsed = parseCronExpression(cronExpression)
      setParsedCron(parsed)
      setError(null)
      setDescription(formatCronDescription(parsed))
    } catch (e) {
      setParsedCron(null)
      setError(e.message)
      setDescription('')
    }
  }, [cronExpression])

  const handleFieldChange = (field, value) => {
    const fields = cronExpression.trim().split(/\s+/)
    const fieldIndex = {
      minute: 0,
      hour: 1,
      day: 2,
      month: 3,
      weekday: 4
    }[field]
    
    if (fieldIndex !== undefined) {
      fields[fieldIndex] = value
      setCronExpression(fields.join(' '))
    }
  }

  const currentFields = parsedCron ? parsedCron.fields : {
    minute: { value: '*' },
    hour: { value: '*' },
    day: { value: '*' },
    month: { value: '*' },
    weekday: { value: '*' }
  }

  return (
    <div className="App">
      <h1>Crontab 可视化编辑器</h1>
      
      <div className="crontab-editor">
        <div className="cron-input-section">
          <h2>Cron 表达式</h2>
          
          <div className="cron-input">
            <input
              type="text"
              value={cronExpression}
              onChange={(e) => setCronExpression(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleParse()}
              placeholder="例如: 0 9 * * 1-5"
            />
            <button onClick={handleParse}>解析</button>
          </div>

          <div className="cron-fields">
            <div className="cron-field">
              <label>分钟</label>
              <input
                type="text"
                value={currentFields.minute.value}
                onChange={(e) => handleFieldChange('minute', e.target.value)}
                placeholder="0-59"
              />
            </div>
            <div className="cron-field">
              <label>小时</label>
              <input
                type="text"
                value={currentFields.hour.value}
                onChange={(e) => handleFieldChange('hour', e.target.value)}
                placeholder="0-23"
              />
            </div>
            <div className="cron-field">
              <label>日期</label>
              <input
                type="text"
                value={currentFields.day.value}
                onChange={(e) => handleFieldChange('day', e.target.value)}
                placeholder="1-31"
              />
            </div>
            <div className="cron-field">
              <label>月份</label>
              <input
                type="text"
                value={currentFields.month.value}
                onChange={(e) => handleFieldChange('month', e.target.value)}
                placeholder="1-12"
              />
            </div>
            <div className="cron-field">
              <label>星期</label>
              <input
                type="text"
                value={currentFields.weekday.value}
                onChange={(e) => handleFieldChange('weekday', e.target.value)}
                placeholder="0-6"
              />
            </div>
          </div>

          {error && (
            <div className="error-message">{error}</div>
          )}

          {description && (
            <div className="success-message">
              <strong>描述：</strong>{description}
            </div>
          )}

          <div className="field-explanation">
            <h3>语法说明</h3>
            <ul>
              <li><code>*</code> - 匹配所有值</li>
              <li><code>,</code> - 列表值，例如 <code>1,3,5</code></li>
              <li><code>-</code> - 范围值，例如 <code>1-5</code></li>
              <li><code>/</code> - 步长值，例如 <code>*/5</code> 表示每5个单位</li>
            </ul>
            <h3 style={{ marginTop: '15px' }}>常用示例</h3>
            <ul>
              <li><code>0 9 * * 1-5</code> - 工作日早上9点</li>
              <li><code>0 0 * * 0</code> - 每周日午夜</li>
              <li><code>*/15 * * * *</code> - 每15分钟</li>
              <li><code>0 0 1 * *</code> - 每月1号午夜</li>
            </ul>
          </div>
        </div>

        <RunTimesPreview parsedCron={parsedCron} count={10} />
      </div>

      <Calendar parsedCron={parsedCron} />
    </div>
  )
}

export default App
