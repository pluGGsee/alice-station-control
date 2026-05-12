import warnings
import logging
warnings.filterwarnings("ignore")

from yandex_music import Client
from config import YANDEX_TOKEN, DEVICE_ID

logger = logging.getLogger(__name__)

_client: Client | None = None


def _get_client() -> Client:
    global _client
    if _client is None:
        _client = Client(YANDEX_TOKEN).init()
    return _client


def _reset_client():
    global _client
    _client = None


def _cover(uri: str | None, size: str = "400x400") -> str | None:
    if not uri:
        return None
    return "https://" + uri.replace("%%", size)


def get_current_track() -> dict | None:
    try:
        client = _get_client()
        queues = client.queues_list()
        if not queues:
            return None

        station_queue = None
        for q in queues:
            device = getattr(q, 'device', None) or {}
            dev_id = device.get('device_id', '') if isinstance(device, dict) else getattr(device, 'device_id', '')
            if DEVICE_ID.lower() in str(dev_id).lower():
                station_queue = q
                break

        target = station_queue or queues[0]
        queue = client.queue(target.id)
        track_id = queue.get_current_track()
        if not track_id:
            return None

        t = track_id.fetch_track()
        artists = ", ".join(a.name for a in (t.artists or []))
        album = t.albums[0].title if t.albums else None

        return {
            "id": str(t.id),
            "title": t.title,
            "artist": artists,
            "album": album,
            "cover_url": _cover(t.cover_uri),
            "duration_ms": t.duration_ms,
        }
    except Exception as e:
        logger.warning(f"get_current_track error: {e}")
        _reset_client()
        return None


def search_tracks(query: str, limit: int = 10) -> list:
    try:
        client = _get_client()
        result = client.search(query, type_="track")
        if not result or not result.tracks:
            return []

        tracks = []
        for t in result.tracks.results[:limit]:
            artists = ", ".join(a.name for a in (t.artists or []))
            tracks.append({
                "id": str(t.id),
                "title": t.title,
                "artist": artists,
                "cover_url": _cover(t.cover_uri, "200x200"),
                "duration_ms": t.duration_ms,
            })
        return tracks
    except Exception as e:
        logger.warning(f"search_tracks error: {e}")
        _reset_client()
        return []


def get_playlists() -> list:
    try:
        client = _get_client()
        playlists = client.users_playlists_list()
        return [
            {
                "id": str(p.kind),
                "title": p.title,
                "track_count": p.track_count,
                "cover_url": None,
            }
            for p in (playlists or [])
        ]
    except Exception as e:
        logger.warning(f"get_playlists error: {e}")
        _reset_client()
        return []


def get_playlist_tracks(kind: int, offset: int = 0, limit: int = 50) -> list:
    try:
        client = _get_client()
        playlist = client.users_playlists(kind=kind)
        if not playlist or not playlist.tracks:
            return []

        short_tracks = playlist.tracks[offset:offset + limit]
        track_id_list = [t.id for t in short_tracks]
        album_id_list = [getattr(t, 'album_id', None) for t in short_tracks]
        full_ids = [f"{tid}:{aid}" if aid else str(tid) for tid, aid in zip(track_id_list, album_id_list)]
        fetched = client.tracks(full_ids)

        tracks = []
        for track in (fetched or []):
            try:
                artists = ", ".join(a.name for a in (track.artists or []))
                tracks.append({
                    "id": str(track.id),
                    "title": track.title,
                    "artist": artists,
                    "cover_url": _cover(track.cover_uri, "100x100"),
                    "duration_ms": track.duration_ms,
                })
            except Exception:
                continue
        return tracks
    except Exception as e:
        logger.warning(f"get_playlist_tracks error: {e}")
        _reset_client()
        return []
