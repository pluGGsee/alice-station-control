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
    } catch { toast.error('Ошибка') }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ background:'rgba(0,0,0,0.30)', backdropFilter:'blur(12px)' }}
    >
      <motion.div
        className="w-full max-w-md max-h-[75vh] flex flex-col rounded-3xl overflow-hidden"
        initial={{ scale:0.93, opacity:0, y:16 }}
        animate={{ scale:1, opacity:1, y:0 }}
        exit={{ scale:0.93, opacity:0, y:16 }}
        transition={{ type:'spring', damping:26, stiffness:320 }}
        style={{ background:'rgba(225,225,228,0.94)', backdropFilter:'blur(28px)', border:'1px solid rgba(255,255,255,0.80)', boxShadow:'0 24px 60px rgba(0,0,0,0.18)' }}
      >
        {/* Шапка */}
        <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom:'1px solid rgba(0,0,0,0.07)' }}>
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-black/8 flex-shrink-0">
            {playlist.cover_url
              ? <img src={playlist.cover_url} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center"><Music2 size={16} className="text-[#8e8e93]"/></div>
            }
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-[#1c1c1e] text-sm truncate">{playlist.title}</h2>
            <p className="text-xs text-[#8e8e93]">{playlist.track_count} треков · показаны первые 50</p>
          </div>
          <motion.button onClick={onClose} whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }}
            className="g-btn w-8 h-8 rounded-xl flex items-center justify-center">
            <X size={14} className="text-[#3a3a3c]"/>
          </motion.button>
        </div>

        {/* Список */}
        <div className="flex-1 overflow-y-auto py-2">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <motion.div className="w-6 h-6 border-2 border-[rgba(0,0,0,0.15)] border-t-[#3a3a3c] rounded-full"
                animate={{ rotate:360 }} transition={{ duration:0.8, repeat:Infinity, ease:'linear' }} />
            </div>
          ) : tracks.length === 0 ? (
            <p className="text-center text-[#8e8e93] text-sm py-8">Плейлист пуст</p>
          ) : (
            tracks.map((track, i) => (
              <motion.button key={track.id} onClick={() => handlePlay(track)}
                initial={{ opacity:0, x:-6 }} animate={{ opacity:1, x:0 }} transition={{ delay: i*0.02 }}
                className="g-row w-full flex items-center gap-3 px-4 py-2.5 text-left group transition-colors">
                <div className="w-9 h-9 rounded-xl overflow-hidden bg-black/8 flex-shrink-0 relative">
                  {track.cover_url
                    ? <img src={track.cover_url} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><Music2 size={13} className="text-[#8e8e93]"/></div>
                  }
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-all">
                    <Play size={11} className="text-white opacity-0 group-hover:opacity-100 ml-0.5"/>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1c1c1e] truncate">{track.title}</p>
                  <p className="text-xs text-[#8e8e93] truncate">{track.artist}</p>
                </div>
                <span className="text-xs text-[#aeaeb2] flex-shrink-0 tabular-nums">{msToMin(track.duration_ms)}</span>
              </motion.button>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
