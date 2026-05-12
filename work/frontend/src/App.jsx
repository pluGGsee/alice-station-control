import { useState, useEffect, useCallback } from 'react'
import { Toaster } from 'react-hot-toast'
import axios from 'axios'

import StatusBadge from '@/components/StatusBadge'
import PlayerCard from '@/components/PlayerCard'
import SearchBlock from '@/components/SearchBlock'
import AliceInput from '@/components/AliceInput'
import PlaylistPanel from '@/components/PlaylistPanel'
import QuickCommands from '@/components/QuickCommands'

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
    <div className="min-h-screen flex flex-col" style={{ background: '#c4c4c8' }}>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: '14px',
            background: 'rgba(255,255,255,0.88)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.9)',
            color: '#1a1a1a',
            fontSize: '13px',
            fontFamily: 'Inter, sans-serif',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          },
        }}
      />

      {/* Шапка */}
      <header style={{
        background: 'rgba(255,255,255,0.55)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.7)',
      }} className="px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-md shadow-purple-300">
            А
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-800 leading-none tracking-tight">Alice Station</h1>
            <p className="text-xs text-slate-500 mt-0.5">Яндекс Станция Миди</p>
          </div>
        </div>
        <StatusBadge online={status.online} aliceState={status.aliceState} />
      </header>

      {/* Основной layout — 2 колонки */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">

        {/* ЛЕВАЯ панель — Алиса + плеер */}
        <div className="w-[420px] flex-shrink-0 flex flex-col gap-4 overflow-y-auto">

          {/* Алиса */}
          <div style={{
            background: 'rgba(255,255,255,0.58)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.75)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          }} className="rounded-3xl overflow-hidden">
            <AliceInput />
          </div>

          {/* Плеер */}
          <PlayerCard
            status={status}
            track={status.track}
            volumeValue={volumeValue}
            onVolumeChange={(v) => setStatus(s => ({ ...s, volume: v / 10 }))}
          />
        </div>

        {/* ПРАВАЯ панель — команды + плейлисты + поиск */}
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto min-w-0">

          {/* Быстрые команды */}
          <QuickCommands />

          {/* Плейлисты */}
          <PlaylistPanel />

          {/* Поиск */}
          <SearchBlock />
        </div>
      </div>
    </div>
  )
}
