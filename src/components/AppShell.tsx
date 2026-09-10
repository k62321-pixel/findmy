import type { ReactNode } from 'react'
import { AppHeader } from './AppHeader'
import { BottomNav } from './BottomNav'

interface AppShellProps {
  title: string
  back?: boolean
  headerActions?: boolean
  /** Hide the tab bar on full-screen flows such as the detail view. */
  nav?: boolean
  children: ReactNode
}

/** Fixed header + scrolling main + tab bar; page content gets the 1200px reading column. */
export function AppShell({ title, back = false, headerActions = true, nav = true, children }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader title={title} back={back} actions={headerActions} />
      <main className={`flex-1 pt-16 ${nav ? 'pb-24' : 'pb-0'}`}>
        <div className="mx-auto w-full max-w-container">{children}</div>
      </main>
      {nav ? <BottomNav /> : null}
    </div>
  )
}
