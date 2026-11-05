/* Party mode client. The server decides everything (questions, correctness, scores);
   this file only shows what the server sends and sends the player's actions. */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const SKEY = "mbu2l3:party-session";
  const ERR = {
    invalid_code: "That party code doesn't match any room. Check the 4 characters and try again.",
    bad_code: "Enter the 4-character party code.",
    room_full: "This room is full (8 players max).",
    started: "That game has already started, so you can't join it.",
    name_taken: "Someone in this room already uses that name. Pick another.",
    bad_name: "Names can be 1 to 16 letters, numbers, spaces, dots, dashes or underscores.",
    need_players: "You need at least 2 players to start.",
    not_host: "Only the host can do that.",
    server_full: "The server has too many rooms right now. Try again in a few minutes.",
    rate: "Slow down a little. You're sending too fast.",
    out_of_order: "That answer didn't count. Try the current question.",
    already_in_room: "You're already in a room.",
    bad_request: "Something went wrong with that request.",
    server_error: "The server hit a problem. Try again."
  };
  const CLOSED = { host_left: "The host left, so the room was closed.", host_ended: "The host ended the room.", expired: "That room timed out." };

  let box = null;                 // container while the Party tab is open
  let ws = null, status = "idle"; // idle | connecting | open | down
  let S = null;                   // latest state from server
  let shown = null;               // question currently on screen (kept during feedback)
  let result = null;              // server's verdict on the shown question
  let notice = null;              // {kind:"err"|"info", text}
  let closed = null;              // text when the room was closed under us
  let busy = false, pending = null, attempts = 0, retry = null, picked = null;
  let form = { name: "", code: "", count: 10 };
  try { form.name = localStorage.getItem("mbu2l3:party-name") || ""; } catch (e) {}

  const saved = () => { try { return JSON.parse(sessionStorage.getItem(SKEY)); } catch (e) { return null; } };
  const save = v => { try { v ? sessionStorage.setItem(SKEY, JSON.stringify(v)) : sessionStorage.removeItem(SKEY); } catch (e) {} };

  function serverUrl() {
    const cfg = (window.MP_SERVER || "").trim();
    if (cfg) return cfg.replace(/^http/i, "ws").replace(/\/+$/, "") + "/ws";
    if (location.protocol === "file:" || /\.github\.io$/i.test(location.hostname)) return null;
    return (location.protocol === "https:" ? "wss://" : "ws://") + location.host + "/ws";
  }

  /* ---------- connection ---------- */
  function connect() {
    if (ws && (ws.readyState === 0 || ws.readyState === 1)) return;
    const url = serverUrl(); if (!url) return;
    status = "connecting"; render();
    try { ws = new WebSocket(url); } catch (e) { status = "down"; scheduleRetry(); return; }
    const mine = ws;
    ws.onopen = () => {
      if (mine !== ws) return;
      status = "open"; attempts = 0;
      const s = saved();
      if (s && (S || !pending)) raw({ type: "rejoin", code: s.code, token: s.token });
      else if (pending) { raw(pending); pending = null; }
      render();
    };
    ws.onmessage = ev => { let m; try { m = JSON.parse(ev.data); } catch (e) { return; } onMsg(m); };
    ws.onclose = () => { if (mine !== ws) return; status = "down"; busy = false; if (S || saved() || pending) scheduleRetry(); render(); };
    ws.onerror = () => {};
  }
  function scheduleRetry() {
    clearTimeout(retry);
    retry = setTimeout(connect, Math.min(10000, 1000 * 2 ** attempts++));
  }
  function raw(o) { if (ws && ws.readyState === 1) ws.send(JSON.stringify(o)); }
  function act(o, keepBusy) { busy = keepBusy !== false; notice = null; closed = null; if (ws && ws.readyState === 1) raw(o); else { pending = o; connect(); } render(); }

  function onMsg(m) {
    if (m.type === "joined") { save({ code: m.code, token: m.token }); return; }
    if (m.type === "state") {
      busy = false; closed = null;
      if (!S || S.phase !== m.phase || S.code !== m.code) { picked = null; }
      S = m;
      if (!shown || !result || result.index !== shown.index) shown = S.question;
      if (S.phase !== "playing") { shown = null; result = null; }
      return render();
    }
    if (m.type === "result") { result = m; return render(); }
    if (m.type === "closed") {
      if (S && S.phase === "finished") { S.roomClosed = CLOSED[m.reason] || "The room was closed."; save(null); return render(); }
      closed = CLOSED[m.reason] || "The room was closed."; S = null; shown = result = null; save(null); busy = false; return render();
    }
    if (m.type === "error") {
      busy = false;
      if (m.code === "not_found") { // stale session after a refresh
        save(null);
        if (S) { S = null; closed = "That room is no longer available."; } else notice = null;
        return render();
      }
      notice = { kind: "err", text: ERR[m.code] || "Something went wrong." };
      return render();
    }
  }

  /* ---------- actions ---------- */
  function leaveRoom() {
    if (ws && ws.readyState === 1) raw({ type: "leave" });
    save(null); S = null; shown = result = null; notice = closed = null; busy = false; picked = null; pending = null; render();
  }

  /* ---------- views ---------- */
  function banner() {
    let h = "";
    if (status === "down" && (S || saved())) h += `<div class="mp-banner err" role="alert">⚠️ Connection lost. Trying to reconnect. If it comes back within about a minute, you'll be put back in your room.</div>`;
    else if (status === "connecting" && S) h += `<div class="mp-banner" role="status">Reconnecting…</div>`;
    if (notice) h += `<div class="mp-banner ${notice.kind}" role="alert">${esc(notice.text)}</div>`;
    return h;
  }
  const head = t => `<h1>🎉 ${t}</h1>`;

  function render() {
    if (!box) return;
    if (!document.body.contains(box)) return;
    const url = serverUrl();
    if (!url && !S) {
      box.innerHTML = head("Party Mode") + `<div class="card"><h2>Party server not connected</h2>
        <p>Party mode needs the study party server running so friends can join from different devices.</p>
        <p class="muted">Running it yourself: <code>npm install</code> then <code>npm start</code>, and open the address it prints. If this site is hosted somewhere else, set the server address in <code>js/config.js</code>. See the README for details.</p></div>`;
      return;
    }
    if (closed && !S) return menu(`<div class="mp-banner err" role="alert">${esc(closed)}</div>`);
    if (!S) {
      if (status === "connecting" || (busy && status !== "open") || (saved() && status !== "open")) {
        box.innerHTML = head("Party Mode") + banner() + `<div class="card" style="text-align:center"><div class="mp-spin" aria-hidden="true"></div><h2>${saved() ? "Rejoining your room…" : "Connecting…"}</h2><p class="muted">Contacting the party server.</p>
          ${status === "down" ? `<p class="muted">Having trouble. Will keep trying.</p><button class="btn alt" id="cancel">Cancel</button>` : ""}</div>`;
        const c = $("#cancel"); if (c) c.onclick = () => { save(null); pending = null; busy = false; clearTimeout(retry); render(); };
        return;
      }
      if (saved() && status === "open" && busy) return;
      return menu("");
    }
    if (S.phase === "lobby") return lobby();
    if (S.phase === "playing") return playing();
    if (S.phase === "finished") return results();
  }

  function menu(extra) {
    box.innerHTML = head("Party Mode") + `<p class="muted">Study together! Everyone gets the same questions on their own device. Each correct answer is 1 point, and wrong answers never cost you points.</p>` + extra + banner() + `
    <div class="grid g2">
      <form class="card" id="create" autocomplete="off"><h2>Create a room</h2>
        <label class="mp-l" for="n1">Your name</label><input id="n1" maxlength="16" value="${esc(form.name)}" placeholder="e.g. Sam">
        <label class="mp-l" for="cnt">Questions</label>
        <select id="cnt">${[5, 10, 15, 20].map(n => `<option ${n === form.count ? "selected" : ""}>${n}</option>`).join("")}</select>
        <button class="btn" ${busy ? "disabled" : ""}>Create room</button></form>
      <form class="card" id="join" autocomplete="off"><h2>Join a room</h2>
        <label class="mp-l" for="cd">Party code</label><input id="cd" class="mp-code-in" maxlength="6" value="${esc(form.code)}" placeholder="ABCD" autocapitalize="characters" inputmode="text" spellcheck="false">
        <label class="mp-l" for="n2">Your name</label><input id="n2" maxlength="16" value="${esc(form.name)}" placeholder="e.g. Alex">
        <button class="btn" ${busy ? "disabled" : ""}>Join room</button></form>
    </div>`;
    $("#n1").oninput = e => { form.name = e.target.value; $("#n2").value = form.name; };
    $("#n2").oninput = e => { form.name = e.target.value; $("#n1").value = form.name; };
    $("#cd").oninput = e => { form.code = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""); e.target.value = form.code; };
    $("#cnt").onchange = e => { form.count = +e.target.value; };
    const keep = () => { try { localStorage.setItem("mbu2l3:party-name", form.name.trim()); } catch (e) {} };
    $("#create").onsubmit = e => { e.preventDefault(); keep(); act({ type: "create", name: form.name.trim(), count: form.count }); };
    $("#join").onsubmit = e => {
      e.preventDefault(); keep();
      if (form.code.length !== 4) { notice = { kind: "err", text: ERR.bad_code }; return render(); }
      act({ type: "join", code: form.code, name: form.name.trim() });
    };
  }

  function playerList(players, me) {
    return `<ul class="mp-plist">${players.map(p => `<li class="${p.connected ? "" : "off"}"><span class="av" aria-hidden="true">${esc(p.name[0].toUpperCase())}</span>
      <span class="nm">${esc(p.name)}${p.id === me ? " (you)" : ""}</span>${p.isHost ? '<span class="tag">Host</span>' : ""}${p.connected ? "" : '<span class="tag off">reconnecting…</span>'}</li>`).join("")}</ul>`;
  }

  function lobby() {
    const n = S.players.length, ready = S.players.filter(p => p.connected).length >= S.minToStart;
    box.innerHTML = head("Lobby") + banner() + `
    <div class="card" style="text-align:center">
      <p class="muted" style="margin:0">Party code</p>
      <div class="mp-code" aria-label="Party code ${S.code.split("").join(" ")}">${S.code.split("").map(c => `<span>${c}</span>`).join("")}</div>
      <div class="row" style="justify-content:center"><button class="chip" id="copy">📋 Copy code</button></div>
      <p class="muted" style="margin-top:10px">Friends open this site, tap <b>Party</b>, choose <b>Join a room</b>, and enter the code.</p></div>
    <div class="card" style="margin-top:14px"><div class="row spread"><h2 style="margin:0">Players</h2><span class="muted">${n} of ${S.maxPlayers}</span></div>${playerList(S.players, S.you.id)}</div>
    <div class="row" style="margin-top:14px">
      ${S.you.isHost ? `<button class="btn" id="start" ${ready ? "" : "disabled"}>Start game</button><button class="btn alt" id="end">Close room</button>` : `<p class="muted" style="margin:0"><span class="mp-spin sm" aria-hidden="true"></span> Waiting for the host to start…</p><button class="btn alt" id="leave">Leave</button>`}
    </div>
    ${S.you.isHost && !ready ? `<p class="muted" style="margin-top:8px">Waiting for at least ${S.minToStart} players to join.</p>` : ""}`;
    const st = $("#start"); if (st) { st.onclick = () => act({ type: "start" }, false); }
    const en = $("#end"); if (en) en.onclick = () => { if (confirm("Close this room for everyone?")) act({ type: "end" }, false); };
    const lv = $("#leave"); if (lv) lv.onclick = leaveRoom;
    $("#copy").onclick = async e => { try { await navigator.clipboard.writeText(S.code); e.target.textContent = "✅ Copied"; } catch (x) { e.target.textContent = "Code: " + S.code; } };
  }

  function board(list, me, total) {
    const ordered = list.slice().sort((a, b) => b.score - a.score || b.answered - a.answered);
    return `<ul class="mp-lb">${ordered.map(p => `<li class="${p.id === me ? "me" : ""} ${p.connected ? "" : "off"}">
      <div class="row spread"><b>${esc(p.name)}${p.id === me ? " (you)" : ""}${p.connected ? "" : " · reconnecting…"}</b><span>${p.score} pt${p.score === 1 ? "" : "s"}</span></div>
      <div class="bar"><i style="width:${total ? 100 * p.answered / total : 0}%"></i></div>
      <small class="muted">${p.finished ? "Finished" : `Question ${Math.min(p.answered + 1, total)} of ${total}`}</small></li>`).join("")}</ul>`;
  }
  let lastKey = "";
  function playing() {
    const q = shown, key = [S.code, q ? q.index : "done", result ? result.index : "-", status, notice ? 1 : 0, S.you.isHost].join("|");
    if (key === lastKey && $("#lb")) { $("#lb").innerHTML = board(S.players, S.you.id, S.total); return; }
    lastKey = key;
    const labels = "ABCD";
    let main;
    if (q) {
      const fb = result && result.index === q.index;
      main = `<div class="row spread"><span class="tag">Question ${q.index + 1} of ${S.total}</span><span class="muted">Your score: <b>${fb ? result.score : S.you.score}</b></span></div>
      <div class="bar" style="margin:10px 0 16px"><i style="width:${100 * q.index / S.total}%"></i></div>
      <div class="card"><h2 id="qt">${esc(q.text)}</h2><div role="group" aria-labelledby="qt">
        ${q.options.map((o, i) => `<button class="opt ${fb ? (i === result.correctIndex ? "right" : i === picked ? "wrong" : "") : ""}" data-i="${i}" ${fb || busy ? "disabled" : ""}><span class="k">${labels[i]}</span><span>${esc(o)}</span></button>`).join("")}</div>
        ${fb ? `<div class="fb ${result.correct ? "ok" : "no"}" aria-live="polite"><b>${result.correct ? "✅ Correct! +1 point" : "❌ Not quite. No points lost."}</b>${result.correct ? "" : `<p>The correct answer is <b>${esc(q.options[result.correctIndex])}</b>.</p>`}<p>${esc(result.explanation)}</p></div>
        <button class="btn" id="nx">${q.index + 1 >= S.total ? "Finish" : "Next question →"}</button>` : ""}</div>`;
    } else {
      main = `<div class="card" style="text-align:center"><h2>🏁 You finished!</h2><p>You scored <b>${S.you.score} of ${S.total}</b>. Waiting for the other players…</p></div>`;
    }
    box.innerHTML = head("Party Game") + banner() + main + `<h2 style="margin-top:22px">Live scoreboard</h2><div id="lb">${board(S.players, S.you.id, S.total)}</div>
      <div class="row" style="margin-top:14px">${S.you.isHost ? `<button class="btn alt" id="end">End game for everyone</button>` : `<button class="chip" id="leave">Leave game</button>`}</div>`;
    box.querySelectorAll(".opt").forEach(b => b.onclick = () => { if (busy || (result && result.index === q.index)) return; picked = +b.dataset.i; act({ type: "answer", q: q.index, choice: picked }); });
    const nx = $("#nx"); if (nx) { nx.focus(); nx.onclick = () => { result = null; picked = null; shown = S.question; lastKey = ""; render(); window.scrollTo(0, 0); }; }
    const en = $("#end"); if (en) en.onclick = () => { if (confirm("End the game for everyone now?")) act({ type: "end" }, false); };
    const lv = $("#leave"); if (lv) lv.onclick = () => { if (confirm("Leave this game? You can rejoin if you refresh, but not after leaving.")) leaveRoom(); };
  }
  function results() {
    lastKey = "";
    const why = S.endedReason === "host_ended" ? "The host ended the game early." : S.endedReason === "host_left" ? "The host left, so the game ended early." : "";
    const medals = ["🥇", "🥈", "🥉"];
    box.innerHTML = head("Results") + banner() + (why ? `<div class="mp-banner info">${why}</div>` : "") + (S.roomClosed ? `<div class="mp-banner info">${esc(S.roomClosed)}</div>` : "") + `
    <div class="card"><ol class="mp-res">${S.results.map(r => `<li class="${r.id === S.you.id ? "me" : ""}"><span class="rk">${r.rank <= 3 ? medals[r.rank - 1] : r.rank}</span><span class="nm">${esc(r.name)}${r.id === S.you.id ? " (you)" : ""}</span><span class="sc">${r.score}/${S.total}</span></li>`).join("")}</ol></div>
    <h2 style="margin-top:22px">Your answers</h2>
    ${S.review.length ? S.review.map(r => `<div class="${r.ok ? "mp-ok" : "missed"}" style="margin:8px 0;padding:8px 14px"><b>${esc(r.text)}</b><br>${r.ok ? "✅ " : "❌ You chose: " + esc(r.yours) + "<br>Correct: "}<b>${esc(r.correct)}</b><br><span class="muted">${esc(r.explanation)}</span></div>`).join("") : `<p class="muted">You didn't answer any questions.</p>`}
    <div class="row" style="margin-top:14px"><button class="btn" id="again">Back to Party menu</button>${S.you.isHost && !S.roomClosed ? `<button class="btn alt" id="end">Close room</button>` : ""}<a class="btn alt" href="#/learn">Review notes</a></div>`;
    $("#again").onclick = leaveRoom;
    const en = $("#end"); if (en) en.onclick = () => act({ type: "end" }, false);
  }

  /* ---------- public ---------- */
  window.Multiplayer = {
    mount(el) { box = el; lastKey = ""; if (saved() && status !== "open" && status !== "connecting") { connect(); } render(); },
    unmount() { box = null; }
  };
  window.addEventListener("online", () => { if (S || saved()) { attempts = 0; connect(); } });
})();
