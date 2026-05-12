import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Music2, Pencil, ListMusic } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import PlaylistModal from './PlaylistModal'

const panelStyle = {
  background: 'rgba(255,255,255,0.58)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(255,255,255,0.75)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
}

export default function PlaylistPanel() {
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPlaylist, setSelectedPlaylist] = useState(null)
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

  function getCover(pl) {
    return customCovers[pl.id] || pl.cover_url || null
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
      const covers = { ...customCovers, [kind]: data.url + '?t=' + Date.now() }
      setCustomCovers(covers)
      localStorage.setItem('playlist_covers', JSON.stringify(covers))
      toast.success('Обложка обновлена')
    } catch {
      const reader = new FileReader()
      reader.onload = () => {
        const covers = { ...customCovers, [kind]: reader.result }
        setCustomCovers(covers)
        localStorage.setItem('playlist_covers', JSON.stringify(covers))
        toast.success('Обложка обновлена')
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <>
      <div className="rounded-3xl p-5 flex flex-col gap-3" style={panelStyle}>
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Мои плейлисты</p>
          <ListMusic size={14} className="text-slate-400" />
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

        <div className="flex flex-col gap-1">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 rounded-2xl bg-white/40 animate-pulse" />
            ))
          ) : playlists.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">Нет плейлистов</p>
          ) : (
            playlists.map((pl, i) => (
              <motion.div
                key={pl.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => setSelectedPlaylist(pl)}
                whileHover={{ x: 4, backgroundColor: 'rgba(124,58,237,0.05)' }}
                className="relative flex items-center gap-3 px-2 py-2.5 rounded-2xl cursor-pointer transition-colors group"
              >
                {/* Обложка */}
                <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-purple-50 flex-shrink-0 shadow-sm">
                  {getCover(pl) ? (
                    <img src={getCover(pl)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music2 size={16} className="text-purple-300" />
                    </div>
                  )}
                  <motion.button
                    onClick={(e) => handleCoverClick(e, pl.id)}
                    initial={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Pencil size={10} className="text-white" />
                  </motion.button>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate group-hover:text-purple-700 transition-colors">
                    {pl.title}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{pl.track_count} треков</p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Модальное окно — поверх всей рабочей области */}
      <AnimatePresence>
        {selectedPlaylist && (
          <PlaylistModal
            playlist={selectedPlaylist}
            onClose={() => setSelectedPlaylist(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
