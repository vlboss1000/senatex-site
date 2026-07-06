# Senatex Group — Phuket real estate landing

Статический лендинг (RU / EN / TH) для Senatex Group Co., Ltd.
Хостинг: Cloudflare Pages. Домен: senatex.site.

## Структура
- `index.html` — сам сайт (одностраничник, все стили и скрипты внутри).
- `functions/api/lead.js` — Cloudflare Pages Function: принимает заявку с формы и шлёт в Telegram-группу.
- `assets/hero.jpg` — фото для первого экрана (положить сюда с этим именем).

## Переменные окружения (Cloudflare → Pages → Settings → Environment variables)
- `TELEGRAM_BOT_TOKEN` — токен бота от @BotFather
- `TELEGRAM_CHAT_ID` — id группы заявок

Секреты в код не коммитятся — только в переменные окружения Cloudflare.
