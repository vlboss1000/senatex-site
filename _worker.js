// Cloudflare Pages advanced mode — единый воркер сайта.
// Обрабатывает POST /api/lead (заявка -> Telegram-группа), остальное отдаёт как статику.
// Секреты берутся из переменных окружения Cloudflare (в код НЕ пишем):
//   TELEGRAM_BOT_TOKEN — токен бота от @BotFather
//   TELEGRAM_CHAT_ID   — id группы заявок (обычно с префиксом -100)

async function handleLead(request, env) {
  const json = (obj, status) =>
    new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });

  try {
    const token = (env.TELEGRAM_BOT_TOKEN || '').trim();
    const chatId = (env.TELEGRAM_CHAT_ID || '').trim();
    if (!token || !chatId) return json({ ok: false, reason: 'not_configured' }, 500);

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

    return json({ ok: !!tg.ok, reason: tg.ok ? undefined : tg.description || `http_${r.status}` }, tg.ok ? 200 : 502);
  } catch (e) {
    return json({ ok: false, reason: 'exception: ' + (e && e.message ? e.message : String(e)) }, 502);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/ping') {
      const hasTok = !!(env.TELEGRAM_BOT_TOKEN || '').trim();
      const hasChat = !!(env.TELEGRAM_CHAT_ID || '').trim();
      return new Response(JSON.stringify({ ok: true, hasTok, hasChat }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (url.pathname === '/api/lead') {
      if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
      return handleLead(request, env);
    }
    // всё остальное — статические файлы сайта
    return env.ASSETS.fetch(request);
  },
};
