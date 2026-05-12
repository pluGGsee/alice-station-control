import asyncio
import json
import ssl
import time
import logging
import warnings
warnings.filterwarnings("ignore")

import aiohttp

from config import (
    YANDEX_XTOKEN, SESSION_ID, SESSION_ID2,
    STATION_IP, STATION_PORT, DEVICE_ID, PLATFORM, YANDEX_TOKEN
)
from yandex_session import YandexSession

logger = logging.getLogger(__name__)

_glagol_token: str | None = None
_glagol_token_expires: float = 0


async def _get_session() -> tuple:
    cookies = {"Session_id": SESSION_ID, "sessionid2": SESSION_ID2}
    http = aiohttp.ClientSession(cookies=cookies)
    session = YandexSession(http, x_token=YANDEX_XTOKEN)
    session.music_token = YANDEX_TOKEN
    return session, http


async def _get_glagol_token() -> str:
    global _glagol_token, _glagol_token_expires
    if _glagol_token and time.time() < _glagol_token_expires:
        return _glagol_token

    session, http = await _get_session()
    try:
        r = await session.request_glagol(
            f"https://quasar.yandex.net/glagol/token"
            f"?device_id={DEVICE_ID}&platform={PLATFORM}"
        )
        data = await r.json()
        _glagol_token = data["token"]
        _glagol_token_expires = time.time() + 3600
        return _glagol_token
    finally:
        await http.close()


def _ssl_ctx():
    ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    return ctx


async def _connect_and_get_state() -> dict | None:
    """Подключаемся к колонке и получаем полный state из handshake-ответа."""
    token = await _get_glagol_token()
    try:
        async with aiohttp.ClientSession() as http:
            ws = await http.ws_connect(
                f"wss://{STATION_IP}:{STATION_PORT}",
                ssl=_ssl_ctx(),
                heartbeat=5,
            )
            await ws.send_str(json.dumps({
                "conversationToken": token,
                "id": DEVICE_ID,
                "payload": {"softwareVersion": "1.0"},
                "sentTime": int(time.time() * 1000),
            }))
            msg = await asyncio.wait_for(ws.receive(), timeout=5)
            await ws.close()
            return json.loads(msg.data)
    except Exception as e:
        logger.error(f"Station connect error: {e}")
        return None


async def _send(payload: dict) -> dict | None:
    """Отправить команду и получить ответ."""
    token = await _get_glagol_token()
    try:
        async with aiohttp.ClientSession() as http:
            ws = await http.ws_connect(
                f"wss://{STATION_IP}:{STATION_PORT}",
                ssl=_ssl_ctx(),
                heartbeat=5,
            )
            # Handshake
            await ws.send_str(json.dumps({
                "conversationToken": token,
                "id": DEVICE_ID,
                "payload": {"softwareVersion": "1.0"},
                "sentTime": int(time.time() * 1000),
            }))
            await asyncio.wait_for(ws.receive(), timeout=5)

            # Команда
            await ws.send_str(json.dumps({
                "conversationToken": token,
                "id": DEVICE_ID,
                "payload": payload,
                "sentTime": int(time.time() * 1000),
            }))
            try:
                msg = await asyncio.wait_for(ws.receive(), timeout=5)
                return json.loads(msg.data)
            except asyncio.TimeoutError:
                return None
            finally:
                await ws.close()
    except Exception as e:
        logger.error(f"Station send error: {e}")
        return None


# --- Публичные методы ---

async def get_status() -> dict:
    """Статус колонки + текущий трек из playerState."""
    data = await _connect_and_get_state()
    if not data:
        return {"online": False, "playing": False, "volume": 0, "aliceState": "IDLE", "track": None}

    state = data.get("state", {})
    player = state.get("playerState", {})
    extra = player.get("extra", {})

    # Трек
    track = None
    title = player.get("title")
    if title:
        cover_uri = extra.get("coverURI")
        cover_url = ("https://" + cover_uri.replace("%%", "400x400")) if cover_uri else None
        track = {
            "title": title,
            "artist": player.get("subtitle", ""),
            "cover_url": cover_url,
            "duration": player.get("duration"),
            "progress": player.get("progress"),
            "playlist_type": player.get("playlistType"),
        }

    return {
        "online": True,
        "playing": state.get("playing", False),
        "volume": state.get("volume", 0),
        "aliceState": state.get("aliceState", "IDLE"),
        "track": track,
    }


async def send_tts(text: str):
    await _send({"command": "sendText", "text": text})


async def send_command(text: str):
    await _send({"command": "sendText", "text": text})


async def set_volume(value: int):
    vol = max(0, min(10, value)) / 10
    await _send({"command": "setVolume", "volume": vol})


async def play():
    await _send({"command": "play"})


async def pause():
    await _send({"command": "stop"})


async def next_track():
    await send_command("следующий трек")


async def prev_track():
    await send_command("предыдущий трек")
