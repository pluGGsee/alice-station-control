import warnings
warnings.filterwarnings("ignore")

from yandex_music import Client
from config import YANDEX_TOKEN

_client: "Client | None" = None


def _get_client() -> Client:
    global _client
    if _client is None:
        _client = Client(YANDEX_TOKEN).init()
    return _client


def get_current_track() -> "dict | None":
    try:
        client = _get_client()
        queues = client.queues_list()
        if not queues:
            return None

        queue = client.queue(queues[0].id)
        track_id = queue.get_current_track()
        if not track_id:
            return None

        tracks = track_id.fetch_track()
        cover = None
        if tracks.cover_uri:
            cover = "https://" + tracks.cover_uri.replace("%%", "400x400")

        artists = ", ".join(a.name for a in (tracks.artists or []))
        album = tracks.albums[0].title if tracks.albums else None

        return {
            "id": str(tracks.id),
            "title": tracks.title,
            "artist": artists,
            "album": album,
            "cover_url": cover,
            "duration_ms": tracks.duration_ms,
        }
    except Exception:
        return None


def search_tracks(query: str, limit: int = 10) -> list:
    try:
        client = _get_client()
        result = client.search(query, type_="track")
        if not result or not result.tracks:
            return []

        tracks = []
        for t in result.tracks.results[:limit]:
            cover = None
            if t.cover_uri:
                cover = "https://" + t.cover_uri.replace("%%", "200x200")
            artists = ", ".join(a.name for a in (t.artists or []))
            tracks.append({
                "id": str(t.id),
                "title": t.title,
                "artist": artists,
                "cover_url": cover,
                "duration_ms": t.duration_ms,
            })
        return tracks
    except Exception:
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
            }
            for p in (playlists or [])
        ]
    except Exception:
        return []
