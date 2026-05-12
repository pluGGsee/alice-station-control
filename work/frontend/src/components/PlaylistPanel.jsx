import { useState, useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { Music2, Pencil } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import PlaylistModal from './PlaylistModal'

export default function PlaylistPanel() {
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [customCovers, setCustomCovers] = useState(() => {
    try { return JSON.parse(localStorage.getItem('playlist_covers') || '{}') } catch { return {} }
  })
  const kindRef = useRef(null)

  useEffect(() => {
    axios.get('/api/music/playlists')
      .then(({ data }) => setPlaylists(data.playlists || []))
      .catch(() => toast.error('Не удалось загрузить плейлисты'))
      .finally(() => setLoading(false))
  }, [])

  function cover(pl) { return customCovers[pl.id] || null }

  function onCoverClick(e, id) {
    e.stopPropagation()
    kindRef.current = id
    // Создаём input динамически — не держим в DOM
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (ev) => {
      const file = ev.target.files?.[0]
      if (!file) return
      const fd = new FormData(); fd.append('kind', id); fd.append('file', file)
      try {
        const { data } = await axios.post('/api/music/playlist-cover', fd)
        const c = { ...customCovers, [id]: data.url + '?t=' + Date.now() }
        setCustomCovers(c); localStorage.setItem('playlist_covers', JSON.stringify(c))
        toast.success('Обложка обновлена')
      } catch {
        const reader = new FileReader()
        reader.onload = () => {
          const c = { ...customCovers, [id]: reader.result }
          setCustomCovers(c); localStorage.setItem('playlist_covers', JSON.stringify(c))
          toast.success('Обложка обновлена')
        }
        reader.readAsDataURL(file)
      }
    }
    // setTimeout чтобы не блокировать текущий event
    setTimeout(() => input.click(), 0)
  }

  return (
    <>
      <div className="g-panel rounded-3xl p-5 flex flex-col gap-2">
        <p className="text-xs font-semibold text-[#8e8e93] uppercase tracking-widest mb-1">Мои плейлисты</p>

        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <motion.div key={i}
              className="h-20 rounded-2xl g-skeleton"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: i * 0.08 }}
            />
          ))
        ) : playlists.length === 0 ? (
          <p className="text-sm text-[#6e6e73] text-center py-3">Нет плейлистов</p>
        ) : (
          playlists.map((pl, i) => (
            <motion.div key={pl.id}
              initial={{ opacity: 0, x: 12, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 280, damping: 28, delay: i * 0.07 }}
              onClick={() => setSelected(pl)}
              whileHover={{ x: 4, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              transition2={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="g-row flex items-center gap-4 px-3 py-3 rounded-2xl cursor-pointer group"
              style={{ willChange: 'transform' }}
            >
              <motion.div
                className="relative w-14 h-14 rounded-2xl overflow-hidden bg-black/8 flex-shrink-0 shadow-sm"
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                {cover(pl) ? (
                  <img src={cover(pl)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music2 size={22} className="text-[#8e8e93]" />
                  </div>
                )}
                <motion.button
                  onClick={(e) => onCoverClick(e, pl.id)}
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-2xl"
                >
                  <Pencil size={13} className="text-white" />
                </motion.button>
              </motion.div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold text-[#1c1c1e] truncate">{pl.title}</p>
                <p className="text-sm text-[#555558] mt-0.5">{pl.track_count} треков</p>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {selected && <PlaylistModal playlist={selected} onClose={() => setSelected(null)} />}
    </>
  )
}
