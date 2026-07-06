// Cloudflare Pages advanced mode — единый воркер сайта Senatex.
// POST /api/lead -> отправка заявки в Telegram-группу; остальное -> статика сайта.
// Токен бота — секрет из переменной окружения Cloudflare TELEGRAM_BOT_TOKEN.
// ID группы заявок не секретный, поэтому задан прямо здесь.
const CHAT_ID = '-5084243161'; // Telegram-группа заявок "0808"

async function handleLead(request, env) {
  const json = (obj, status) =>
    new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });

  try {
    const token = (env.TELEGRAM_BOT_TOKEN || '').trim();
    if (!token) return json({ ok: false, reason: 'no_token' }, 500);

    let b = {};
    try { b = JSON.parse((await request.text()) || '{}'); } catch (_) {}

    const esc = (s) => String(s ?? '').slice(0, 500).replace(/[<&>]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
    const text =
      '🏝 <b>Новая заявка — senatex.site</b>\n\n' +
      `👤 Имя: ${esc(b.name)}\n` +
      `📞 Контакт: ${esc(b.phone)}\n` +
      `💰 Бюджет: ${esc(b.budget)}\n` +
      `📝 Запрос: ${esc(b.message)}\n` +
      `🌐 Язык: ${esc(b.lang)}`;

    let tg = {};
    try {
      const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'HTML' }),
        signal: AbortSignal.timeout(8000),
      });
      tg = await r.json().catch(() => ({ ok: false, description: `bad_json_http_${r.status}` }));
    } catch (fe) {
      return json({ ok: false, reason: 'fetch_failed: ' + (fe && fe.message ? fe.message : String(fe)) }, 502);
    }

    return json({ ok: !!tg.ok, reason: tg.ok ? undefined : tg.description }, tg.ok ? 200 : 502);
  } catch (e) {
    return json({ ok: false, reason: 'exception: ' + (e && e.message ? e.message : String(e)) }, 502);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/lead') {
      if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
      return handleLead(request, env);
    }
    // всё остальное — статические файлы сайта
    return env.ASSETS.fetch(request);
  },
};
