from yandex_music import Client

def show_code(code):
    print(f"\n1. Открой эту ссылку в браузере:")
    print(f"   https://oauth.yandex.ru/device")
    print(f"\n2. Введи код: {code.user_code}")
    print(f"\n3. Жди подтверждения...\n")

print("Авторизация в Яндекс Музыке")
print("=" * 40)

client = Client()
token = client.device_auth(on_code=show_code)

print("\n✅ Успешно! Твой токен:")
print(token.access_token)
print("\nСохрани его — он понадобится для config.py")
