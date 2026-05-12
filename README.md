# 🎙️ Alice Station Control

> Локальный веб-сервис для управления **Яндекс Станцией Миди** с любого устройства в домашней сети — без телефона и голосовых команд.

![UI Preview](assets/references/референс%20дизайна.jpg)

---

## ✨ Возможности

- 🎵 **Плеер** — play/pause, следующий/предыдущий трек, обложка, исполнитель
- 🔊 **Громкость** — управление ползунком
- 🎤 **Голосовой ввод** — диктовка команд через микрофон (Web Speech API)
- 💬 **Текстовые команды** — отправить любую команду Алисе
- 📋 **Шаблоны** — быстрые команды одним кликом
- 💡 **Подсветка** — лава-лампа, свеча, ночник, цвета (официальные режимы Миди)
- 🎵 **Плейлисты** — просмотр, поиск треков, запуск
- 🔍 **Поиск музыки** — поиск и запуск треков с Яндекс Музыки
- 🚀 **Автозапуск** — сервер стартует автоматически при подключении к домашней сети

---

## 🛠️ Технологии

**Бэкенд**
- Python 3.14 + FastAPI + uvicorn
- [yandex-music](https://github.com/MarshalX/yandex-music-api) — плейлисты, поиск, треки
- [YandexStation](https://github.com/AlexxIT/YandexStation) — управление колонкой через Glagol WebSocket

**Фронтенд**
- React 19 + Vite 8 + Tailwind CSS v4
- [Motion](https://motion.dev/) — анимации
- [shadcn/ui](https://ui.shadcn.com/) + Lucide React
- Дизайн: серый liquid glass, шрифт Plus Jakarta Sans

---

## 📋 Требования

- macOS (автозапуск через launchd)
- Python 3.10+
- Node.js 18+
- Яндекс Станция в той же локальной сети
- Аккаунт Яндекс с подпиской Плюс

---

## 🚀 Установка

### 1. Клонировать репозиторий

```bash
git clone https://github.com/pluGGsee/alice-station-control.git
cd alice-station-control
```

### 2. Бэкенд

```bash
cd work/backend
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Авторизация Яндекс

Создай `work/backend/config.py` (этот файл не коммитится):

```python
YANDEX_TOKEN = ""      # токен Яндекс Музыки (см. ниже)
YANDEX_XTOKEN = ""     # x-token Яндекс Паспорта (см. ниже)
SESSION_ID = ""        # кука Session_id из браузера
SESSION_ID2 = ""       # кука sessionid2 из браузера

STATION_IP = "192.168.X.X"    # IP колонки в локальной сети
STATION_PORT = 1961
DEVICE_ID = ""         # ID устройства (найдёт автоматически)
PLATFORM = "cucumber"  # для Станции Миди
```

**Получить YANDEX_TOKEN:**
```bash
source venv/bin/activate
python3 get_token.py
```

**Получить YANDEX_XTOKEN:**
Открой в браузере:
```
https://oauth.yandex.ru/authorize?response_type=token&client_id=23cabbbdc6cd418abb4b39c32c41195d
```
Скопируй `access_token` из URL после редиректа.

**Получить SESSION_ID / SESSION_ID2:**
DevTools браузера → Application → Cookies → `yandex.ru`

### 4. Фронтенд

```bash
cd work/frontend
npm install
```

### 5. Запуск

```bash
# Бэкенд
cd work/backend && source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000

# Фронтенд (разработка)
cd work/frontend
npm run dev
```

Открой в браузере: **http://localhost:5174**

С другого устройства в сети: **http://\<IP-компьютера\>:8000**

---

## ⚙️ Автозапуск на Mac

Сервер запускается автоматически при входе в систему и работает **только когда подключён к домашней сети**:

```bash
# Установить
cp assets/notes/com.alice-station.server.plist ~/Library/LaunchAgents/
cp assets/notes/com.alice-station.network-watch.plist ~/Library/LaunchAgents/
cp assets/notes/start-server.sh ~/.local/bin/alice-station-start.sh
chmod +x ~/.local/bin/alice-station-start.sh

# Редактируй HOME_SUBNET в start-server.sh под свою подсеть

launchctl load ~/Library/LaunchAgents/com.alice-station.server.plist
launchctl load ~/Library/LaunchAgents/com.alice-station.network-watch.plist

# Логи
tail -f ~/Library/Logs/alice-station.log
```

---

## 📁 Структура проекта

```
alice-station-control/
├── work/
│   ├── backend/          # Python FastAPI сервер
│   │   ├── main.py       # API эндпоинты
│   │   ├── station.py    # Управление колонкой (Glagol WebSocket)
│   │   ├── music.py      # Яндекс Музыка (плейлисты, поиск)
│   │   ├── config.py     # Токены и настройки (не в git!)
│   │   └── requirements.txt
│   └── frontend/         # React приложение
│       └── src/
│           ├── App.jsx
│           └── components/
├── assets/
│   ├── references/       # Референсы дизайна
│   └── notes/            # Скрипты автозапуска
├── final/                # Чистовые снимки
├── CLAUDE.md             # Инструкции для Claude Code
└── README.md
```

---

## 🔑 Важно

- `config.py` добавлен в `.gitignore` — **никогда не коммить токены**
- Токены протухают примерно раз в несколько недель — обновляй `SESSION_ID` из браузера
- Сервис работает только в локальной сети — снаружи недоступен

---

## 🗺️ Планы (v2)

- [ ] Расписание и таймеры
- [ ] Управление умным домом (Zigbee)
- [ ] История команд
- [ ] Тёмная тема
- [ ] Docker (деплой на Windows одной командой)

---

## 📄 Лицензия

MIT — делай что хочешь.
