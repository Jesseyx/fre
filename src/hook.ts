import { update, isFn, getCurrentFiber } from './reconcile'
import {
  DependencyList,
  Reducer,
  IFiber,
  Dispatch,
  SetStateAction,
  EffectCallback,
  HookTypes,
  RefObject,
  IEffect,
} from './type'
let cursor = 0

export const resetCursor = () => {
  cursor = 0
}

export const useState = <T>(initState: T): [T, Dispatch<SetStateAction<T>>] => {
  return useReducer(null, initState)
}

export const useReducer = <S, A>(
  reducer?: Reducer<S, A>,
  initState?: S
): [S, Dispatch<A>] => {
  const [hook, current]: [any, IFiber] = getHook<S>(cursor++) // currentFiber
  if (hook.length === 0) {
    hook[0] = initState
    hook[1] = (value: A | Dispatch<A>) => {
      hook[0] = reducer
        ? reducer(hook[0], value as any)
        : isFn(value)
          ? value(hook[0])
          : value
      update(current) // 后序更新时只更新当前组件
    }
  }
  return hook
}

export const useEffect = (cb: EffectCallback, deps?: DependencyList): void => {
  return effectImpl(cb, deps!, "effect")
}

export const useLayout = (cb: EffectCallback, deps?: DependencyList): void => { // useLayoutEffect
  return effectImpl(cb, deps!, "layout")
}

const effectImpl = ( // mountEffectImpl
  cb: EffectCallback,
  deps: DependencyList,
  key: HookTypes
): void => {
  const [hook, current] = getHook(cursor++)
  if (isChanged(hook[1], deps)) {
    hook[0] = cb
    hook[1] = deps
    current.hooks[key].push(hook) // side 阶段执行完会置空，所以变化执行后需要重新添加
  }
}

export const useMemo = <S = Function>(
  cb: () => S,
  deps?: DependencyList
): S => {
  const hook = getHook<S>(cursor++)[0]
  if (isChanged(hook[1], deps!)) {
    hook[1] = deps
    return (hook[0] = cb())
  }
  return hook[0]
}

export const useCallback = <T extends (...args: any[]) => void>(
  cb: T,
  deps?: DependencyList
): T => {
  return useMemo(() => cb, deps)
}

export const useRef = <T>(current: T): RefObject<T> => {
  return useMemo(() => ({ current }), [])
}

export const getHook = <S = Function | undefined, Dependency = any>(
  cursor: number
): [[S, Dependency], IFiber] => {
  const current: IFiber<any> = getCurrentFiber()
  const hooks =
    current.hooks || (current.hooks = { list: [], effect: [], layout: [] })
  if (cursor >= hooks.list.length) {
    hooks.list.push([] as IEffect)
  }
  return [(hooks.list[cursor] as unknown) as [S, Dependency], current]
}

export const isChanged = (a: DependencyList, b: DependencyList) => {
  return !a || a.length !== b.length || b.some((arg, index) => !Object.is(arg, a[index]))
}
