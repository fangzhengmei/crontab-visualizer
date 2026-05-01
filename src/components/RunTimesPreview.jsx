import { getNextRunTimes } from '../utils/cronParser'

function RunTimesPreview({ parsedCron, count = 10 }) {
  if (!parsedCron) {
    return (
      <div className="preview-section">
        <h2>未来运行时间预览</h2>
        <p>请输入有效的 Cron 表达式</p>
      </div>
    )
  }

  let runTimes = []
  let error = null

  try {
    runTimes = getNextRunTimes(parsedCron, count)
  } catch (e) {
    error = e.message
  }

  const formatDate = (date) => {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short'
    })
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="preview-section">
      <h2>未来 {count} 次运行时间</h2>
      
      {error && (
        <div className="error-message">{error}</div>
      )}
      
      {!error && runTimes.length === 0 && (
        <p>没有找到即将运行的时间</p>
      )}
      
      {!error && runTimes.length > 0 && (
        <div className="run-times">
          {runTimes.map((time, index) => (
            <div key={index} className="run-time-item">
              <span className="time">{formatTime(time)}</span>
              <span className="date">{formatDate(time)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default RunTimesPreview
