// Cloudflare Pages Function — принимает заявку с формы и шлёт её в Telegram-группу.
// Секреты берутся из переменных окружения Cloudflare (в код НЕ пишем):
//   TELEGRAM_BOT_TOKEN — новый токен бота от @BotFather
//   TELEGRAM_CHAT_ID   — id группы заявок (обычно с префиксом -100)
export async function onRequestPost({ request, env }) {
  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    return new Response(JSON.stringify({ ok: false, error: 'not_configured' }), { status: 500 });
  }

  let b = {};
  try { b = await request.json(); } catch (_) {}

  const esc = (s) => String(s ?? '').slice(0, 500).replace(/[<&>]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));

  const text =
    '🏝 <b>Новая заявка — senatex.site</b>\n\n' +
    `👤 Имя: ${esc(b.name)}\n` +
    `📞 Контакт: ${esc(b.phone)}\n` +
    `💰 Бюджет: ${esc(b.budget)}\n` +
    `📝 Запрос: ${esc(b.message)}\n` +
    `🌐 Язык: ${esc(b.lang)}`;

  const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  });
  const tg = await r.json().catch(() => ({}));

  return new Response(JSON.stringify({ ok: !!tg.ok, reason: tg.ok ? undefined : tg.description }), {
    status: tg.ok ? 200 : 502,
    headers: { 'Content-Type': 'application/json' },
  });
}
