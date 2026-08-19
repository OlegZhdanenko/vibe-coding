import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Restores scroll on navigation and honours `/#section` links coming from other
 * routes, where the target element does not exist until after the route renders.
 */
export function ScrollManager() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
      return
    }

    // Wait a frame so the destination route has painted its sections.
    const frame = requestAnimationFrame(() => {
      const target = document.querySelector(hash)
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
    return () => cancelAnimationFrame(frame)
  }, [pathname, hash])

  return null
}
