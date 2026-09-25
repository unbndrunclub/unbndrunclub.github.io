// UNBND Run Club: site settings used by every page.
// UNBND_API: the Cloudflare Worker address (fast, reliable). Paste yours below after creating the Worker.
// If the Worker is ever down, set UNBND_API to UNBND_API_DIRECT to go straight to Google.
window.UNBND_API_DIRECT = "https://script.google.com/macros/s/AKfycbzbZCKBa3tIQuXVny1OIx8zpiELks2FqMlwbj6GoEckWIxiJZ-YT0oqfEPfymbl80gG/exec";
window.UNBND_API = "https://unbnd-api.unbndrunclub.workers.dev";
if (!/^https:\/\//.test(window.UNBND_API)) window.UNBND_API = window.UNBND_API_DIRECT;
window.UNBND_WHATSAPP = "https://chat.whatsapp.com/F031vsoBQIXANVwAoXJLbn";
window.UNBND_INSTAGRAM = "https://www.instagram.com/unbndrunclub/";
