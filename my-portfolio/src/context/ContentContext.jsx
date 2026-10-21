import { useCallback, useMemo, useState } from 'react'
import { ContentContext } from './useContent.js'
import {
  clearDraft,
  hasDraft,
  loadDraft,
  loadPublished,
  publish,
  resetPublished,
  saveDraft,
} from '../lib/contentStore'

export function ContentProvider({ children }) {
  const [content, setContent] = useState(() => loadPublished())
  const [dirty, setDirty] = useState(() => hasDraft())

  /** Update a nested value using a path array, e.g. ['home', 'title']. */
  const update = useCallback((path, value) => {
    setContent((current) => {
      const next = { ...current }
      let cursor = next
      for (let i = 0; i < path.length - 1; i += 1) {
        const key = path[i]
        cursor[key] = { ...(cursor[key] || {}) }
        cursor = cursor[key]
      }
      cursor[path[path.length - 1]] = value
      saveDraft(next)
      return next
    })
    setDirty(true)
  }, [])

  /** Replace an entire list (stats, skills, contact items). */
  const updateList = useCallback((path, list) => {
    update(path, list)
  }, [update])

  /**
   * Swap the whole content tree, keeping the draft in sync. Used when
   * importing a file or after a GitHub sync replaces embedded images with
   * their committed paths.
   */
  const replaceContent = useCallback((next) => {
    saveDraft(next)
    setContent(next)
    setDirty(true)
  }, [])

  const publishNow = useCallback(() => {
    setContent((current) => {
      publish(current)
      clearDraft()
      return current
    })
    setDirty(false)
  }, [])

  const discardDraft = useCallback(() => {
    clearDraft()
    const published = loadPublished()
    setContent(published)
    setDirty(false)
  }, [])

  const resetAll = useCallback(() => {
    const fresh = resetPublished()
    setContent(fresh)
    setDirty(false)
  }, [])

  const reloadDraft = useCallback(() => {
    const draft = loadDraft()
    if (draft) {
      setContent(draft)
      setDirty(true)
    }
  }, [])

  const value = useMemo(
    () => ({
      content,
      setContent,
      replaceContent,
      update,
      updateList,
      dirty,
      publish: publishNow,
      discardDraft,
      resetAll,
      reloadDraft,
    }),
    [content, replaceContent, update, updateList, dirty, publishNow, discardDraft, resetAll, reloadDraft],
  )

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>
}
