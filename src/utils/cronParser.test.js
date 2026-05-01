import { describe, it, expect, vi } from 'vitest'
import {
  parseCronExpression,
  getNextRunTimes,
  getTriggerDates,
  formatCronDescription
} from './cronParser'

describe('cronParser', () => {
  describe('parseCronExpression', () => {
    it('应该解析基本的 cron 表达式', () => {
      const result = parseCronExpression('0 9 * * *')
      
      expect(result.fields.minute.values).toEqual([0])
      expect(result.fields.hour.values).toEqual([9])
      expect(result.fields.day.values).toEqual(Array.from({ length: 31 }, (_, i) => i + 1))
      expect(result.fields.month.values).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
      expect(result.fields.weekday.values).toEqual([0, 1, 2, 3, 4, 5, 6])
    })

    it('应该解析列表值', () => {
      const result = parseCronExpression('0,15,30,45 9,12,18 * * *')
      
      expect(result.fields.minute.values).toEqual([0, 15, 30, 45])
      expect(result.fields.hour.values).toEqual([9, 12, 18])
    })

    it('应该解析范围值', () => {
      const result = parseCronExpression('0 9-17 * * 1-5')
      
      expect(result.fields.hour.values).toEqual([9, 10, 11, 12, 13, 14, 15, 16, 17])
      expect(result.fields.weekday.values).toEqual([1, 2, 3, 4, 5])
    })

    it('应该解析步长值', () => {
      const result = parseCronExpression('*/15 * * * *')
      
      expect(result.fields.minute.values).toEqual([0, 15, 30, 45])
    })

    it('应该解析带范围的步长值', () => {
      const result = parseCronExpression('0 9-17/2 * * *')
      
      expect(result.fields.hour.values).toEqual([9, 11, 13, 15, 17])
    })

    it('应该解析混合语法', () => {
      const result = parseCronExpression('0,30 9-12,14-17 * * 1,3,5')
      
      expect(result.fields.minute.values).toEqual([0, 30])
      expect(result.fields.hour.values).toEqual([9, 10, 11, 12, 14, 15, 16, 17])
      expect(result.fields.weekday.values).toEqual([1, 3, 5])
    })

    it('应该抛出错误当字段数量不对', () => {
      expect(() => parseCronExpression('* * * *')).toThrow()
      expect(() => parseCronExpression('* * * * * *')).toThrow()
    })
  })

  describe('getNextRunTimes', () => {
    it('应该返回正确的下一次运行时间', () => {
      const parsed = parseCronExpression('0 9 * * 1-5')
      const fromDate = new Date('2026-05-01T08:00:00')
      
      const runTimes = getNextRunTimes(parsed, 5, fromDate)
      
      expect(runTimes.length).toBe(5)
      
      runTimes.forEach(time => {
        expect(time.getMinutes()).toBe(0)
        expect(time.getHours()).toBe(9)
        expect(time.getDay()).toBeGreaterThanOrEqual(1)
        expect(time.getDay()).toBeLessThanOrEqual(5)
      })
    })

    it('应该处理每小时的任务', () => {
      const parsed = parseCronExpression('0 * * * *')
      const fromDate = new Date('2026-05-01T08:30:00')
      
      const runTimes = getNextRunTimes(parsed, 3, fromDate)
      
      expect(runTimes.length).toBe(3)
      expect(runTimes[0].getHours()).toBe(9)
      expect(runTimes[1].getHours()).toBe(10)
      expect(runTimes[2].getHours()).toBe(11)
    })

    it('应该处理每分钟的任务', () => {
      const parsed = parseCronExpression('* * * * *')
      const fromDate = new Date('2026-05-01T08:00:00')
      
      const runTimes = getNextRunTimes(parsed, 3, fromDate)
      
      expect(runTimes.length).toBe(3)
      expect(runTimes[0].getMinutes()).toBe(1)
      expect(runTimes[1].getMinutes()).toBe(2)
      expect(runTimes[2].getMinutes()).toBe(3)
    })

    it('应该处理特定日期的任务', () => {
      const parsed = parseCronExpression('0 0 15 * *')
      const fromDate = new Date('2026-05-01T00:00:00')
      
      const runTimes = getNextRunTimes(parsed, 2, fromDate)
      
      expect(runTimes[0].getDate()).toBe(15)
      expect(runTimes[0].getMonth()).toBe(4)
      expect(runTimes[1].getDate()).toBe(15)
      expect(runTimes[1].getMonth()).toBe(5)
    })
  })

  describe('getTriggerDates', () => {
    it('应该返回正确的触发日期', () => {
      const parsed = parseCronExpression('0 9 * * 1-5')
      
      const dates = getTriggerDates(parsed, 2026, 5)
      
      dates.forEach(date => {
        const d = new Date(2026, 4, date)
        const weekday = d.getDay()
        expect(weekday).toBeGreaterThanOrEqual(1)
        expect(weekday).toBeLessThanOrEqual(5)
      })
    })

    it('应该处理特定日期的任务', () => {
      const parsed = parseCronExpression('0 0 1,15 * *')
      
      const dates = getTriggerDates(parsed, 2026, 5)
      
      expect(dates).toEqual([1, 15])
    })

    it('应该处理特定星期的任务', () => {
      const parsed = parseCronExpression('0 0 * * 0')
      
      const dates = getTriggerDates(parsed, 2026, 5)
      
      dates.forEach(date => {
        const d = new Date(2026, 4, date)
        expect(d.getDay()).toBe(0)
      })
    })
  })

  describe('formatCronDescription', () => {
    it('应该格式化工作日早上9点的描述', () => {
      const parsed = parseCronExpression('0 9 * * 1-5')
      const description = formatCronDescription(parsed)
      
      expect(description).toContain('9:00')
      expect(description).toContain('每周')
    })

    it('应该格式化每15分钟的描述', () => {
      const parsed = parseCronExpression('*/15 * * * *')
      const description = formatCronDescription(parsed)
      
      expect(description).toContain('每分钟')
    })

    it('应该格式化每周日午夜的描述', () => {
      const parsed = parseCronExpression('0 0 * * 0')
      const description = formatCronDescription(parsed)
      
      expect(description).toContain('每周')
      expect(description).toContain('0:00')
    })

    it('应该格式化每月1号的描述', () => {
      const parsed = parseCronExpression('0 0 1 * *')
      const description = formatCronDescription(parsed)
      
      expect(description).toContain('每月')
      expect(description).toContain('1')
    })
  })
})
