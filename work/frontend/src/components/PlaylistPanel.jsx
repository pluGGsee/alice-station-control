import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Music2, Pencil, ListMusic } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import PlaylistModal from './PlaylistModal'

export default function PlaylistPanel() {
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPlaylist, setSelectedPlaylist] = useState(null)
  // Пользовательские обложки из localStorage
  const [customCovers, setCustomCovers] = useState(() => {
    try { return JSON.parse(localStorage.getItem('playlist_covers') || '{}') } catch { return {} }
  })
  const fileInputRef = useRef(null)
  const uploadingKindRef = useRef(null)

  useEffect(() => {
    axios.get('/api/music/playlists')
      .then(({ data }) => setPlaylists(data.playlists || []))
      .catch(() => toast.error('Не удалось загрузить плейлисты'))
      .finally(() => setLoading(false))
  }, [])

  function getCover(playlist) {
    return customCovers[playlist.id] || playlist.cover_url || null
  }

  function handleCoverClick(e, kind) {
    e.stopPropagation()
    uploadingKindRef.current = kind
    fileInputRef.current?.click()
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file || !uploadingKindRef.current) return
    e.target.value = ''

    const kind = uploadingKindRef.current
    const formData = new FormData()
    formData.append('kind', kind)
    formData.append('file', file)

    try {
      const { data } = await axios.post('/api/music/playlist-cover', formData)
      const newCovers = { ...customCovers, [kind]: data.url + '?t=' + Date.now() }
      setCustomCovers(newCovers)
      localStorage.setItem('playlist_covers', JSON.stringify(newCovers))
      toast.success('Обложка обновлена')
    } catch {
      // Fallback — сохраняем как base64 в localStorage
      const reader = new FileReader()
      reader.onload = () => {
        const newCovers = { ...customCovers, [kind]: reader.result }
        setCustomCovers(newCovers)
        localStorage.setItem('playlist_covers', JSON.stringify(newCovers))
        toast.success('Обложка обновлена')
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="flex-1 flex flex-col p-4 gap-3 min-h-0">
      <div className="flex items-center justify-between px-1">
        <p className="text-xs font-medium text-white/40 uppercase tracking-widest">
          Мои плейлисты
        </p>
        <ListMusic size={14} className="text-white/30" />
      </div>

      {/* Скрытый input для загрузки файла */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex flex-col gap-1.5 overflow-y-auto">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 rounded-2xl bg-white/8 animate-pulse" />
          ))
        ) : playlists.length === 0 ? (
          <p className="text-xs text-white/30 text-center py-4">Нет плейлистов</p>
        ) : (
          playlists.map((pl, i) => (
            <motion.div
              key={pl.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => setSelectedPlaylist(pl)}
              className="relative flex items-center gap-3 px-3 py-2.5 rounded-2xl cursor-pointer group transition-all hover:bg-white/12 active:bg-white/16"
            >
              {/* Обложка */}
              <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-white/10 flex-shrink-0">
                {getCover(pl) ? (
                  <img src={getCover(pl)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music2 size={16} className="text-white/30" />
                  </div>
                )}
                {/* Кнопка редактирования обложки */}
                <motion.button
                  onClick={(e) => handleCoverClick(e, pl.id)}
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Pencil size={11} className="text-white" />
                </motion.button>
              </div>

              {/* Инфо */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white/85 truncate leading-snug">
                  {pl.title}
                </p>
                <p className="text-xs text-white/35 mt-0.5">{pl.track_count} треков</p>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Модальное окно */}
      <AnimatePresence>
        {selectedPlaylist && (
          <PlaylistModal
            playlist={selectedPlaylist}
            onClose={() => setSelectedPlaylist(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
