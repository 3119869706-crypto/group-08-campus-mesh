import type { ChatMessage } from './chat-types'

const DB_NAME = 'campusmesh'
const DB_VERSION = 1
const STORE = 'messages'

let dbPromise: Promise<IDBDatabase> | null = null

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)

    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' })
        store.createIndex('by_conversation', 'conversationId', { unique: false })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })

  return dbPromise
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDB().then(
    db =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode)
        const req = run(t.objectStore(STORE))
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
      })
  )
}

export async function getMessages(conversationId: string): Promise<ChatMessage[]> {
  const db = await openDB()
  return new Promise<ChatMessage[]>((resolve, reject) => {
    const t = db.transaction(STORE, 'readonly')
    const idx = t.objectStore(STORE).index('by_conversation')
    const req = idx.getAll(IDBKeyRange.only(conversationId))
    req.onsuccess = () => {
      const list = (req.result as ChatMessage[]).sort((a, b) => a.ts - b.ts)
      resolve(list)
    }
    req.onerror = () => reject(req.error)
  })
}

export function putMessage(message: ChatMessage): Promise<IDBValidKey> {
  return tx('readwrite', store => store.put(message))
}

export function putMessages(messages: ChatMessage[]): Promise<void> {
  return openDB().then(
    db =>
      new Promise<void>((resolve, reject) => {
        const t = db.transaction(STORE, 'readwrite')
        const store = t.objectStore(STORE)
        messages.forEach(m => store.put(m))
        t.oncomplete = () => resolve()
        t.onerror = () => reject(t.error)
      })
  )
}

export async function countMessages(): Promise<number> {
  const db = await openDB()
  return new Promise<number>((resolve, reject) => {
    const t = db.transaction(STORE, 'readonly')
    const req = t.objectStore(STORE).count()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}
