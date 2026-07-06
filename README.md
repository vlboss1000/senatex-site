# Senatex Group — Phuket real estate landing

Статический лендинг (RU / EN / TH) для Senatex Group Co., Ltd.
Хостинг: Cloudflare Pages. Домен: https://senatex.site

## Структура
- `index.html` — сам сайт (одностраничник, все стили и скрипты внутри).
- `_worker.js` — Cloudflare Pages advanced mode: POST `/api/lead` шлёт заявку в Telegram-группу, остальное отдаёт как статику.
- `assets/` — картинки. `assets/bt-421p-1-1-scaled.png` — фото первого экрана.

## Заявки в Telegram
- Бот: **@agregatm_bot**. Группа заявок: id `-5084243161` (задан в `_worker.js`, это не секрет).
- Токен бота — секрет, лежит в переменной окружения Cloudflare `TELEGRAM_BOT_TOKEN`
  (Pages → Settings → Variables and Secrets). В код не коммитится.
- Переменная `TELEGRAM_CHAT_ID` в Cloudflare больше не используется — id группы задан в коде.

## Правки контента
Текст меняется в `index.html` (объект переводов `T` для трёх языков + карточки каталога `DISTRICTS`).
После push в `main` Cloudflare Pages пересобирает сайт автоматически за ~1 минуту.
