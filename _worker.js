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

    let tg = {};
    try {
      const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
        signal: AbortSignal.timeout(8000),
      });
      tg = await r.json().catch(() => ({ ok: false, description: `bad_json_http_${r.status}` }));
    } catch (fe) {
      return json({ ok: false, reason: 'fetch_failed: ' + (fe && fe.name ? fe.name + ': ' + fe.message : String(fe)) }, 502);
    }

    return json({ ok: !!tg.ok, reason: tg.ok ? undefined : tg.description }, tg.ok ? 200 : 502);
  } catch (e) {
    return json({ ok: false, reason: 'exception: ' + (e && e.message ? e.message : String(e)) }, 502);
  }
}

const VERSION = 'v11-me';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/me') {
      try {
        const token = (env.TELEGRAM_BOT_TOKEN || '').trim();
        const r = await fetch(`https://api.telegram.org/bot${token}/getMe`, { signal: AbortSignal.timeout(8000) });
        const data = await r.json();
        const u = data.result || {};
        return new Response(JSON.stringify({ ok: data.ok, username: u.username, name: u.first_name, id: u.id }), { headers: { 'Content-Type': 'application/json' } });
      } catch (e) {
        return new Response(JSON.stringify({ ok: false, err: (e && e.name) + ': ' + (e && e.message) }), { headers: { 'Content-Type': 'application/json' } });
      }
    }
    if (url.pathname === '/api/updates') {
      try {
        const token = (env.TELEGRAM_BOT_TOKEN || '').trim();
        const r = await fetch(`https://api.telegram.org/bot${token}/getUpdates`, { signal: AbortSignal.timeout(8000) });
        const data = await r.json();
        const chats = [];
        for (const u of (data.result || [])) {
          const c = (u.message || u.my_chat_member || u.channel_post || {}).chat;
          if (c) chats.push({ id: c.id, type: c.type, title: c.title || c.username || c.first_name });
        }
        return new Response(JSON.stringify({ ok: data.ok, chats }), { headers: { 'Content-Type': 'application/json' } });
      } catch (e) {
        return new Response(JSON.stringify({ ok: false, err: (e && e.name) + ': ' + (e && e.message) }), { headers: { 'Content-Type': 'application/json' } });
      }
    }
    if (url.pathname === '/api/send2') {
      try {
        const token = (env.TELEGRAM_BOT_TOKEN || '').trim();
        const chatId = (env.TELEGRAM_CHAT_ID || '').trim();
        const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: 'senatex worker diagnostic' }),
          signal: AbortSignal.timeout(8000),
        });
        const t = await r.text();
        return new Response(JSON.stringify({ ok: true, status: r.status, body: t.slice(0, 300) }), { headers: { 'Content-Type': 'application/json' } });
      } catch (e) {
        return new Response(JSON.stringify({ ok: false, err: (e && e.name) + ': ' + (e && e.message) }), { headers: { 'Content-Type': 'application/json' } });
      }
    }
    if (url.pathname === '/api/fetchtest') {
      const target = url.searchParams.get('url') || 'https://example.com';
      try {
        const r = await fetch(target, { signal: AbortSignal.timeout(8000) });
        return new Response(JSON.stringify({ ok: true, status: r.status, target }), { headers: { 'Content-Type': 'application/json' } });
      } catch (e) {
        return new Response(JSON.stringify({ ok: false, err: (e && e.name) + ': ' + (e && e.message), target }), { headers: { 'Content-Type': 'application/json' } });
      }
    }
    if (url.pathname === '/api/ping') {
      const hasTok = !!(env.TELEGRAM_BOT_TOKEN || '').trim();
      const hasChat = !!(env.TELEGRAM_CHAT_ID || '').trim();
      return new Response(JSON.stringify({ ok: true, version: VERSION, hasTok, hasChat }), {
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
