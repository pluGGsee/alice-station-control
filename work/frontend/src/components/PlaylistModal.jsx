import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Music2, Play } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

function msToMin(ms) {
  if (!ms) return ''
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export default function PlaylistModal({ playlist, onClose }) {
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`/api/music/playlist-tracks?kind=${playlist.id}`)
      .then(({ data }) => setTracks(data.tracks || []))
      .catch(() => toast.error('Не удалось загрузить треки'))
      .finally(() => setLoading(false))
  }, [playlist.id])

  async function handlePlay(track) {
    try {
      await axios.post('/api/command', { text: `включи ${track.title} ${track.artist}` })
      toast.success(`▶ ${track.title}`)
      onClose()
    } catch {
      toast.error('Ошибка запуска')
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
        style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)' }}
      >
        <motion.div
          className="w-full max-w-md max-h-[80vh] flex flex-col rounded-3xl overflow-hidden"
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 24, stiffness: 300 }}
          style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.95)', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}
        >
          {/* Шапка модального */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-black/8">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-purple-100 flex-shrink-0">
              {playlist.cover_url ? (
                <img src={playlist.cover_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music2 size={18} className="text-purple-400" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-slate-800 text-sm truncate">{playlist.title}</h2>
              <p className="text-xs text-slate-400">{playlist.track_count} треков</p>
            </div>
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-8 h-8 rounded-xl bg-black/6 hover:bg-black/12 flex items-center justify-center transition-colors"
            >
              <X size={15} className="text-slate-500" />
            </motion.button>
          </div>

          {/* Список треков */}
          <div className="flex-1 overflow-y-auto py-2">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <motion.div
                  className="w-6 h-6 border-2 border-purple-200 border-t-purple-600 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                />
              </div>
            ) : tracks.length === 0 ? (
              <p className="text-center text-slate-400 text-sm py-8">Плейлист пуст</p>
            ) : (
              tracks.map((track, i) => (
                <motion.button
                  key={track.id}
                  onClick={() => handlePlay(track)}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.025 }}
                  whileHover={{ backgroundColor: 'rgba(124,58,237,0.06)' }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left group transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl overflow-hidden bg-purple-50 flex-shrink-0 relative">
                    {track.cover_url ? (
                      <img src={track.cover_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music2 size={14} className="text-purple-300" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-purple-600/0 group-hover:bg-purple-600/20 flex items-center justify-center transition-all">
                      <Play size={12} className="text-white opacity-0 group-hover:opacity-100 transition-opacity ml-0.5" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate group-hover:text-purple-700 transition-colors">
                      {track.title}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{track.artist}</p>
                  </div>
                  <span className="text-xs text-slate-300 flex-shrink-0 tabular-nums">
                    {msToMin(track.duration_ms)}
                  </span>
                </motion.button>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
