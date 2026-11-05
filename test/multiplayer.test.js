"use strict";
// End-to-end tests against the real server over real WebSockets.
const assert = require("assert");
const WebSocket = require("ws");
const { httpServer, rooms } = require("../server/server.js");

let port;
class Client {
  constructor(headers) { this.msgs = []; this.waiters = []; this.state = null;
    this.ws = new WebSocket(`ws://localhost:${port}/ws`, { headers });
    this.ws.on("message", d => { const m = JSON.parse(d); this.msgs.push(m); if (m.type === "state") this.state = m; this.waiters = this.waiters.filter(w => !w(m)); });
    this.opened = new Promise((res, rej) => { this.ws.on("open", res); this.ws.on("error", rej); });
    this.closed = new Promise(res => this.ws.on("close", (c) => res(c)));
  }
  send(o) { this.ws.send(typeof o === "string" ? o : JSON.stringify(o)); }
  next(pred, ms = 2000) {
    return new Promise((res, rej) => {
      const t = setTimeout(() => rej(new Error("timeout waiting for message")), ms);
      this.waiters.push(m => { if (pred(m)) { clearTimeout(t); res(m); return true; } return false; });
    });
  }
  req(o, pred) { const p = this.next(pred); this.send(o); return p; }
}
const isErr = c => m => m.type === "error" && (!c || m.code === c);
const isState = f => m => m.type === "state" && (!f || f(m));
async function mk(name, headers) { const c = new Client(headers); await c.opened; c.name = name; return c; }

let passed = 0;
async function t(name, fn) { try { await fn(); passed++; console.log("  ok  " + name); } catch (e) { console.error("FAIL  " + name + "\n      " + (e.stack || e)); process.exitCode = 1; } }

(async () => {
  await new Promise(r => httpServer.listen(0, r));
  port = httpServer.address().port;
  const open = [];
  const mkc = async (n, h) => { const c = await mk(n, h); open.push(c); return c; };

  const host = await mkc("Host");
  let code, hostToken;
  await t("create room gives a 4-char code, host role, lobby state", async () => {
    const joined = host.next(m => m.type === "joined");
    const st = host.req({ type: "create", name: "Hana", count: 5 }, isState());
    const j = await joined; const s = await st;
    code = j.code; hostToken = j.token;
    assert.match(code, /^[BCDFGHJKMNPQRSTVWXZ2-9]{4}$/);
    assert.strictEqual(s.phase, "lobby"); assert.strictEqual(s.you.isHost, true); assert.strictEqual(s.players.length, 1);
  });
  await t("invalid / malformed codes are rejected", async () => {
    const c = await mkc("x");
    await c.req({ type: "join", code: "ZZZZ", name: "Bo" }, isErr("invalid_code"));
    await c.req({ type: "join", code: "<b>", name: "Bo" }, isErr("invalid_code"));
    await c.req({ type: "join", code: 12345, name: "Bo" }, isErr("invalid_code"));
  });
  await t("bad names rejected, duplicate names rejected (case-insensitive)", async () => {
    const c = await mkc("x");
    await c.req({ type: "join", code, name: "<script>" }, isErr("bad_name"));
    await c.req({ type: "join", code, name: "" }, isErr("bad_name"));
    await c.req({ type: "join", code, name: "x".repeat(17) }, isErr("bad_name"));
    await c.req({ type: "join", code, name: "hana" }, isErr("name_taken"));
  });
  await t("host cannot start alone", async () => { await host.req({ type: "start" }, isErr("need_players")); });

  const p2 = await mkc("Ben"), p3 = await mkc("Cy");
  await t("players join using lowercase / spaced code and lobby shows everyone", async () => {
    const hs = host.next(isState(s => s.players.length === 2));
    const j = await p2.req({ type: "join", code: code.toLowerCase().split("").join(" "), name: "Ben" }, m => m.type === "joined");
    assert.strictEqual(j.code, code); await hs;
    const three = host.next(isState(x => x.players.length === 3));
    await p3.req({ type: "join", code, name: "Cy" }, m => m.type === "joined");
    assert.strictEqual((await three).players.length, 3);
  });
  await t("non-host cannot start or end", async () => {
    await p2.req({ type: "start" }, isErr("not_host"));
    await p2.req({ type: "end" }, isErr("not_host"));
  });
  await t("room-full is enforced at 8 players", async () => {
    const extra = [];
    for (let i = 0; i < 5; i++) { const c = await mkc("e" + i); await c.req({ type: "join", code, name: "E" + i }, m => m.type === "joined"); extra.push(c); }
    const late = await mkc("late");
    await late.req({ type: "join", code, name: "Late" }, isErr("room_full"));
    for (const c of extra) { c.send({ type: "leave" }); }
    await host.next(isState(s => s.players.length === 3));
  });

  await t("start: everyone gets same question; correct answer never sent", async () => {
    const s1 = host.next(isState(s => s.phase === "playing")), s2 = p2.next(isState(s => s.phase === "playing")), s3 = p3.next(isState(s => s.phase === "playing"));
    host.send({ type: "start" });
    const [a, b, c] = await Promise.all([s1, s2, s3]);
    assert.deepStrictEqual(a.question, b.question); assert.deepStrictEqual(b.question, c.question);
    assert.strictEqual(a.total, 5); assert.strictEqual(a.question.index, 0);
    assert.ok(!JSON.stringify(a).match(/correct|explanation/i), "state must not leak answers");
  });
  await t("cannot join after start", async () => {
    const c = await mkc("late"); await c.req({ type: "join", code, name: "Zed" }, isErr("started"));
  });

  const room = rooms.get(code);
  const correctIdx = i => room.questions[i].correct;
  await t("answer validation: out-of-order, bad choice, double answer, client-sent score ignored", async () => {
    await host.req({ type: "answer", q: 3, choice: 0 }, isErr("out_of_order"));
    await host.req({ type: "answer", q: 0, choice: 9 }, isErr("bad_request"));
    await host.req({ type: "answer", q: 0, choice: "0" }, isErr("bad_request"));
    await host.req({ type: "answer", q: 0, choice: -1 }, isErr("bad_request"));
    const r = await host.req({ type: "answer", q: 0, choice: correctIdx(0), score: 999 }, m => m.type === "result");
    assert.strictEqual(r.correct, true); assert.strictEqual(r.score, 1); assert.strictEqual(r.correctIndex, correctIdx(0));
    await host.req({ type: "answer", q: 0, choice: correctIdx(0) }, isErr("out_of_order")); // no double scoring
    assert.strictEqual(room.players.get(host.state.you.id).score, 1);
  });
  await t("wrong answer scores 0 (no penalty) and others see progress only", async () => {
    const wrong = (correctIdx(0) + 1) % room.questions[0].options.length;
    const r = await p2.req({ type: "answer", q: 0, choice: wrong }, m => m.type === "result");
    assert.strictEqual(r.correct, false); assert.strictEqual(r.score, 0);
    const s = await host.next(isState(x => x.players.find(p => p.name === "Ben").answered === 1));
    assert.strictEqual(s.players.find(p => p.name === "Ben").score, 0);
  });
  await t("refresh: rejoin with token restores progress; wrong token rejected", async () => {
    const old = host; old.ws.terminate(); await old.closed;
    const h2 = await mkc("Host2");
    await h2.req({ type: "rejoin", code, token: "nope" }, isErr("not_found"));
    const j = await h2.req({ type: "rejoin", code, token: hostToken }, m => m.type === "joined");
    assert.strictEqual(j.rejoined, true);
    await new Promise(r => setTimeout(r, 100));
    const s = h2.state;
    assert.strictEqual(s.you.isHost, true); assert.strictEqual(s.you.score, 1); assert.strictEqual(s.question.index, 1);
    Object.assign(host, { ws: h2.ws, send: h2.send.bind(h2), req: h2.req.bind(h2), next: h2.next.bind(h2) });
    Object.defineProperty(host, "state", { get: () => h2.state });
  });
  await t("all players finishing ends the game with ranked results and a review", async () => {
    const bots = [host, p2, p3];
    for (const b of bots) {
      const start = b.state.you.answered;
      for (let i = start; i < 5; i++) b.send({ type: "answer", q: i, choice: correctIdx(i) });
    }
    const fin = await p2.next(isState(s => s.phase === "finished"), 3000);
    assert.strictEqual(fin.endedReason, "complete");
    assert.ok(fin.results.length === 3); assert.ok(fin.review.length === 5);
    const top = fin.results[0]; assert.strictEqual(top.rank, 1); assert.strictEqual(top.score, 5);
    assert.strictEqual(fin.results.find(r => r.name === "Ben").score, 4); // missed the first
  });
  await t("host can close a finished room; players are told", async () => {
    const closed = p2.next(m => m.type === "closed");
    host.send({ type: "end" });
    assert.strictEqual((await closed).reason, "host_ended");
    assert.ok(!rooms.has(code));
  });

  await t("host ending mid-game finishes it for everyone (host_ended)", async () => {
    const h = await mkc("H"), a = await mkc("A");
    const j = await h.req({ type: "create", name: "H", count: 5 }, m => m.type === "joined");
    await a.req({ type: "join", code: j.code, name: "A" }, m => m.type === "joined");
    h.send({ type: "start" }); await a.next(isState(s => s.phase === "playing"));
    const fin = a.next(isState(s => s.phase === "finished"));
    h.send({ type: "end" });
    assert.strictEqual((await fin).endedReason, "host_ended");
  });
  await t("host leaving the lobby closes the room (host_left)", async () => {
    const h = await mkc("H"), a = await mkc("A");
    const j = await h.req({ type: "create", name: "H2" }, m => m.type === "joined");
    await a.req({ type: "join", code: j.code, name: "A2" }, m => m.type === "joined");
    const closed = a.next(m => m.type === "closed"); h.send({ type: "leave" });
    assert.strictEqual((await closed).reason, "host_left");
  });
  await t("player disconnecting in lobby stays briefly, then rejoin works", async () => {
    const h = await mkc("H"), a = await mkc("A");
    const j = await h.req({ type: "create", name: "H3" }, m => m.type === "joined");
    const aj = await a.req({ type: "join", code: j.code, name: "A3" }, m => m.type === "joined");
    a.ws.terminate(); await a.closed;
    const s = await h.next(isState(x => x.players.some(p => p.name === "A3" && !p.connected)));
    assert.ok(s);
    const a2 = await mkc("A-again");
    await a2.req({ type: "rejoin", code: j.code, token: aj.token }, m => m.type === "joined");
    const s2 = await h.next(isState(x => x.players.every(p => p.connected)));
    assert.ok(s2);
  });
  await t("malformed / oversized / unknown messages are handled", async () => {
    const c = await mkc("x");
    await c.req("not json", isErr("bad_request"));
    await c.req({ type: "__proto__" }, isErr("bad_request"));
    await c.req({ type: "constructor" }, isErr("bad_request"));
    c.send("x".repeat(5000)); assert.ok((await c.closed) >= 1000);
  });
  await t("rate limit kicks in on floods", async () => {
    const c = await mkc("x"); const p = c.next(isErr("rate"));
    for (let i = 0; i < 40; i++) c.send({ type: "ping" });
    await p;
  });
  await t("cross-origin WebSocket connections are refused by default", async () => {
    const c = new Client({ Origin: "https://evil.example" });
    await assert.rejects(c.opened);
  });
  await t("static files served; internals are not", async () => {
    const get = p => fetch(`http://localhost:${port}${p}`);
    assert.strictEqual((await get("/")).status, 200);
    assert.strictEqual((await get("/js/data.js")).status, 200);
    assert.strictEqual((await get("/server/server.js")).status, 404);
    assert.strictEqual((await get("/package.json")).status, 404);
    assert.strictEqual((await get("/%2e%2e/package.json")).status, 404);
    assert.strictEqual((await get("/health")).status, 200);
  });

  console.log(`\n${passed} tests passed`);
  for (const c of open) try { c.ws.terminate(); } catch (e) {}
  httpServer.close(); setTimeout(() => process.exit(process.exitCode || 0), 100);
})();
