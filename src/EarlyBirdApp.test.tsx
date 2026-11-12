import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import EarlyBirdApp, { parseEarlyBirdData } from './EarlyBirdApp'

const key = 'early-bird-demo-v1'
const click = (name: string) => fireEvent.click(screen.getByRole('button', { name }))
const saved = () => JSON.parse(localStorage.getItem(key)!)
const enter = () => { const view = render(<EarlyBirdApp />); click('开启早鸟演示'); click('登录'); return view }
const art = (name: string) => expect(screen.getByRole('img', { name: `${name}原稿` })).toBeInTheDocument()
beforeEach(() => localStorage.clear())
afterEach(() => { cleanup(); vi.restoreAllMocks() })

it('reserves, edits pickup information, completes pickup and persists a review', () => {
  const view = enter()
  art('首页'); click('预定'); art('点单')
  click('增加紫薯饼'); click('增加玉米粥'); click('减少紫薯饼')
  expect(screen.getByLabelText('总计')).toHaveTextContent('¥3.00')
  click('下一步'); click('修改配送地点')
  fireEvent.change(screen.getByLabelText('取餐点'), { target: { value: '图书馆 · 一层取餐点' } })
  click('保存'); click('结算')
  expect(saved().orders[0].items).toEqual({ purple: 1, corn: 1 })
  expect(saved().orders[0].location).toBe('图书馆 · 一层取餐点')
  art('首页-四合一营养搭配-完成订单预约')
  click('模拟取餐完成'); click('评价本次早餐')
  fireEvent.click(screen.getByRole('radio', { name: '4星' }))
  fireEvent.change(screen.getByLabelText('用餐评价'), { target: { value: '早餐热乎，分量正好' } })
  click('提交评价')
  expect(saved().orders[0]).toMatchObject({ done: true, review: { stars: 4, text: '早餐热乎，分量正好' } })
  view.unmount(); render(<EarlyBirdApp />); click('早餐进度')
  expect(screen.getByText('早餐热乎，分量正好')).toBeInTheDocument()
})

it('navigates the supplied artboards, selects plans and applies recommendations', () => {
  enter(); click('食谱'); art('个性化食谱推荐')
  click('切换计划'); art('个性化食谱推荐2')
  click('减肥饮食计划'); art('切换计划')
  expect(saved().plan).toBe('轻盈蔬食')
  click('早餐推荐'); art('早餐推荐'); click('加入早餐预定')
  expect(screen.getByLabelText('总计')).toHaveTextContent('¥3.00')
  click('返回'); click('社区'); art('社区主页')
  click('排行榜'); art('排行榜'); click('月榜')
  expect(screen.getByRole('status')).toHaveTextContent('月榜')
  click('返回'); click('线上活动'); art('活动1-食食活动')
  click('参加活动'); click('参加活动')
  expect(saved().events).toHaveLength(1)
  click('返回'); click('线下活动'); art('活动2-优惠活动')
  click('返回'); click('我的'); art('我的')
  click('健康提醒'); art('个人健康信息（提醒）')
  click('已知晓'); art('个人健康信息')
})

it('creates a team and prevents duplicate daily check-ins after reload', () => {
  const view = enter(); click('社区'); click('去创建队伍')
  fireEvent.change(screen.getByLabelText('我的队伍名'), { target: { value: '早起小队' } })
  click('创建队伍'); art('组队内页'); click('今日打卡')
  expect(saved().team).toBe('早起小队')
  expect(screen.getByRole('button', { name: '今日已打卡' })).toBeDisabled()
  view.unmount(); render(<EarlyBirdApp />); click('社区'); click('组队详情')
  expect(screen.getByRole('button', { name: '今日已打卡' })).toBeDisabled()
  expect(saved().checks).toHaveLength(1)
})

it('records water and replaces same-day weight without changing the original health layout', () => {
  enter(); click('我的'); click('个人资料')
  click('增加400ml'); click('增加200ml')
  expect(Object.values(saved().water)).toEqual([600])
  for (const value of ['55.5', '55.6']) {
    click('修改体重'); fireEvent.change(screen.getByLabelText('体重（kg）'), { target: { value } }); click('保存今日体重')
  }
  expect(saved().weights).toHaveLength(1)
  expect(saved().weights[0].value).toBe(55.6)
  click('返回'); click('帮助与反馈')
  fireEvent.change(screen.getByLabelText('你的建议'), { target: { value: '希望增加豆浆' } }); click('保存演示反馈')
  expect(saved().feedback).toEqual(['希望增加豆浆'])
})

it('recovers corrupt storage and validates nested saved data', () => {
  localStorage.setItem(key, '{"orders":null}'); enter()
  expect(screen.getByRole('alert')).toHaveTextContent('本地记录不可用')
  const data = saved()
  expect(() => parseEarlyBirdData(JSON.stringify({ ...data, water: { '2026-11-13': -5 } }))).toThrow()
  expect(() => parseEarlyBirdData(JSON.stringify({ ...data, orders: [{ items: { fake: 2 } }] }))).toThrow()
  expect(() => parseEarlyBirdData(JSON.stringify({ ...data, checks: [42] }))).toThrow()
})

it('keeps operating with unavailable storage', () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('QuotaExceededError') })
  enter(); expect(screen.getByRole('alert')).toHaveTextContent('无法保存到浏览器')
  click('社区'); click('组队详情'); click('今日打卡')
  expect(screen.getByRole('button', { name: '今日已打卡' })).toBeDisabled()
})

it('rejects expired pickup and prevents an empty order', () => {
  enter(); click('预定'); click('减少紫薯饼')
  expect(screen.getByRole('button', { name: '下一步' })).toBeDisabled()
  click('增加紫薯饼'); click('下一步'); click('修改取餐时间')
  fireEvent.change(screen.getByLabelText('取餐日期'), { target: { value: '2020-01-01' } })
  fireEvent.submit(screen.getByRole('button', { name: '保存' }).closest('form')!)
  click('结算')
  expect(saved().orders).toHaveLength(0)
  expect(screen.getByText('请选择未来七天内尚未过期的取餐时间')).toBeInTheDocument()
})

it('scales art and hotspots together for desktop, short windows and wider phones', () => {
  const view = enter()
  for (const [width, height, expected] of [[1440, 1000, 1], [1200, 700, 668 / 852], [430, 932, 1], [320, 568, 568 / 852]]) {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: width })
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: height })
    fireEvent(window, new Event('resize'))
    expect(view.container.querySelector('[data-board="home"]')).toHaveStyle({ transform: `scale(${expected})` })
    expect(screen.getByRole('button', { name: '预定' })).toHaveStyle({ left: '245px', top: '502px' })
  }
})
