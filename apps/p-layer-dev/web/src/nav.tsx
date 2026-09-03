import { createContext, useContext } from 'react'

/**
 * 页面间跳转。旧版靠全局单例 + 直接 click 别人的导航按钮互相调，
 * 这里收敛成一条受控的 navigate()。
 */
export type NavValue = {
  route: string
  navigate: (route: string) => void
}

const NavContext = createContext<NavValue | null>(null)

export const NavProvider = NavContext.Provider

export function useNav(): NavValue {
  const ctx = useContext(NavContext)
  if (!ctx) throw new Error('useNav must be used inside NavProvider')
  return ctx
}
