const FIELD_RANGES = {
  minute: { min: 0, max: 59 },
  hour: { min: 0, max: 23 },
  day: { min: 1, max: 31 },
  month: { min: 1, max: 12 },
  weekday: { min: 0, max: 6 }
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const WEEKDAY_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
]

function parseField(field, fieldType) {
  const { min, max } = FIELD_RANGES[fieldType]
  const values = new Set()

  if (field === '*') {
    for (let i = min; i <= max; i++) {
      values.add(i)
    }
    return Array.from(values).sort((a, b) => a - b)
  }

  const parts = field.split(',')
  
  for (const part of parts) {
    const stepMatch = part.match(/^(.+)\/(\d+)$/)
    
    if (stepMatch) {
      const base = stepMatch[1]
      const step = parseInt(stepMatch[2], 10)
      
      if (step <= 0) {
        throw new Error(`步长值必须大于 0，当前值为 ${step}`)
      }
      
      let start, end
      if (base === '*') {
        start = min
        end = max
      } else {
        const rangeMatch = base.match(/^(\d+)-(\d+)$/)
        if (rangeMatch) {
          start = parseInt(rangeMatch[1], 10)
          end = parseInt(rangeMatch[2], 10)
        } else {
          start = parseInt(base, 10)
          end = max
        }
      }
      
      for (let i = start; i <= end; i += step) {
        if (i >= min && i <= max) {
          values.add(i)
        }
      }
    } else {
      const rangeMatch = part.match(/^(\d+)-(\d+)$/)
      if (rangeMatch) {
        const start = parseInt(rangeMatch[1], 10)
        const end = parseInt(rangeMatch[2], 10)
        for (let i = start; i <= end; i++) {
          if (i >= min && i <= max) {
            values.add(i)
          }
        }
      } else {
        const value = parseInt(part, 10)
        if (!isNaN(value) && value >= min && value <= max) {
          values.add(value)
        }
      }
    }
  }

  return Array.from(values).sort((a, b) => a - b)
}

export function parseCronExpression(expression) {
  const trimmed = expression.trim()
  const parts = trimmed.split(/\s+/)
  
  if (parts.length !== 5) {
    throw new Error('Cron 表达式必须包含 5 个字段：分钟 小时 日期 月份 星期')
  }

  try {
    const [minute, hour, day, month, weekday] = parts
    
    return {
      original: expression,
      fields: {
        minute: {
          value: minute,
          values: parseField(minute, 'minute'),
          label: '分钟'
        },
        hour: {
          value: hour,
          values: parseField(hour, 'hour'),
          label: '小时'
        },
        day: {
          value: day,
          values: parseField(day, 'day'),
          label: '日期'
        },
        month: {
          value: month,
          values: parseField(month, 'month'),
          label: '月份'
        },
        weekday: {
          value: weekday,
          values: parseField(weekday, 'weekday'),
          label: '星期'
        }
      }
    }
  } catch (error) {
    throw new Error(`解析 Cron 表达式失败：${error.message}`)
  }
}

export function getNextRunTimes(parsedCron, count = 10, fromDate = new Date()) {
  if (!parsedCron || !parsedCron.fields) {
    throw new Error('无效的 Cron 表达式解析结果')
  }

  const { fields } = parsedCron
  const runTimes = []
  let current = new Date(fromDate)
  current.setSeconds(0, 0)

  const maxIterations = 100000
  let iterations = 0

  while (runTimes.length < count && iterations < maxIterations) {
    iterations++
    current = new Date(current.getTime() + 60000)

    const minute = current.getMinutes()
    const hour = current.getHours()
    const day = current.getDate()
    const month = current.getMonth() + 1
    const weekday = current.getDay()

    const matchesMinute = fields.minute.values.includes(minute)
    const matchesHour = fields.hour.values.includes(hour)
    const matchesDay = fields.day.values.includes(day) || fields.day.value === '*'
    const matchesMonth = fields.month.values.includes(month)
    const matchesWeekday = fields.weekday.values.includes(weekday) || fields.weekday.value === '*'

    let dayMatch = true
    if (fields.day.value !== '*' && fields.weekday.value !== '*') {
      dayMatch = matchesDay || matchesWeekday
    } else if (fields.day.value !== '*') {
      dayMatch = matchesDay
    } else if (fields.weekday.value !== '*') {
      dayMatch = matchesWeekday
    }

    if (matchesMinute && matchesHour && matchesMonth && dayMatch) {
      runTimes.push(new Date(current))
    }
  }

  if (iterations >= maxIterations && runTimes.length < count) {
    console.warn('达到最大迭代次数，可能无法找到所有运行时间')
  }

  return runTimes
}

export function getTriggerDates(parsedCron, year, month) {
  if (!parsedCron || !parsedCron.fields) {
    return []
  }

  const { fields } = parsedCron
  const dates = []
  const daysInMonth = new Date(year, month, 0).getDate()

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day)
    const weekday = date.getDay()

    const matchesMonth = fields.month.values.includes(month)
    const matchesDay = fields.day.values.includes(day) || fields.day.value === '*'
    const matchesWeekday = fields.weekday.values.includes(weekday) || fields.weekday.value === '*'

    let dayMatch = true
    if (fields.day.value !== '*' && fields.weekday.value !== '*') {
      dayMatch = matchesDay || matchesWeekday
    } else if (fields.day.value !== '*') {
      dayMatch = matchesDay
    } else if (fields.weekday.value !== '*') {
      dayMatch = matchesWeekday
    }

    if (matchesMonth && dayMatch) {
      dates.push(day)
    }
  }

  return dates
}

export function formatCronDescription(parsedCron) {
  if (!parsedCron || !parsedCron.fields) {
    return ''
  }

  const { fields } = parsedCron
  const parts = []

  const minuteDesc = formatFieldDescription(fields.minute, '分钟', 0, 59)
  const hourDesc = formatFieldDescription(fields.hour, '小时', 0, 23)
  
  if (fields.minute.value === '*' && fields.hour.value === '*') {
    parts.push('每分钟')
  } else if (fields.minute.value === '*') {
    parts.push(`每${hourDesc}`)
  } else if (fields.hour.value === '*') {
    parts.push(`每小时的第 ${minuteDesc} 分钟`)
  } else {
    parts.push(`每天 ${hourDesc}:${minuteDesc.padStart(2, '0')}`)
  }

  if (fields.day.value !== '*' || fields.weekday.value !== '*') {
    if (fields.day.value !== '*' && fields.weekday.value !== '*') {
      const dayDesc = formatFieldDescription(fields.day, '号', 1, 31)
      const weekdayDesc = formatWeekdayDescription(fields.weekday.values)
      parts.push(`，每月 ${dayDesc} 号或 ${weekdayDesc}`)
    } else if (fields.day.value !== '*') {
      const dayDesc = formatFieldDescription(fields.day, '号', 1, 31)
      parts.push(`，每月 ${dayDesc} 号`)
    } else {
      const weekdayDesc = formatWeekdayDescription(fields.weekday.values)
      parts.push(`，每周 ${weekdayDesc}`)
    }
  }

  if (fields.month.value !== '*') {
    const monthDesc = formatMonthDescription(fields.month.values)
    parts.push(`，${monthDesc}`)
  }

  return parts.join('')
}

function formatFieldDescription(field, suffix, min, max) {
  if (field.value === '*') {
    return `每${suffix}`
  }
  
  const values = field.values
  if (values.length === 1) {
    return `${values[0]}`
  }
  
  if (values.length === max - min + 1) {
    return `每${suffix}`
  }
  
  return values.join(', ')
}

function formatWeekdayDescription(values) {
  if (values.length === 7) {
    return '每天'
  }
  return values.map(v => WEEKDAY_NAMES[v]).join('、')
}

function formatMonthDescription(values) {
  if (values.length === 12) {
    return '每年'
  }
  return values.map(v => MONTH_NAMES[v - 1]).join('、')
}
