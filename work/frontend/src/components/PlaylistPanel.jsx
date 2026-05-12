import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
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
  const fileRef = useRef(null)
  const kindRef = useRef(null)

  useEffect(() => {
    axios.get('/api/music/playlists')
      .then(({ data }) => setPlaylists(data.playlists || []))
      .catch(() => toast.error('Не удалось загрузить плейлисты'))
      .finally(() => setLoading(false))
  }, [])

  function cover(pl) { return customCovers[pl.id] || null }

  function onCoverClick(e, id) { e.stopPropagation(); kindRef.current = id; fileRef.current?.click() }

  async function onFile(e) {
    const file = e.target.files?.[0]
    if (!file || !kindRef.current) return
    e.target.value = ''
    const id = kindRef.current
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

  return (
    <>
      <div className="g-panel rounded-3xl p-5 flex flex-col gap-2">
        <p className="text-xs font-semibold text-[#8e8e93] uppercase tracking-widest mb-1">Мои плейлисты</p>

        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />

        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 rounded-2xl bg-black/6 animate-pulse" />
          ))
        ) : playlists.length === 0 ? (
          <p className="text-xs text-[#aeaeb2] text-center py-3">Нет плейлистов</p>
        ) : (
          playlists.map((pl, i) => (
            <motion.div key={pl.id}
              initial={{ opacity:0, x:8 }} animate={{ opacity:1, x:0 }} transition={{ delay: i*0.06 }}
              onClick={() => setSelected(pl)}
              whileHover={{ x:3 }}
              className="g-row flex items-center gap-3 px-2 py-2.5 rounded-2xl cursor-pointer transition-colors group">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-black/8 flex-shrink-0">
                {cover(pl) ? (
                  <img src={cover(pl)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music2 size={15} className="text-[#8e8e93]" />
                  </div>
                )}
                <button onClick={(e) => onCoverClick(e, pl.id)}
                  className="absolute inset-0 bg-black/35 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Pencil size={10} className="text-white" />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1c1c1e] truncate">{pl.title}</p>
                <p className="text-xs text-[#8e8e93] mt-0.5">{pl.track_count} треков</p>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {selected && <PlaylistModal playlist={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </>
  )
}
