"""
Получение x-token через авторизацию по логину/паролю Яндекса.
x-token нужен для управления колонкой через YandexStation.
"""
import asyncio
import aiohttp
import warnings
warnings.filterwarnings('ignore')

async def get_xtoken():
    login = input("Логин Яндекса (email или телефон): ").strip()
    password = input("Пароль: ").strip()

    async with aiohttp.ClientSession() as http:
        from yandex_session import YandexSession
        session = YandexSession(http)

        resp = await session.login_cookies(f"login={login}&passwd={password}")
        if resp and resp.ok:
            print(f"\n✅ x-token получен:\n{resp.x_token}")
            print("\nДобавь его в config.py как YANDEX_XTOKEN")
        else:
            print(f"\n❌ Ошибка: {resp.errors if resp else 'нет ответа'}")
            print("Попробуй другой способ — через QR код в приложении Яндекса")

asyncio.run(get_xtoken())
