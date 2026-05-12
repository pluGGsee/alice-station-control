import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { Toaster } from 'react-hot-toast'
import axios from 'axios'

import StatusBadge from '@/components/StatusBadge'
import PlayerCard from '@/components/PlayerCard'
import TTSBlock from '@/components/TTSBlock'
import QuickCommands from '@/components/QuickCommands'
import SearchBlock from '@/components/SearchBlock'

// Three.js грузим лениво — не блокирует первую отрисовку
const StationModel = lazy(() => import('@/components/StationModel'))

export default function App() {
  const [status, setStatus] = useState({ online: false, playing: false, volume: 0, aliceState: 'IDLE' })
  const [track, setTrack] = useState(null)

  const fetchStatus = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/status')
      setStatus(data)
    } catch {
      setStatus(s => ({ ...s, online: false }))
    }
  }, [])

  const fetchTrack = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/music/current')
      setTrack(data && data.title ? data : null)
    } catch {
      setTrack(null)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
    fetchTrack()
    const statusInterval = setInterval(fetchStatus, 5000)
    const trackInterval = setInterval(fetchTrack, 8000)
    return () => {
      clearInterval(statusInterval)
      clearInterval(trackInterval)
    }
  }, [fetchStatus, fetchTrack])

  return (
    <div className="min-h-screen p-4 md:p-8">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: '16px',
            background: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.6)',
            color: '#374151',
            fontSize: '14px',
          },
        }}
      />

      {/* Шапка */}
      <div className="max-w-6xl mx-auto mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Alice Station
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Яндекс Станция Миди</p>
        </div>
        <StatusBadge online={status.online} aliceState={status.aliceState} />
      </div>

      {/* Основной layout */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">

        {/* Левая колонка — 3D модель */}
        <div className="bg-white/40 backdrop-blur-xl border border-white/40 shadow-xl rounded-3xl overflow-hidden min-h-[480px] lg:min-h-0">
          <Suspense fallback={
            <div className="w-full h-full flex items-center justify-center text-slate-300 text-4xl">
              🎵
            </div>
          }>
            <StationModel isPlaying={status.playing} />
          </Suspense>
        </div>

        {/* Правая колонка — управление */}
        <div className="flex flex-col gap-4">
          <PlayerCard
            status={status}
            track={track}
            onVolumeChange={(v) => setStatus(s => ({ ...s, volume: v / 10 }))}
            volumeValue={Math.round((status.volume ?? 0) * 10)}
          />
          <TTSBlock />
          <QuickCommands />
          <SearchBlock />
        </div>
      </div>
    </div>
  )
}
