import { useState, useEffect, useCallback } from 'react'
import { Toaster } from 'react-hot-toast'
import axios from 'axios'

import StatusBadge from '@/components/StatusBadge'
import PlayerCard from '@/components/PlayerCard'
import QuickCommands from '@/components/QuickCommands'
import SearchBlock from '@/components/SearchBlock'
import AliceInput from '@/components/AliceInput'
import PlaylistPanel from '@/components/PlaylistPanel'

export default function App() {
  const [status, setStatus] = useState({
    online: false, playing: false, volume: 0, aliceState: 'IDLE', track: null
  })

  const fetchStatus = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/status')
      setStatus(data)
    } catch {
      setStatus(s => ({ ...s, online: false }))
    }
  }, [])

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 5000)
    return () => clearInterval(interval)
  }, [fetchStatus])

  const volumeValue = Math.round((status.volume ?? 0) * 10)

  return (
    <div className="min-h-screen flex flex-col">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: '14px',
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.8)',
            color: '#1a1a1a',
            fontSize: '13px',
            fontFamily: 'Inter, sans-serif',
          },
        }}
      />

      {/* Шапка */}
      <header className="glass-panel border-b border-white/50 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-md">
            А
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-800 leading-none">Alice Station</h1>
            <p className="text-xs text-slate-500 mt-0.5">Яндекс Станция Миди</p>
          </div>
        </div>
        <StatusBadge online={status.online} aliceState={status.aliceState} />
      </header>

      {/* Основной layout */}
      <div className="flex flex-1 overflow-hidden">

        {/* Левый sidebar */}
        <aside className="glass-sidebar w-80 flex-shrink-0 flex flex-col overflow-y-auto">
          <AliceInput />
          <div className="h-px bg-white/10 mx-4" />
          <PlaylistPanel />
        </aside>

        {/* Правая панель */}
        <main className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          <PlayerCard
            status={status}
            track={status.track}
            volumeValue={volumeValue}
            onVolumeChange={(v) => setStatus(s => ({ ...s, volume: v / 10 }))}
          />
          <QuickCommands />
          <SearchBlock />
        </main>
      </div>
    </div>
  )
}
