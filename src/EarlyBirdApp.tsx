'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import styles from './early-bird.module.css'

type Page = 'welcome' | 'home' | 'plans' | 'menu' | 'checkout' | 'orders' | 'community' | 'ranking' | 'me' | 'health' | 'feedback'
type Order = { id: string; items: Record<string, number>; date: string; time: string; location: string; done: boolean; review?: { stars: number; text: string } }
type Data = { version: 1; entered: boolean; plan: string; orders: Order[]; team: string; checks: string[]; events: string[]; water: Record<string, number>; weights: { date: string; value: number }[]; feedback: string[] }
const KEY = 'early-bird-demo-v1'
const plans = ['均衡早餐', '轻盈蔬食', '运动活力']
const locations = ['第一食堂 · 东门取餐柜', '图书馆 · 一层取餐点', '宿舍区 · 北门服务站']
const foods = [
  { id: 'purple', name: '紫薯饼', price: 2, category: '主食', x: 65, y: 900, note: '软糯香甜 · 含芝麻' },
  { id: 'corn', name: '玉米粥', price: 1, category: '热粥', x: 510, y: 900, note: '温暖清香 · 谷物早餐' },
  { id: 'bagel', name: '贝果', price: 4, category: '主食', x: 65, y: 1180, note: '层层鲜香 · 含小麦、鱼' },
  { id: 'pumpkin', name: '南瓜粥', price: 1, category: '热粥', x: 510, y: 1180, note: '绵密顺滑 · 蔬食搭配' },
  { id: 'oats', name: '麦片', price: 5, category: '轻食', x: 65, y: 1460, note: '水果谷物 · 含乳、坚果' },
  { id: 'sandwich', name: '三明治', price: 5, category: '轻食', x: 510, y: 1460, note: '丰富夹心 · 含蛋、小麦' },
  { id: 'bun', name: '小笼包', price: 6, category: '主食', x: 65, y: 1740, note: '鲜香热腾 · 含小麦' },
  { id: 'cookie', name: '曲奇', price: 4, category: '点心', x: 510, y: 1740, note: '酥脆小点 · 含乳、小麦' },
]
const initial = (): Data => ({ version: 1, entered: false, plan: plans[0], orders: [], team: '', checks: [], events: [], water: {}, weights: [], feedback: [] })
const localDate = (offset = 0) => { const d = new Date(); d.setDate(d.getDate() + offset); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const dateOK = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v))
const strings = (v: unknown, max = 3650): v is string[] => Array.isArray(v) && v.length <= max && v.every(x => typeof x === 'string' && x.length <= 500)
const itemsOK = (v: unknown): v is Record<string, number> => isRecord(v) && Object.keys(v).length > 0 && Object.entries(v).every(([id, n]) => foods.some(f => f.id === id) && Number.isInteger(n) && Number(n) > 0 && Number(n) <= 20)
export function parseEarlyBirdData(raw: string): Data {
  const d: unknown = JSON.parse(raw)
  if (!isRecord(d) || d.version !== 1 || typeof d.entered !== 'boolean' || !plans.includes(String(d.plan)) ||
    typeof d.team !== 'string' || d.team.length > 24 || !strings(d.checks) || !d.checks.every(dateOK) ||
    !strings(d.events, 2) || !d.events.every(x => ['早起食光挑战', '周末早餐分享会'].includes(x)) ||
    !strings(d.feedback, 100) || !isRecord(d.water) || Object.keys(d.water).length > 3650 ||
    !Object.entries(d.water).every(([k, v]) => dateOK(k) && Number.isInteger(v) && Number(v) >= 0 && Number(v) <= 10000) ||
    !Array.isArray(d.weights) || d.weights.length > 3650 || !d.weights.every(w => isRecord(w) && dateOK(w.date) && typeof w.value === 'number' && w.value >= 20 && w.value <= 300) ||
    !Array.isArray(d.orders) || d.orders.length > 200 || !d.orders.every(o => isRecord(o) && typeof o.id === 'string' && /^[a-zA-Z0-9-]{1,80}$/.test(o.id) &&
      itemsOK(o.items) && dateOK(o.date) && ['07:00', '07:30', '08:00', '08:30', '09:00'].includes(String(o.time)) &&
      locations.includes(String(o.location)) && typeof o.done === 'boolean' &&
      (o.review === undefined || (o.done && isRecord(o.review) && Number.isInteger(o.review.stars) && Number(o.review.stars) >= 1 && Number(o.review.stars) <= 5 && typeof o.review.text === 'string' && o.review.text.trim().length > 0 && o.review.text.length <= 300)))) {
    throw new Error('Invalid saved demo')
  }
  return { ...(d as Data), checks: [...new Set(d.checks)], events: [...new Set(d.events)] }
}
const total = (items: Record<string, number>) => foods.reduce((n, f) => n + f.price * (items[f.id] || 0), 0)
const asset = (file: string) => `${process.env.__NEXT_ROUTER_BASEPATH || ''}/early-bird/${file}`
const boards = {
  welcome: '欢迎页', login: '登录也', home: '首页', recipes: '个性化食谱推荐',
  planPicker: '个性化食谱推荐2', plans: '切换计划', breakfast: '早餐推荐',
  menu: '点单', checkout: '订单确认', pickup: '首页-四合一营养搭配-完成订单预约',
  community: '社区主页', team: '组队内页', ranking: '排行榜', me: '我的',
  health: '个人健康信息', reminder: '个人健康信息（提醒）', healthRecipes: '健康提醒',
  review: '菜品评价', event1: '活动1-食食活动', event2: '活动2-优惠活动',
} as const
type Board = keyof typeof boards
// These exports include an 18px white margin on each side at 3× resolution.
const paddedBoards: Board[] = ['planPicker', 'plans', 'breakfast', 'ranking', 'reminder', 'review', 'event2']
function Card({ children, warm = false }: { children: ReactNode; warm?: boolean }) { return <section className={`${styles.card} ${warm ? styles.warm : ''}`}>{children}</section> }
function FoodArt({ food }: { food: typeof foods[number] }) {
  const i = foods.indexOf(food)
  return <span role="img" aria-label={food.name} className={styles.foodArt} style={{ backgroundImage: `url("${asset('点单.png')}")`, backgroundSize: '393px 852px', backgroundPosition: `${i % 2 ? -219 : -29}px ${-(382 + Math.floor(i / 2) * 119)}px` }} />
}
function Review({ onSave }: { onSave: (stars: number, text: string) => void }) {
  const [stars, setStars] = useState(5)
  const [text, setText] = useState('')
  return <form onSubmit={e => { e.preventDefault(); if (text.trim()) onSave(stars, text.trim()) }}>
    <fieldset><legend>这份早餐，你喜欢吗？</legend><div className={styles.stars}>{[1, 2, 3, 4, 5].map(n => <label key={n}><input type="radio" name="rating" value={n} checked={stars === n} onChange={() => setStars(n)} /><span>{n}星</span></label>)}</div></fieldset>
    <label>用餐评价<textarea required maxLength={300} value={text} onChange={e => setText(e.target.value)} placeholder="口味、分量，或想对食堂说的话…" /></label>
    <button className={styles.primary} disabled={!text.trim()}>提交评价</button>
  </form>
}
export default function EarlyBirdApp() {
  const [data, setData] = useState<Data>(initial)
  const [ready, setReady] = useState(false)
  const [storageError, setStorageError] = useState('')
  const [page, setPage] = useState<Page>('welcome')
  const [cart, setCart] = useState<Record<string, number>>({})
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('全部')
  const [date, setDate] = useState(localDate(1))
  const [time, setTime] = useState('07:30')
  const [location, setLocation] = useState(locations[0])
  const [message, setMessage] = useState('')
  const [activeOrder, setActiveOrder] = useState('')
  const [orderFilter, setOrderFilter] = useState('全部')
  const [rank, setRank] = useState('本周')
  const [teamName, setTeamName] = useState('')
  const [weight, setWeight] = useState('')
  const [feedback, setFeedback] = useState('')
  const [board, setBoard] = useState<Board | null>('welcome')
  const [sheet, setSheet] = useState('')
  const [scale, setScale] = useState(1)
  const [meal, setMeal] = useState('早')
  useEffect(() => {
    const resize = () => {
      const w = window.innerWidth, h = window.innerHeight
      const margin = w > 540 ? 32 : 0
      setScale(Math.min(1, (w - margin) / 393, (h - margin) / 852))
    }
    resize(); window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])
  const content = useRef<HTMLDivElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const submitting = useRef(false)
  useEffect(() => {
    try { const saved = localStorage.getItem(KEY); if (saved) { const parsed = parseEarlyBirdData(saved); setData(parsed); if (parsed.entered) { setPage('home'); setBoard('home') } } }
    catch { setStorageError('本地记录不可用，已使用新的演示数据。当前仍可继续体验。') }
    setReady(true)
  }, [])
  useEffect(() => {
    if (!ready) return
    try { localStorage.setItem(KEY, JSON.stringify(data)) }
    catch { setStorageError('无法保存到浏览器，当前操作仅在本次打开期间保留。') }
  }, [data, ready])
  useEffect(() => { content.current?.scrollTo?.(0, 0); heading.current?.focus() }, [page])
  useEffect(() => { if (message) { const timer = setTimeout(() => setMessage(''), 4000); return () => clearTimeout(timer) } }, [message])
  const go = (p: Page) => { setPage(p); setBoard(p in boards ? p as Board : null); setSheet(''); setMessage('') }
  const show = (b: Board) => { setBoard(b); setSheet(''); setMessage('') }
  const change = (id: string, delta: number) => setCart(c => { const next = { ...c, [id]: Math.max(0, Math.min(20, (c[id] || 0) + delta)) }; if (!next[id]) delete next[id]; return next })
  const today = localDate()
  const count = Object.values(cart).reduce((a, b) => a + b, 0)
  const latest = data.orders[0]
  const title: Record<Page, string> = { welcome: '早早鸟', home: '早早鸟', plans: '我的早餐计划', menu: '早餐预定', checkout: '确认预约', orders: '我的订单', community: '早鸟社区', ranking: '早起荣誉榜', me: '我的早鸟生活', health: '健康记录', feedback: '帮助与反馈' }
  const choosePlan = (plan: string) => { setData(d => ({ ...d, plan })); setMessage(`已切换为${plan}`) }
  const recommend = () => { setCart(data.plan === '轻盈蔬食' ? { pumpkin: 1, purple: 1 } : data.plan === '运动活力' ? { sandwich: 2, oats: 1 } : { purple: 1, corn: 1, sandwich: 1 }); go('menu') }
  const createOrder = () => {
    if (submitting.current || !count) return
    if (date < localDate() || date > localDate(7) || new Date(`${date}T${time}:00`).getTime() <= Date.now()) { setMessage('请选择未来七天内尚未过期的取餐时间'); return }
    if (data.orders.length >= 200) { setMessage('演示订单已达 200 条上限'); return }
    submitting.current = true
    const order: Order = { id: crypto.randomUUID(), items: { ...cart }, date, time, location, done: false }
    setData(d => ({ ...d, orders: [order, ...d.orders] }))
    setCart({}); setActiveOrder(order.id); show('pickup'); setMessage('演示预约成功，无需付款'); submitting.current = false
  }
  if (board) {
    const padded = paddedBoards.includes(board)
    // Coordinates share the artboard's 393 × 852 content space; the entire tree scales together.
    const hit = (label: string, x: number, y: number, w: number, h: number, action: () => void, disabled = false) =>
      <button key={label} className={styles.hotspot} aria-label={label} title={label} style={{ left: padded ? x * 405 / 393 - 6 : x, top: padded ? y * 864 / 852 - 6 : y, width: padded ? w * 405 / 393 : w, height: padded ? h * 864 / 852 : h }} onClick={action} disabled={disabled} />
    const enter = () => { setData(d => ({ ...d, entered: true })); show('home') }
    const nav = ['home', 'recipes', 'community', 'me'].includes(board) || board === 'healthRecipes'
    const addWater = (n: number) => { setData(d => ({ ...d, water: { ...d.water, [today]: Math.min(10000, (d.water[today] || 0) + n) } })); setMessage(`已记录饮水 ${n}ml`) }
    const currentOrder = data.orders.find(o => o.id === activeOrder) || latest
    return <main className={styles.stage} aria-label="早早鸟">
      <div className={styles.artShell} style={{ width: 393 * scale, height: 852 * scale }}>
        <section className={styles.artboard} data-board={board} aria-label={boards[board]} style={{ transform: `scale(${scale})` }}>
          <img className={styles.boardImage} style={padded ? { width: 405, height: 864, left: -6, top: -6 } : undefined} src={asset(`${boards[board]}.png`)} alt={`${boards[board]}原稿`} draggable={false} />
          {storageError && <div className={styles.storageAlert} role="alert">{storageError}</div>}
          {board === 'welcome' && hit('开启早鸟演示', 0, 0, 393, 852, () => show('login'))}
          {board === 'login' && <>{hit('登录', 29, 698, 335, 50, enter)}{hit('注册', 29, 758, 335, 50, enter)}{hit('帮助与反馈', 342, 60, 34, 35, () => go('feedback'))}</>}
          {!['welcome', 'login', 'home', 'recipes', 'community', 'me', 'healthRecipes', 'planPicker'].includes(board) && hit('返回', 12, 44, 44, 44, () => show(['team', 'ranking', 'event1', 'event2'].includes(board) ? 'community' : ['health', 'reminder'].includes(board) ? 'me' : 'home'))}
          {nav && (['home', 'recipes', 'community', 'me'] as Board[]).map((b, i) => hit(['首页', '食谱', '社区', '我的'][i], i * 98.25, 788, 98.25, 64, () => show(b)))}
          {board === 'home' && <>
            {hit('反馈', 335, 43, 40, 42, () => go('feedback'))}
            {hit('活动通知', 20, 94, 280, 29, () => show('event2'))}
            {hit('预定', 245, 502, 114, 45, () => { if (!count) setCart({ purple: 1 }); show('menu') })}
            {['早', '中', '晚'].map((m, i) => hit(`${m}餐`, 205 + i * 51, 375, 48, 48, () => { setMeal(m); if (m !== '早') setMessage(`${m}餐推荐可在食谱中查看`) }))}
            {meal !== '早' && <output className={styles.mealValue}>{meal === '中' ? '每日午餐' : '每日晚餐'}</output>}
            {hit('早餐进度', 20, 574, 210, 196, () => { setActiveOrder(latest?.id || ''); go('orders') })}
            {hit('二维码取件', 240, 574, 133, 103, () => show('pickup'))}
            {hit('菜品评价', 240, 683, 133, 87, () => show('review'))}
          </>}
          {(board === 'recipes' || board === 'healthRecipes') && <>
            {hit('知识库问答', 20, 60, 285, 48, () => setSheet('知识库问答'))}
            {hit('切换计划', 323, 60, 50, 65, () => show('planPicker'))}
            {hit('个人健康信息', 20, 130, 354, 220, () => show('health'))}
            {hit('餐食记录', 20, 385, 133, 75, () => go('orders'))}
            {hit('喝水', 177, 405, 57, 56, () => addWater(250))}
            {hit('运动记录', 241, 405, 56, 56, () => { setPage('health'); setBoard(null) })}
            {hit('排便记录', 304, 405, 57, 56, () => setSheet('健康记录'))}
            {hit('查看全部', 321, 490, 57, 25, () => show('plans'))}
            {hit('早餐推荐', 20, 515, 190, 260, () => show('breakfast'))}
            {hit('午餐推荐', 218, 515, 175, 260, () => show('plans'))}
          </>}
          {board === 'planPicker' && <>
            {hit('关闭计划选择', 342, 582, 32, 32, () => show('recipes'))}
            {['增肌饮食计划', '减肥饮食计划', '轻断食计划', '自定义'].map((label, i) => hit(label, 25 + i % 2 * 183, 640 + Math.floor(i / 2) * 86, 163, 73, () => { choosePlan([plans[2], plans[1], plans[0], data.plan][i]); if (i === 3) { setPage('plans'); setBoard(null) } else show('plans') }))}
          </>}
          {board === 'plans' && <>
            {hit('详细报告', 257, 115, 96, 31, () => show('health'))}
            {['口味偏好', '忌口', '过敏原'].map((s, i) => hit(s, 36 + i * 110, 155, 101, 91, () => setSheet(s)))}
            {['早餐推荐', '午餐推荐', '晚餐推荐'].map((s, i) => hit(s, 40 + i * 110, 492, 90, 91, () => show('breakfast')))}
            {hit('我的食品数据库', 25, 626, 343, 202, () => show('healthRecipes'))}
          </>}
          {board === 'breakfast' && <>
            {hit('收藏早餐', 295, 280, 58, 58, () => setMessage('已收藏本次推荐'))}
            {hit('加入早餐预定', 25, 775, 343, 51, recommend)}
          </>}
          {board === 'menu' && <>
            {foods.map((f, i) => {
              const x = i % 2 ? 305 : 115, y = Math.min(772, 447 + Math.floor(i / 2) * 119)
              return <div key={f.id}>
                {hit(`减少${f.name}`, x - 12, y - 13, 23, 24, () => change(f.id, -1), !cart[f.id])}
                <output aria-label={`${f.name}数量`} className={styles.quantity} style={{ left: x + 15, top: y - 11, background: i === 0 ? '#ffb969' : '#fff' }}>{cart[f.id] || 0}</output>
                {hit(`增加${f.name}`, x + 26, y - 13, 29, 24, () => change(f.id, 1), cart[f.id] >= 20)}
              </div>
            })}
            <output className={styles.artTotal} aria-label="总计">¥{total(cart).toFixed(2)}</output>
            {hit('下一步', 284, 792, 87, 47, () => show('checkout'), !count)}
          </>}
          {board === 'checkout' && <>
            {hit('修改取餐时间', 20, 96, 352, 52, () => setSheet('预约信息'))}
            {hit('修改配送地点', 20, 149, 352, 52, () => setSheet('预约信息'))}
            <div className={styles.checkoutDetails}>
              <h2>餐品详情</h2>
              <div className={styles.artOrderList}>{foods.filter(f => cart[f.id]).map(f => <article key={f.id}>
                <FoodArt food={f} /><div><strong>{f.name}</strong><p>¥{f.price}</p></div>
                <div><button aria-label={`增加${f.name}`} onClick={() => change(f.id, 1)}>+</button><output>{cart[f.id]}</output><button aria-label={`减少${f.name}`} onClick={() => change(f.id, -1)}>−</button></div>
              </article>)}</div>
            </div>
            <output className={styles.pickupTime}>{date.replaceAll('-', '/')} {time}</output>
            <output className={styles.pickupLocation}>{location}</output>
            <output className={styles.artTotal}>¥{total(cart).toFixed(2)}</output>
            {hit('结算', 292, 792, 79, 47, createOrder, !count)}
          </>}
          {board === 'pickup' && <>
            {currentOrder && <div className={styles.pickupData}>日期：{currentOrder.date}　{currentOrder.time}<br />配送地址：{currentOrder.location}<br />模拟取餐号：{currentOrder.id.slice(0, 8).toUpperCase()}</div>}
            {hit('模拟取餐完成', 170, 785, 54, 40, () => {
              if (!currentOrder) { go('orders'); return }
              setData(d => ({ ...d, orders: d.orders.map(o => o.id === currentOrder.id ? { ...o, done: true } : o) })); show('review')
            })}
            {hit('查看订单', 50, 785, 42, 40, () => go('orders'))}
            {hit('查看取餐信息', 306, 785, 40, 40, () => setMessage(currentOrder ? '模拟取餐码仅供本机演示，无真实柜机连接' : '当前展示原稿示例，请先预约早餐'))}
          </>}
          {board === 'review' && <>
            {hit('评价本次早餐', 25, 117, 344, 136, () => setSheet('菜品评价'))}
            {hit('过往菜品', 298, 93, 70, 25, () => go('orders'))}
            {hit('搜索菜品', 233, 272, 137, 29, () => setSheet('搜索菜品'))}
            {['早餐', '午餐', '晚餐'].map((s, i) => hit(s, 25 + i * 61, 274, 56, 34, () => setMessage(`已选择${s}评价；当前展示原稿示例榜单`)))}
          </>}
          {board === 'community' && <>
            {hit('排行榜', 20, 108, 200, 88, () => show('ranking'))}
            {hit('帖子', 233, 108, 141, 88, () => setSheet('社区帖子'))}
            {hit('去创建队伍', 62, 379, 263, 59, () => setSheet('组队打卡'))}
            {hit('组队详情', 20, 210, 353, 166, () => show('team'))}
            {hit('线上活动', 20, 493, 195, 287, () => show('event1'))}
            {hit('线下活动', 230, 493, 163, 287, () => show('event2'))}
            {hit('消息', 323, 47, 50, 51, () => setSheet('社区消息'))}
            {hit('通知', 265, 47, 51, 51, () => show('reminder'))}
          </>}
          {board === 'team' && <>
            {hit(data.checks.includes(today) ? '今日已打卡' : '今日打卡', 179, 282, 39, 96, () => { setData(d => d.checks.includes(today) ? d : { ...d, checks: [...d.checks, today].slice(-3650) }); setMessage('今日打卡成功') }, data.checks.includes(today))}
            {hit('夸夸TA', 257, 656, 103, 33, () => setMessage('已送出鼓励，一起坚持！'))}
            {hit('进入组队聊天室', 20, 768, 353, 64, () => setSheet('组队聊天室'))}
            {hit('管理队伍', 300, 188, 72, 56, () => setSheet('组队打卡'))}
          </>}
          {board === 'ranking' && <>
            {['早餐榜', '健康榜', '早鸟榜', '运动榜'].map((s, i) => hit(s, 57 + i * 75, 116, 65, 29, () => { setRank(s); setMessage(`${s}：当前为原稿示例数据；你的累计打卡 ${data.checks.length} 天`) }))}
            {['周榜', '月榜'].map((s, i) => hit(s, 97 + i * 110, 156, 92, 34, () => { setRank(s); setMessage(`${s} · 我的打卡 ${s === '周榜' ? data.checks.filter(d => d >= localDate(-6)).length : data.checks.filter(d => d.slice(0, 7) === today.slice(0, 7)).length} 天`) }))}
          </>}
          {board === 'me' && <>
            {hit('个人资料', 130, 132, 150, 70, () => show('health'))}
            {hit('健康提醒', 265, 47, 51, 51, () => show('reminder'))}
            {hit('设置', 323, 47, 51, 51, () => setSheet('设置'))}
            {hit('早餐优惠套餐', 20, 223, 353, 129, () => show('event2'))}
            {hit('我的积分', 20, 365, 270, 151, () => show('ranking'))}
            {hit('商城', 300, 365, 73, 151, () => show('event2'))}
            {hit('我的收藏菜单', 16, 536, 361, 48, () => show('breakfast'))}
            {hit('历史订单', 16, 591, 361, 48, () => go('orders'))}
            {hit('帮助与反馈', 16, 646, 361, 48, () => go('feedback'))}
            {hit('关于', 16, 701, 361, 48, () => setSheet('关于'))}
            {hit('更新', 16, 756, 361, 30, () => setMessage('当前已是本机最新版本'))}
            {hit('扫码取餐', 20, 47, 51, 51, () => show('pickup'))}
          </>}
          {board === 'health' && <>
            {hit('修改体重', 160, 143, 197, 64, () => setSheet('体重记录'))}
            {hit('今日摄入', 20, 304, 353, 173, () => show('recipes'))}
            {hit('健康记录', 35, 535, 175, 226, () => { setPage('health'); setBoard(null) })}
            {hit('增加400ml', 232, 823, 55, 22, () => addWater(400))}
            {hit('增加200ml', 294, 823, 55, 22, () => addWater(200))}
            {data.water[today] !== undefined && <output className={styles.waterValue}>{data.water[today]}ml</output>}
            {data.weights.find(w => w.date === today) && <output className={styles.weightValue}>{data.weights.find(w => w.date === today)?.value} KG</output>}
          </>}
          {board === 'reminder' && hit('已知晓', 89, 560, 250, 53, () => show('health'))}
          {(board === 'event1' || board === 'event2') && <>
            {hit('活动说明', 339, 58, 35, 36, () => setSheet('活动规则'))}
            {board === 'event1' && hit('活动排行榜', 286, 127, 86, 38, () => show('ranking'))}
            {hit('参加活动', 45, board === 'event1' ? 729 : 783, 110, 39, () => {
              const event = board === 'event1' ? '早起食光挑战' : '周末早餐分享会'
              setData(d => d.events.includes(event) ? d : { ...d, events: [...d.events, event] }); setMessage('活动参与记录已保存在本机')
            })}
          </>}
          {sheet && <div className={styles.sheetBackdrop} onClick={() => setSheet('')}>
            <section className={styles.sheet} role="dialog" aria-modal="true" aria-label={sheet} onClick={e => e.stopPropagation()}>
              <button className={styles.sheetClose} aria-label="关闭" onClick={() => setSheet('')}>×</button><h2>{sheet}</h2>
              {sheet === '预约信息' ? <form onSubmit={e => { e.preventDefault(); setSheet('') }}>
                <label>取餐日期<input aria-label="取餐日期" type="date" min={today} max={localDate(7)} required value={date} onChange={e => setDate(e.target.value)} /></label>
                <label>预约时间<select value={time} onChange={e => setTime(e.target.value)}>{['07:00', '07:30', '08:00', '08:30', '09:00'].map(t => <option key={t}>{t}</option>)}</select></label>
                <label>取餐点<select value={location} onChange={e => setLocation(e.target.value)}>{locations.map(l => <option key={l}>{l}</option>)}</select></label><button>保存</button>
              </form> : sheet === '组队打卡' ? <><p>{data.team || '创建自己的早餐队伍'}</p><form onSubmit={e => { e.preventDefault(); if (teamName.trim()) { setData(d => ({ ...d, team: teamName.trim() })); show('team') } }}><label>我的队伍名<input required maxLength={24} value={teamName} onChange={e => setTeamName(e.target.value)} /></label><button>创建队伍</button></form><button onClick={() => { setData(d => ({ ...d, team: '元气早八人' })); show('team') }}>加入元气早八人</button>{data.team && <button onClick={() => { setData(d => ({ ...d, team: '' })); setSheet('') }}>退出队伍</button>}</> :
                sheet === '菜品评价' ? currentOrder?.done ? currentOrder.review ? <p>{currentOrder.review.stars} 星 · {currentOrder.review.text}</p> : <Review onSave={(stars, text) => { setData(d => ({ ...d, orders: d.orders.map(o => o.id === currentOrder.id ? { ...o, review: { stars, text } } : o) })); setSheet(''); setMessage('评价已保存') }} /> : <><p>完成取餐后即可评价。</p><button onClick={() => go('orders')}>查看订单</button></> :
                sheet === '体重记录' ? <form onSubmit={e => { e.preventDefault(); const value = Number(weight); if (value >= 20 && value <= 300) { setData(d => ({ ...d, weights: [...d.weights.filter(w => w.date !== today), { date: today, value }].slice(-3650) })); setSheet('') } }}><label>体重（kg）<input type="number" required min="20" max="300" step=".1" value={weight} onChange={e => setWeight(e.target.value)} /></label><button>保存今日体重</button></form> :
                sheet === '搜索菜品' ? <><label>搜索菜品<input value={search} onChange={e => setSearch(e.target.value)} /></label>{foods.filter(f => f.name.includes(search)).map(f => <button key={f.id} onClick={() => { change(f.id, 1); show('menu') }}>{f.name} ¥{f.price}</button>)}</> :
                <><p>{['关于', '设置', '活动规则'].includes(sheet) ? '早早鸟交互演示。原稿示例数据仅供展示；操作记录保存在此浏览器，不产生真实订单、付款或消息。' : '此页面暂无完整原稿。你可以保存本机记录，或返回继续浏览。'}</p><label>记录<textarea value={feedback} maxLength={500} onChange={e => setFeedback(e.target.value)} /></label><button disabled={!feedback.trim() || data.feedback.length >= 100} onClick={() => { setData(d => ({ ...d, feedback: [...d.feedback, `${sheet}：${feedback.trim()}`] })); setFeedback(''); setSheet(''); setMessage('已保存到本机') }}>保存记录</button></>}
            </section>
          </div>}
          {message && <div className={styles.toast} role="status">{message}</div>}
        </section>
      </div>
    </main>
  }
  return <main className={styles.stage}><div className={styles.artShell} style={{ width: 393 * scale, height: 852 * scale }}><div className={styles.phone} style={{ position: 'absolute', width: 393, maxWidth: 'none', height: 852, border: 0, borderRadius: 0, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
    <div className={styles.demo}>EARLY BIRD CLUB <span>交互演示 · 不收取费用</span></div>
    <header className={styles.header}>{!['welcome', 'home', 'community', 'ranking', 'me'].includes(page) && <button aria-label="返回首页" onClick={() => go('home')}>‹</button>}<h1 ref={heading} tabIndex={-1}>{title[page]}<i /></h1>{page === 'home' && <button onClick={() => go('feedback')}>反馈</button>}</header>
    {storageError && <div role="alert" className={styles.notice}>{storageError}</div>}
    <div className={styles.content} ref={content}>
      {!ready ? <><p role="status">正在整理你的早鸟生活…</p><noscript>请启用 JavaScript 后刷新页面，以使用早鸟演示。</noscript></> : page === 'welcome' ? <div className={styles.welcome}>
        <span className={styles.eyebrow}>把每一个早晨，过得热气腾腾</span><img src={asset('早早鸟ip.png')} alt="戴橙色帽子的早早鸟" />
        <h2>早起的鸟儿<br /><em>有饭吃！</em></h2><p>一份好早餐，一群早起搭子。<br />从今天起，把健康变成小小的日常。</p>
        <button className={styles.primary} onClick={() => { setData(d => ({ ...d, entered: true })); go('home') }}>开启早鸟演示 →</button><small>无需登录 · 数据保存在此浏览器 · 无真实付款</small>
      </div> : <>
        {page === 'home' && <>
          <button className={styles.announcement} onClick={() => go('community')}>早鸟集合啦 · 加入每日打卡，点亮好习惯 →</button>
          <section className={styles.hero}><img src={asset('早早鸟ip.png')} alt="早早鸟吉祥物" /><div><small>{today.replaceAll('-', ' / ')}</small><h2>早起的鸟儿<br /><em>有饭吃！</em></h2><span><strong>{data.checks.length}</strong> 天累计打卡</span></div></section>
          <Card warm><div className={styles.row}><h2>每天好好吃早餐</h2><span className={styles.tag}>AM 07:30</span></div><p>热乎的早餐，装满今天的小小能量。</p><div className={styles.row}><div><small>当前计划</small><h3>{data.plan}</h3></div><button className={styles.pill} onClick={() => go('plans')}>切换计划 ↗</button></div><button className={styles.primary} onClick={() => go('menu')}>预定我的早餐 →</button></Card>
          <div className={styles.grid}><button className={styles.tile} onClick={() => { go('orders'); setActiveOrder(latest?.id || '') }}><span>早餐进度</span><strong>{latest ? latest.done ? '已完成取餐' : `${latest.time} 取餐` : '等一份好早餐'}</strong><small>{latest ? '查看模拟取餐码 →' : '查看订单记录 →'}</small></button><button className={`${styles.tile} ${styles.pink}`} onClick={() => go('health')}><span>照顾好自己</span><strong>{data.water[today] || 0} ml</strong><small>记录今天的饮水 →</small></button></div>
          <div className={styles.row}><h2>今日灵感早餐</h2><button className={styles.link} onClick={recommend}>按计划搭配 →</button></div><div className={styles.grid}>{foods.slice(0, 2).map(f => <button className={styles.suggestion} key={f.id} onClick={() => { change(f.id, 1); go('menu') }}><FoodArt food={f} /><strong>{f.name}</strong><small>¥{f.price.toFixed(2)} · 加入早餐</small></button>)}</div>
        </>}
        {page === 'plans' && <><p>跟着自己的节奏，找到喜欢的早餐。</p>{plans.map((plan, i) => <button key={plan} className={`${styles.plan} ${data.plan === plan ? styles.selected : ''}`} aria-pressed={data.plan === plan} onClick={() => choosePlan(plan)}><span className={styles.number}>0{i + 1}</span><span><strong>{plan}</strong><small>{['谷物搭配，开启元气一天', '紫薯与南瓜，简单清爽', '三明治与麦片，丰富一餐'][i]}</small></span><span>{data.plan === plan ? '已选' : '选择'}</span></button>)}<Card><h3>你的推荐搭配</h3><p>{data.plan === '轻盈蔬食' ? '紫薯饼 + 南瓜粥' : data.plan === '运动活力' ? '三明治 × 2 + 麦片' : '紫薯饼 + 玉米粥 + 三明治'}</p><small>演示搭配建议，不构成医疗或营养处方；请留意餐品过敏原。</small><button className={styles.primary} onClick={recommend}>使用搭配并选餐</button></Card></>}
        {page === 'menu' && <><p>选一点喜欢的，把早晨吃得满足。</p><label className={styles.search}>搜索餐品<input type="search" placeholder="搜索紫薯饼、三明治…" value={search} onChange={e => setSearch(e.target.value)} /></label><div className={styles.tabs}>{['全部', '主食', '热粥', '轻食', '点心'].map(c => <button key={c} aria-pressed={category === c} onClick={() => setCategory(c)}>{c}</button>)}</div>
          <div className={styles.grid}>{foods.filter(f => (category === '全部' || f.category === category) && f.name.includes(search.trim())).map(f => <article key={f.id} className={`${styles.food} ${cart[f.id] ? styles.selected : ''}`}><FoodArt food={f} /><h3>{f.name}</h3><small>{f.note}</small><div className={styles.row}><strong>¥{f.price.toFixed(2)}</strong><div className={styles.stepper}><button aria-label={`减少${f.name}`} disabled={!cart[f.id]} onClick={() => change(f.id, -1)}>−</button><output aria-label={`${f.name}数量`}>{cart[f.id] || 0}</output><button aria-label={`增加${f.name}`} disabled={cart[f.id] >= 20} onClick={() => change(f.id, 1)}>+</button></div></div></article>)}</div>
          {!foods.some(f => (category === '全部' || f.category === category) && f.name.includes(search.trim())) && <Card><p>没有找到这道早餐，换个关键词试试。</p><button onClick={() => { setSearch(''); setCategory('全部') }}>查看全部餐品</button></Card>}
          <div className={styles.checkoutBar}><div><small>已选 {count} 份</small><strong>合计 ¥{total(cart).toFixed(2)}</strong></div><button className={styles.primary} disabled={!count} onClick={() => go('checkout')}>下一步 →</button></div>
        </>}
        {page === 'checkout' && <><Card><h2>给明早留一份期待</h2>{foods.filter(f => cart[f.id]).map(f => <p className={styles.row} key={f.id}><span>{f.name} × {cart[f.id]}</span><strong>¥{(f.price * cart[f.id]).toFixed(2)}</strong></p>)}<hr /><p className={styles.row}><span>演示合计</span><strong>¥{total(cart).toFixed(2)}</strong></p><button className={styles.link} onClick={() => go('menu')}>修改餐品</button></Card><form onSubmit={e => { e.preventDefault(); createOrder() }}><Card><label>取餐日期<input type="date" required min={today} max={localDate(7)} value={date} onChange={e => setDate(e.target.value)} /></label><label>预约时间<select value={time} onChange={e => setTime(e.target.value)}>{['07:00', '07:30', '08:00', '08:30', '09:00'].map(t => <option key={t}>{t}</option>)}</select></label><label>取餐点<select value={location} onChange={e => setLocation(e.target.value)}>{locations.map(l => <option key={l}>{l}</option>)}</select></label></Card><p className={styles.notice}>这是演示订单，不会真实备餐、扣款或产生配送。</p><button className={styles.primary} disabled={!count}>确认演示预约 · 无需付款</button></form></>}
        {page === 'orders' && <><div className={styles.tabs}>{['全部', '待取餐', '已完成'].map(f => <button key={f} aria-pressed={orderFilter === f} onClick={() => setOrderFilter(f)}>{f}</button>)}</div>{!data.orders.filter(o => orderFilter === '全部' || o.done === (orderFilter === '已完成')).length && <Card><h2>这里等着你的早餐故事</h2><p>当前没有{orderFilter === '全部' ? '' : orderFilter}订单。</p><button className={styles.primary} onClick={() => go('menu')}>去选早餐</button></Card>}
          {data.orders.filter(o => orderFilter === '全部' || o.done === (orderFilter === '已完成')).map(o => <Card key={o.id}><div className={styles.row}><h3>{o.done ? '已完成' : '待取餐'}</h3><span className={styles.tag}>演示订单</span></div><p>{foods.filter(f => o.items[f.id]).map(f => `${f.name} × ${o.items[f.id]}`).join('、')}</p><small>{o.date} {o.time}<br />{o.location}</small><div className={styles.row}><strong>¥{total(o.items).toFixed(2)}</strong><button className={styles.pill} aria-expanded={activeOrder === o.id} onClick={() => setActiveOrder(activeOrder === o.id ? '' : o.id)}>{activeOrder === o.id ? '收起详情' : o.done ? '查看 / 评价' : '查看取餐码'}</button></div>
            {activeOrder === o.id && <div className={styles.orderDetails}><small>订单号 {o.id}</small>{!o.done ? <><p>模拟取餐码 · 仅供演示</p><strong className={styles.code}>{o.id.slice(0, 8).toUpperCase()}</strong><p>点击下方按钮体验取餐完成，不会操作真实柜机。</p><button className={styles.primary} onClick={() => setData(d => ({ ...d, orders: d.orders.map(x => x.id === o.id ? { ...x, done: true } : x) }))}>模拟取餐完成</button></> : o.review ? <><h3>我的评价 · {o.review.stars} 星</h3><p>{o.review.text}</p><span className={styles.tag}>评价已保存</span></> : <Review onSave={(stars, text) => { setData(d => ({ ...d, orders: d.orders.map(x => x.id === o.id && x.done && !x.review ? { ...x, review: { stars, text } } : x) })); setMessage('谢谢你的评价，已保存在本机') }} />}</div>}
          </Card>)}</>}
        {page === 'community' && <><div className={styles.communityHero}><span className={styles.eyebrow}>GOOD MORNING, TOGETHER</span><h2>一个人早起，<br />一群人坚持。</h2><p>找到你的早餐搭子</p></div><Card warm><div className={styles.row}><h2>每日早鸟打卡</h2><strong>{data.checks.length} 天</strong></div><p>每天来见一面，把好习惯慢慢攒起来。</p><button className={styles.primary} disabled={data.checks.includes(today)} onClick={() => { setData(d => d.checks.includes(today) ? d : { ...d, checks: [...d.checks, today].slice(-3650) }); setMessage('今日打卡成功，明天继续见！') }}>{data.checks.includes(today) ? '今日已打卡 · 明天见' : '点亮今天'}</button></Card>
          <Card><h2>{data.team ? `我的队伍 · ${data.team}` : '一起组个早起局'}</h2><p>{data.team ? '你已加入队伍。每日打卡会计入你的早鸟记录。' : '加入「元气早八人」或创建自己的队伍。队伍关系仅在本机模拟。'}</p>{data.team ? <button className={styles.pill} onClick={() => setData(d => ({ ...d, team: '' }))}>退出队伍</button> : <><button className={styles.primary} onClick={() => setData(d => ({ ...d, team: '元气早八人' }))}>加入元气早八人</button><form onSubmit={e => { e.preventDefault(); if (teamName.trim()) { setData(d => ({ ...d, team: teamName.trim() })); setTeamName('') } }}><label>我的队伍名<input required maxLength={24} value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="例如：不赖床小分队" /></label><button className={styles.pill} disabled={!teamName.trim()}>创建队伍</button></form></>}</Card>
          <h2>好好吃饭，也好好玩</h2>{['早起食光挑战', '周末早餐分享会'].map((event, i) => <Card key={event}><span className={styles.eyebrow}>ACTIVITY 0{i + 1}</span><h3>{event}</h3><p>{i ? '周末 09:00 · 第一食堂，分享你最爱的早餐搭配。' : '每天一次打卡，收集属于自己的元气清晨。'}</p><button className={styles.pill} disabled={data.events.includes(event)} onClick={() => { setData(d => d.events.includes(event) ? d : { ...d, events: [...d.events, event] }); setMessage('演示报名成功，记录已保存') }}>{data.events.includes(event) ? '已报名（演示）' : '免费报名（演示）'}</button></Card>)}</>}
        {page === 'ranking' && <><div className={styles.communityHero}><span className={styles.eyebrow}>EVERY MORNING COUNTS</span><h2>每一个早晨<br />都值得被看见</h2><p>榜单其他成员为演示数据</p></div><div className={styles.tabs}>{['本周', '总榜', '我的队伍'].map(t => <button key={t} aria-pressed={rank === t} onClick={() => setRank(t)}>{t}</button>)}</div>{rank === '我的队伍' && !data.team ? <Card><p>先加入队伍，再一起点亮榜单。</p><button className={styles.primary} onClick={() => go('community')}>去组队</button></Card> : <Card>{[...(rank === '我的队伍' ? [] : [{ name: '橙子同学', score: rank === '本周' ? 6 : 45 }, { name: '不赖床的小林', score: rank === '本周' ? 5 : 38 }, { name: '豆浆加油站', score: rank === '本周' ? 4 : 26 }]), { name: '我', score: rank === '本周' ? data.checks.filter(d => d >= localDate(-6) && d <= today).length : data.checks.length }].sort((a, b) => b.score - a.score).map((r, i) => <div className={styles.rankRow} key={r.name}><span className={styles.number}>{String(i + 1).padStart(2, '0')}</span><strong>{r.name}</strong><span>{r.score} 天</span></div>)}</Card>}</>}
        {page === 'me' && <><section className={styles.profile}><img src={asset('早早鸟ip.png')} alt="早鸟头像" /><div><h2>早安，早鸟体验官</h2><p>{data.plan} · 从一份早餐开始</p></div></section><div className={styles.grid}><Card><strong className={styles.metric}>{data.checks.length}</strong><small>累计打卡 / 天</small></Card><Card><strong className={styles.metric}>{data.orders.filter(o => o.done).length}</strong><small>完成早餐 / 份订单</small></Card></div>{([['health', '个人健康记录', '饮水与体重'], ['orders', '历史订单与评价', `${data.orders.length} 笔演示订单`], ['plans', '个性化早餐计划', data.plan], ['community', '我的队伍与活动', data.team || '寻找早起搭子'], ['feedback', '帮助与反馈', `${data.feedback.length} 条本机反馈`]] as [Page, string, string][]).map(([p, label, sub]) => <button key={p} className={styles.menuRow} onClick={() => go(p)}><span><strong>{label}</strong><small>{sub}</small></span><span>›</span></button>)}<p className={styles.notice}>演示身份 · 记录仅存于此浏览器，不同步账号。</p></>}
        {page === 'health' && <><Card warm><h2>今天也要好好喝水</h2><strong className={styles.metric}>{data.water[today] || 0}<small> ml</small></strong><p>按实际饮水量记录，不设统一健康目标。</p><button className={styles.primary} disabled={(data.water[today] || 0) >= 10000} onClick={() => setData(d => ({ ...d, water: { ...d.water, [today]: Math.min(10000, (d.water[today] || 0) + 250) } }))}>记录一杯水 +250 ml</button><button className={styles.link} disabled={!data.water[today]} onClick={() => setData(d => ({ ...d, water: { ...d.water, [today]: Math.max(0, (d.water[today] || 0) - 250) } }))}>撤回一杯</button></Card><Card><h2>记录今天的体重</h2><form onSubmit={e => { e.preventDefault(); const value = Number(weight); if (Number.isFinite(value) && value >= 20 && value <= 300) { setData(d => ({ ...d, weights: [...d.weights.filter(w => w.date !== today), { date: today, value }].slice(-3650) })); setMessage('今日体重已保存'); setWeight('') } }}><label>体重（kg）<input required type="number" min="20" max="300" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} placeholder="例如 55.5" /></label><button className={styles.primary}>保存今日体重</button></form><small>同一天再次保存会更新当日记录。</small></Card><Card><h2>最近健康记录</h2>{Array.from(new Set([...Object.keys(data.water), ...data.weights.map(w => w.date)])).sort().reverse().slice(0, 14).map(d => <p key={d} className={styles.row}><span>{d}</span><span>{data.water[d] || 0} ml · {data.weights.find(w => w.date === d)?.value ?? '未记录'} kg</span></p>)}{!data.weights.length && !Object.keys(data.water).length && <p>还没有记录，从今天的第一杯水开始吧。</p>}</Card></>}
        {page === 'feedback' && <><Card><h2>关于这次演示</h2><p>选餐 → 预约 → 查看模拟取餐码 → 模拟取餐 → 评价，即可体验完整早餐流程。</p><p>订单、组队、活动报名均为本地模拟，不会发送到商家或客服。清除浏览器数据会删除记录。</p></Card><Card><form onSubmit={e => { e.preventDefault(); if (feedback.trim() && data.feedback.length < 100) { setData(d => ({ ...d, feedback: [...d.feedback, feedback.trim()] })); setFeedback(''); setMessage('反馈已保存在本机，未发送给客服') } }}><label>你的建议<textarea required maxLength={500} value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="哪里可以做得更好？" /></label><button className={styles.primary} disabled={!feedback.trim() || data.feedback.length >= 100}>保存演示反馈</button></form></Card>{data.feedback.length > 0 && <Card><h3>已保存的反馈</h3>{data.feedback.map((f, i) => <p key={i}>{f}</p>)}</Card>}</>}
      </>}
    </div>
    {message && <div className={styles.toast} role="status">{message}</div>}
    {page !== 'welcome' && <nav className={styles.nav} aria-label="主导航">{([['home', '首页', '⌂'], ['community', '社区', '◷'], ['ranking', '榜单', '▥'], ['me', '我的', '○']] as [Page, string, string][]).map(([p, label, icon]) => <button key={p} aria-current={page === p ? 'page' : undefined} onClick={() => go(p)}><span aria-hidden="true">{icon}</span>{label}</button>)}</nav>}
  </div></div></main>
}
