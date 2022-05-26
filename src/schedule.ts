import { IFiber, ITask, ITaskCallback } from './type'

const queue: ITask[] = [] // 外部回调
const threshold: number = 5
const transitions = [] // 内部微任务变换
let deadline: number = 0

export const startTransition = cb => {
  transitions.push(cb) && translate()
}

export const schedule = (callback: any): void => {
  queue.push({ callback } as any)
  startTransition(flush)
}

const task = (pending: boolean) => {
  // 默认使用微任务，当运行缓慢（cb 执行超过 5ms）使用宏任务
  const cb = () => transitions.splice(0, 1).forEach(c => c())
  if (!pending && typeof Promise !== 'undefined') {
    // Todo queueMicrotask
    return () => queueMicrotask(cb) // 微任务
  }
  if (typeof MessageChannel !== 'undefined') { // 宏任务
    const { port1, port2 } = new MessageChannel()
    port1.onmessage = cb
    return () => port2.postMessage(null)
  }
  return () => setTimeout(cb)
}

let translate = task(false)

const flush = (): void => {
  deadline = getTime() + threshold
  let job = peek(queue)
  while (job && !shouldYield()) { // 计算 job 执行的耗时，一定时间内未做完，下次再做
    const { callback } = job as any
    job.callback = null
    const next = callback()
    if (next) {
      job.callback = next as any
    } else {
      queue.shift()
    }
    job = peek(queue)
  }
  job && (translate = task(shouldYield())) && startTransition(flush)
}

export const shouldYield = (): boolean => { // 是否等待
  return getTime() >= deadline
}

export const getTime = () => performance.now()

const peek = (queue: ITask[]) => queue[0]