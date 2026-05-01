import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import RunTimesPreview from './RunTimesPreview'
import { parseCronExpression } from '../utils/cronParser'

describe('RunTimesPreview', () => {
  it('应该显示提示信息当没有提供解析结果', () => {
    render(<RunTimesPreview parsedCron={null} />)
    
    expect(screen.getByText('请输入有效的 Cron 表达式')).toBeInTheDocument()
  })

  it('应该显示未来运行时间', () => {
    const parsed = parseCronExpression('0 9 * * 1-5')
    render(<RunTimesPreview parsedCron={parsed} count={5} />)
    
    expect(screen.getByText('未来 5 次运行时间')).toBeInTheDocument()
  })

  it('应该显示标题', () => {
    render(<RunTimesPreview parsedCron={null} />)
    
    expect(screen.getByText('未来运行时间预览')).toBeInTheDocument()
  })
})
