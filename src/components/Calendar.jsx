import { useState, useMemo } from 'react'
import { getTriggerDates } from '../utils/cronParser'

const WEEKDAY_NAMES = ['日', '一', '二', '三', '四', '五', '六']
const MONTH_NAMES = [
  '一月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '十一月', '十二月'
]

function Calendar({ parsedCron }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewYear, setViewYear] = useState(currentDate.getFullYear())
  const [viewMonth, setViewMonth] = useState(currentDate.getMonth() + 1)

  const today = useMemo(() => {
    const now = new Date()
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate()
    }
  }, [])

  const triggerDates = useMemo(() => {
    if (!parsedCron) return []
    return getTriggerDates(parsedCron, viewYear, viewMonth)
  }, [parsedCron, viewYear, viewMonth])

  const calendarDays = useMemo(() => {
    const days = []
    const firstDay = new Date(viewYear, viewMonth - 1, 1)
    const lastDay = new Date(viewYear, viewMonth, 0)
    
    const firstDayOfWeek = firstDay.getDay()
    const daysInMonth = lastDay.getDate()
    
    const prevMonth = viewMonth === 1 ? 12 : viewMonth - 1
    const prevMonthYear = viewMonth === 1 ? viewYear - 1 : viewYear
    const daysInPrevMonth = new Date(prevMonthYear, prevMonth, 0).getDate()
    
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push({
        day: daysInPrevMonth - i,
        month: prevMonth,
        year: prevMonthYear,
        isOtherMonth: true
      })
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        month: viewMonth,
        year: viewYear,
        isOtherMonth: false
      })
    }
    
    const remainingDays = 42 - days.length
    const nextMonth = viewMonth === 12 ? 1 : viewMonth + 1
    const nextMonthYear = viewMonth === 12 ? viewYear + 1 : viewYear
    
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        month: nextMonth,
        year: nextMonthYear,
        isOtherMonth: true
      })
    }
    
    return days
  }, [viewYear, viewMonth])

  const goToPrevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12)
      setViewYear(viewYear - 1)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  const goToNextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1)
      setViewYear(viewYear + 1)
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  const isToday = (day) => {
    return !day.isOtherMonth && 
           day.year === today.year && 
           day.month === today.month && 
           day.day === today.day
  }

  const isTriggerDate = (day) => {
    return !day.isOtherMonth && triggerDates.includes(day.day)
  }

  return (
    <div className="calendar-section">
      <h2>月历视图</h2>
      
      <div className="calendar-nav">
        <button onClick={goToPrevMonth}>&larr;</button>
        <h3>{viewYear}年 {MONTH_NAMES[viewMonth - 1]}</h3>
        <button onClick={goToNextMonth}>&rarr;</button>
      </div>
      
      <div className="calendar">
        {WEEKDAY_NAMES.map((name, index) => (
          <div key={index} className="calendar-header">
            {name}
          </div>
        ))}
        
        {calendarDays.map((day, index) => {
          const classes = ['calendar-day']
          if (day.isOtherMonth) classes.push('other-month')
          if (isTriggerDate(day)) classes.push('highlight')
          if (isToday(day)) classes.push('today')
          
          return (
            <div key={index} className={classes.join(' ')}>
              {day.day}
            </div>
          )
        })}
      </div>
      
      {parsedCron && (
        <div style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
          <span style={{ 
            display: 'inline-block', 
            width: '12px', 
            height: '12px', 
            backgroundColor: '#3498db', 
            marginRight: '8px',
            borderRadius: '2px'
          }}></span>
          高亮日期表示该天会触发任务
        </div>
      )}
    </div>
  )
}

export default Calendar
