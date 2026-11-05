"use strict";
/*
 * Party server for the MBU2L3 study site.
 * - Serves the static site (index.html, css/, js/) so one process runs everything.
 * - Runs rooms over WebSockets at /ws. All room state, answer checking and scoring live here.
 * Rooms are kept in memory only. Nothing is written to disk.
 */
const http = require("http");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const crypto = require("crypto");
const { WebSocketServer } = require("ws");

const ROOT = path.resolve(__dirname, "..");
const PORT = Number(process.env.PORT) || 3000;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);

/* ---------- limits ---------- */
const MAX_PLAYERS = 8;
const MIN_TO_START = 2;
const MAX_ROOMS = 200;
const COUNT_CHOICES = [5, 10, 15, 20];
const LOBBY_GRACE_MS = 30_000;   // disconnected lobby player is removed after this
const GAME_GRACE_MS = 60_000;    // disconnected player is ignored for "everyone finished" after this
const HOST_GRACE_MS = 60_000;    // host gone this long -> host-left handling
const FINISHED_TTL_MS = 30 * 60_000;
const IDLE_TTL_MS = 3 * 60 * 60_000;

/* ---------- question bank (single source of truth: js/data.js) ---------- */
function loadBank() {
  const src = fs.readFileSync(path.join(ROOT, "js", "data.js"), "utf8");
  const ctx = vm.createContext({});
  vm.runInContext(src + "\n;this.__Q = QUESTIONS;", ctx, { timeout: 1000 });
  return ctx.__Q.map(q => ({ topic: q.t, text: q.q, correctText: q.o[0], options: q.o.slice(), explanation: q.e }));
}
const BANK = loadBank();

const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = crypto.randomInt(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/* ---------- rooms ---------- */
const rooms = new Map();
const CODE_ALPHABET = "BCDFGHJKMNPQRSTVWXZ23456789"; // no vowels (no accidental words) and no look-alikes
function makeCode() {
  for (let tries = 0; tries < 200; tries++) {
    let c = "";
    for (let i = 0; i < 4; i++) c += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)];
    if (!rooms.has(c)) return c;
  }
  return null;
}
const normCode = s => (typeof s === "string" ? s.toUpperCase().replace(/[^A-Z0-9]/g, "") : "");
function cleanName(s) {
  if (typeof s !== "string") return null;
  const n = s.normalize("NFC").replace(/\s+/g, " ").trim();
  return /^[\p{L}\p{N} _.\-]{1,16}$/u.test(n) ? n : null;
}
const newId = () => crypto.randomBytes(6).toString("hex");
const newToken = () => crypto.randomBytes(18).toString("base64url");

function send(ws, obj) { if (ws && ws.readyState === 1) ws.send(JSON.stringify(obj)); }

function rank(room) {
  const list = [...room.players.values()].map(p => ({ p, fin: p.finishedAt ?? Infinity }));
  list.sort((a, b) => b.p.score - a.p.score || a.fin - b.fin);
  return list.map(({ p }) => ({ p, rank: 1 + list.filter(o => o.p.score > p.score).length }));
}

function viewFor(room, me) {
  const finished = room.phase === "finished";
  const players = [...room.players.values()].map(p => ({
    id: p.id, name: p.name, isHost: p.id === room.hostId, connected: p.connected,
    score: p.score, answered: p.answers.length, finished: p.answers.length >= (room.total || 1) && room.phase !== "lobby"
  }));
  const v = {
    type: "state", phase: room.phase, code: room.code, total: room.total, minToStart: MIN_TO_START, maxPlayers: MAX_PLAYERS,
    you: { id: me.id, name: me.name, isHost: me.id === room.hostId, score: me.score, answered: me.answers.length },
    players, question: null, endedReason: room.endedReason || null
  };
  if (room.phase === "playing" && me.answers.length < room.total) {
    const q = room.questions[me.answers.length];
    v.question = { index: me.answers.length, text: q.text, options: q.options };
  }
  if (finished) {
    v.results = rank(room).map(({ p, rank: r }) => ({ id: p.id, name: p.name, score: p.score, answered: p.answers.length, rank: r }));
    v.review = me.answers.map((choice, i) => {
      const q = room.questions[i];
      return { text: q.text, yours: q.options[choice], correct: q.options[q.correct], ok: choice === q.correct, explanation: q.explanation };
    });
  }
  return v;
}
function broadcast(room) { for (const p of room.players.values()) send(p.ws, viewFor(room, p)); }

function closeRoom(room, reason) {
  for (const p of room.players.values()) {
    send(p.ws, { type: "closed", reason, phase: room.phase });
    if (p.ws) { p.ws.ctx = null; }
  }
  rooms.delete(room.code);
}

function finishGame(room, reason) {
  if (room.phase !== "playing") return;
  room.phase = "finished";
  room.endedReason = reason; // complete | host_ended | host_left
  room.finishedAt = Date.now();
  broadcast(room);
}

function checkComplete(room) {
  if (room.phase !== "playing") return;
  const now = Date.now();
  const active = [...room.players.values()].filter(p => p.answers.length < room.total && (p.connected || now - p.goneAt < GAME_GRACE_MS) && !p.left);
  if (active.length === 0) finishGame(room, "complete");
}

function hostGone(room) {
  if (room.phase === "lobby") closeRoom(room, "host_left");
  else if (room.phase === "playing") finishGame(room, "host_left");
}

function dropPlayer(room, p) {
  room.players.delete(p.id);
  if (p.ws) p.ws.ctx = null;
}

/* ---------- message handlers ---------- */
const COUNT_DEFAULT = 10;
function fail(ws, code, extra) { send(ws, { type: "error", code, ...extra }); }

const handlers = {
  create(ws, m) {
    if (ws.ctx) return fail(ws, "already_in_room");
    const name = cleanName(m.name);
    if (!name) return fail(ws, "bad_name");
    let count = Number.isInteger(m.count) ? m.count : COUNT_DEFAULT;
    if (!COUNT_CHOICES.includes(count)) return fail(ws, "bad_request");
    count = Math.min(count, BANK.length);
    if (rooms.size >= MAX_ROOMS) return fail(ws, "server_full");
    const code = makeCode();
    if (!code) return fail(ws, "server_full");
    const host = { id: newId(), token: newToken(), name, ws, connected: true, goneAt: 0, score: 0, answers: [], finishedAt: null, left: false };
    const room = { code, hostId: host.id, phase: "lobby", players: new Map([[host.id, host]]), count, total: 0, questions: [], createdAt: Date.now(), lastActive: Date.now(), hostGoneAt: 0 };
    rooms.set(code, room);
    ws.ctx = { code, id: host.id };
    send(ws, { type: "joined", code, token: host.token, id: host.id });
    broadcast(room);
  },

  join(ws, m) {
    if (ws.ctx) return fail(ws, "already_in_room");
    const code = normCode(m.code);
    if (code.length !== 4) return fail(ws, "invalid_code");
    const room = rooms.get(code);
    if (!room) return fail(ws, "invalid_code");
    const name = cleanName(m.name);
    if (!name) return fail(ws, "bad_name");
    if (room.phase !== "lobby") return fail(ws, "started");
    if (room.players.size >= MAX_PLAYERS) return fail(ws, "room_full");
    const lower = name.toLowerCase();
    if ([...room.players.values()].some(p => p.name.toLowerCase() === lower)) return fail(ws, "name_taken");
    const p = { id: newId(), token: newToken(), name, ws, connected: true, goneAt: 0, score: 0, answers: [], finishedAt: null, left: false };
    room.players.set(p.id, p);
    room.lastActive = Date.now();
    ws.ctx = { code, id: p.id };
    send(ws, { type: "joined", code, token: p.token, id: p.id });
    broadcast(room);
  },

  rejoin(ws, m) {
    if (ws.ctx) return fail(ws, "already_in_room");
    const room = rooms.get(normCode(m.code));
    if (!room || typeof m.token !== "string") return fail(ws, "not_found");
    const p = [...room.players.values()].find(x => !x.left && x.token.length === m.token.length &&
      crypto.timingSafeEqual(Buffer.from(x.token), Buffer.from(m.token)));
    if (!p) return fail(ws, "not_found");
    if (p.ws && p.ws !== ws) { p.ws.ctx = null; try { p.ws.close(4000, "replaced"); } catch (e) {} }
    p.ws = ws; p.connected = true; p.goneAt = 0;
    if (p.id === room.hostId) room.hostGoneAt = 0;
    ws.ctx = { code: room.code, id: p.id };
    room.lastActive = Date.now();
    send(ws, { type: "joined", code: room.code, token: p.token, id: p.id, rejoined: true });
    broadcast(room);
  },

  start(ws) {
    const { room, p } = ctxOf(ws); if (!room) return fail(ws, "not_found");
    if (p.id !== room.hostId) return fail(ws, "not_host");
    if (room.phase !== "lobby") return fail(ws, "bad_request");
    const connected = [...room.players.values()].filter(x => x.connected).length;
    if (connected < MIN_TO_START) return fail(ws, "need_players", { min: MIN_TO_START });
    const picked = shuffle(BANK).slice(0, room.count);
    room.questions = picked.map(q => {
      const opts = shuffle(q.options);
      return { text: q.text, options: opts, correct: opts.indexOf(q.correctText), explanation: q.explanation };
    });
    room.total = room.questions.length;
    room.phase = "playing";
    room.startedAt = room.lastActive = Date.now();
    broadcast(room);
  },

  answer(ws, m) {
    const { room, p } = ctxOf(ws); if (!room) return fail(ws, "not_found");
    if (room.phase !== "playing") return fail(ws, "bad_request");
    const idx = p.answers.length;
    if (idx >= room.total) return fail(ws, "bad_request");
    if (m.q !== idx) return fail(ws, "out_of_order");          // must answer the current question, once
    const q = room.questions[idx];
    if (!Number.isInteger(m.choice) || m.choice < 0 || m.choice >= q.options.length) return fail(ws, "bad_request");
    p.answers.push(m.choice);
    const ok = m.choice === q.correct;
    if (ok) p.score += 1;                                        // 1 point per correct answer, 0 for wrong (no penalty)
    if (p.answers.length >= room.total) p.finishedAt = Date.now();
    room.lastActive = Date.now();
    send(ws, { type: "result", index: idx, correct: ok, correctIndex: q.correct, explanation: q.explanation, score: p.score });
    broadcast(room);
    checkComplete(room);
  },

  end(ws) {
    const { room, p } = ctxOf(ws); if (!room) return fail(ws, "not_found");
    if (p.id !== room.hostId) return fail(ws, "not_host");
    if (room.phase === "lobby") closeRoom(room, "host_ended");
    else if (room.phase === "playing") finishGame(room, "host_ended");
    else closeRoom(room, "host_ended");
  },

  leave(ws) {
    const { room, p } = ctxOf(ws); if (!room) return;
    if (p.id === room.hostId) {
      if (room.phase === "lobby") { closeRoom(room, "host_left"); return; }
      p.left = true; p.connected = false; p.goneAt = Date.now(); ws.ctx = null;
      hostGone(room); if (rooms.has(room.code)) broadcast(room);
      return;
    }
    if (room.phase === "lobby") { dropPlayer(room, p); broadcast(room); return; }
    p.left = true; p.connected = false; p.goneAt = Date.now(); ws.ctx = null;
    broadcast(room); checkComplete(room);
  },

  ping() {}
};

function ctxOf(ws) {
  if (!ws.ctx) return {};
  const room = rooms.get(ws.ctx.code);
  const p = room && room.players.get(ws.ctx.id);
  return room && p ? { room, p } : {};
}

function onDisconnect(ws) {
  const { room, p } = ctxOf(ws);
  if (!room || p.ws !== ws) return;
  p.connected = false; p.goneAt = Date.now();
  if (p.id === room.hostId) room.hostGoneAt = Date.now();
  broadcast(room);
  checkComplete(room);
}

/* ---------- periodic cleanup ---------- */
setInterval(() => {
  const now = Date.now();
  for (const room of [...rooms.values()]) {
    const host = room.players.get(room.hostId);
    if (host && !host.connected && now - host.goneAt > HOST_GRACE_MS && room.phase !== "finished") { hostGone(room); if (!rooms.has(room.code)) continue; }
    if (room.phase === "lobby") {
      let changed = false;
      for (const p of [...room.players.values()]) if (!p.connected && p.id !== room.hostId && now - p.goneAt > LOBBY_GRACE_MS) { dropPlayer(room, p); changed = true; }
      if (changed) broadcast(room);
    } else if (room.phase === "playing") {
      checkComplete(room);
    }
    if (rooms.has(room.code) && ((room.phase === "finished" && now - room.finishedAt > FINISHED_TTL_MS) || now - room.lastActive > IDLE_TTL_MS)) closeRoom(room, "expired");
  }
}, 5000).unref();

/* ---------- HTTP (static files + health) ---------- */
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".svg": "image/svg+xml" };
const httpServer = http.createServer((req, res) => {
  const headers = { "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" };
  if (req.method !== "GET" && req.method !== "HEAD") { res.writeHead(405, headers); return res.end(); }
  const url = new URL(req.url, "http://x");
  if (url.pathname === "/health") { res.writeHead(200, { ...headers, "Content-Type": "text/plain" }); return res.end("ok"); }
  let rel = decodeURIComponent(url.pathname);
  if (rel === "/") rel = "/index.html";
  const okPath = rel === "/index.html" || /^\/(css|js)\/[A-Za-z0-9._-]+$/.test(rel);
  const file = path.join(ROOT, rel);
  if (!okPath || !file.startsWith(ROOT + path.sep)) { res.writeHead(404, headers); return res.end("Not found"); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, headers); return res.end("Not found"); }
    res.writeHead(200, { ...headers, "Content-Type": TYPES[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-cache" });
    res.end(req.method === "HEAD" ? undefined : data);
  });
});

/* ---------- WebSocket ---------- */
const wss = new WebSocketServer({ noServer: true, maxPayload: 2048 });
httpServer.on("upgrade", (req, socket, head) => {
  const url = new URL(req.url, "http://x");
  if (url.pathname !== "/ws") return socket.destroy();
  const origin = req.headers.origin;
  if (origin) {
    let ok = false;
    if (ALLOWED_ORIGINS.length) ok = ALLOWED_ORIGINS.includes(origin);
    else { try { ok = new URL(origin).host === req.headers.host; } catch (e) {} }
    if (!ok) { socket.write("HTTP/1.1 403 Forbidden\r\n\r\n"); return socket.destroy(); }
  }
  wss.handleUpgrade(req, socket, head, ws => wss.emit("connection", ws, req));
});

wss.on("connection", ws => {
  ws.ctx = null; ws.alive = true;
  let tokens = 15, last = Date.now();
  ws.on("pong", () => { ws.alive = true; });
  ws.on("message", (raw, isBinary) => {
    if (isBinary) return;
    const now = Date.now();
    tokens = Math.min(15, tokens + (now - last) / 200); last = now;   // ~5 messages/second, burst of 15
    if (tokens < 1) return fail(ws, "rate");
    tokens -= 1;
    let m;
    try { m = JSON.parse(raw.toString()); } catch (e) { return fail(ws, "bad_request"); }
    if (!m || typeof m !== "object" || typeof m.type !== "string" || !Object.prototype.hasOwnProperty.call(handlers, m.type)) return fail(ws, "bad_request");
    try { handlers[m.type](ws, m); } catch (e) { console.error("handler error", e); fail(ws, "server_error"); }
  });
  ws.on("close", () => onDisconnect(ws));
  ws.on("error", () => {});
});
setInterval(() => {
  for (const ws of wss.clients) { if (!ws.alive) { ws.terminate(); continue; } ws.alive = false; try { ws.ping(); } catch (e) {} }
}, 25000).unref();

if (require.main === module) {
  httpServer.listen(PORT, () => console.log(`Study party server on http://localhost:${PORT} (${BANK.length} questions)`));
}
module.exports = { httpServer, rooms, BANK };
