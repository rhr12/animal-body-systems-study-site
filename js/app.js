(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const app = $("#app");
  const QUIZ_DATE = new Date(2026, 10, 6); // Nov 6, 2026 (month is 0-based)

  /* ---------- storage (safe if blocked) ---------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem("mbu2l3:" + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("mbu2l3:" + k, JSON.stringify(v)); } catch (e) {} }
  };
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const NAV = [["home", "🏠 Home"], ["learn", "📖 Learn"], ["cards", "🃏 Flashcards"], ["quiz", "✏️ Quiz"], ["board", "🎯 Review Game"], ["nautilus", "🐚 Nautilus Essay"]];
  function renderNav(cur) {
    $("#nav").innerHTML = NAV.map(([id, l]) => `<a href="#/${id}" ${id === cur ? 'aria-current="page"' : ""}>${l}</a>`).join("");
  }

  /* ---------- progress ---------- */
  const mastered = () => new Set(store.get("mastered", []));
  const known = () => new Set(store.get("known", []));
  const qid = q => q.q;

  /* ---------- HOME ---------- */
  function home() {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const days = Math.round((QUIZ_DATE - today) / 864e5);
    const when = days > 1 ? `Quiz in ${days} days` : days === 1 ? "Quiz is TOMORROW" : days === 0 ? "Quiz is TODAY" : "Quiz date has passed";
    const m = mastered().size, tot = QUESTIONS.length, k = known().size;
    const pctQ = Math.round(100 * m / tot), pctC = Math.round(100 * k / CARDS.length);
    app.innerHTML = `
    <section class="hero">
      <span class="pill">📅 ${when} · Nov 6</span>
      <h1>Animal Body Systems</h1>
      <p>Study for your Module B · Unit 2 · Lesson 3 quiz. Read the notes, flip flashcards, answer practice questions, and play the review game.</p>
      <a class="btn" href="#/quiz">Start practice quiz →</a>
      <span class="big-emoji">🐚</span>
    </section>
    <h2 style="margin-top:26px">Your plan</h2>
    <div class="grid g3">
      <a class="card tile" href="#/learn"><div class="ico">📖</div><h3>1. Learn</h3><p class="muted">Short notes on every system, tissue, and the nautilus.</p></a>
      <a class="card tile" href="#/cards"><div class="ico">🃏</div><h3>2. Flashcards</h3><p class="muted">${CARDS.length} cards for vocab and key facts.</p></a>
      <a class="card tile" href="#/quiz"><div class="ico">✏️</div><h3>3. Quiz yourself</h3><p class="muted">${tot} questions with explanations.</p></a>
      <a class="card tile" href="#/board"><div class="ico">🎯</div><h3>4. Review game</h3><p class="muted">The Jeopardy-style board from class.</p></a>
      <a class="card tile" href="#/nautilus"><div class="ico">🐚</div><h3>5. Nautilus essay</h3><p class="muted">Practice the long-answer question.</p></a>
    </div>
    <h2 style="margin-top:26px">Your progress</h2>
    <div class="grid g2">
      <div class="card"><div class="stat">${pctQ}%</div><p class="muted">of quiz questions answered correctly at least once (${m}/${tot})</p><div class="bar"><i style="width:${pctQ}%"></i></div></div>
      <div class="card"><div class="stat">${pctC}%</div><p class="muted">of flashcards marked "Got it" (${k}/${CARDS.length})</p><div class="bar"><i style="width:${pctC}%"></i></div></div>
    </div>
    <p class="muted" style="margin-top:14px"><button class="chip" id="reset">Reset my progress</button></p>`;
    $("#reset").onclick = () => { if (confirm("Reset all saved progress?")) { store.set("mastered", []); store.set("known", []); store.set("board", {}); home(); } };
  }

  /* ---------- LEARN ---------- */
  function learn() {
    app.innerHTML = `<h1>📖 Learn</h1><p class="muted">Tap a topic to open it. Bold words are the ones to remember.</p>
    <div class="row" style="margin-bottom:14px"><button class="chip" id="all">Open all</button><button class="chip" id="none">Close all</button></div>
    ${NOTES.map(n => `<details class="note"><summary><span>${TOPICS[n.topic].emoji}</span>${n.title}<span class="tag">${TOPICS[n.topic].label}</span></summary>
      <div class="body">${n.intro ? `<p>${n.intro}</p>` : ""}<ul>${n.points.map(p => `<li>${p}</li>`).join("")}</ul>${n.extra ? `<div class="tip">💡 ${n.extra}</div>` : ""}</div></details>`).join("")}
    <p style="margin-top:18px"><a class="btn" href="#/cards">Next: Flashcards →</a></p>`;
    const set = o => app.querySelectorAll("details").forEach(d => d.open = o);
    $("#all").onclick = () => set(true); $("#none").onclick = () => set(false);
  }

  /* ---------- FLASHCARDS ---------- */
  function cards() {
    let topic = "all", onlyLearning = false, deck = [], i = 0, flipped = false;
    const build = () => {
      const kn = known();
      deck = CARDS.map((c, idx) => ({ c, idx })).filter(({ c, idx }) => (topic === "all" || c[2] === topic) && (!onlyLearning || !kn.has(idx)));
      i = 0; flipped = false;
    };
    function draw() {
      const kn = known();
      const chips = [["all", "All"]].concat(Object.entries(TOPICS).map(([k, v]) => [k, v.emoji + " " + v.label]));
      let html = `<h1>🃏 Flashcards</h1>
      <div class="row" role="group" aria-label="Filter by topic">${chips.map(([k, l]) => `<button class="chip" data-t="${k}" aria-pressed="${k === topic}">${l}</button>`).join("")}</div>
      <div class="row" style="margin-top:10px"><button class="chip" id="only" aria-pressed="${onlyLearning}">Only cards I'm still learning</button><button class="chip" id="shuf">🔀 Shuffle</button></div>`;
      if (!deck.length) {
        html += `<div class="card" style="margin-top:16px;text-align:center"><h2>🎉 Nothing left here!</h2><p class="muted">You marked every card in this group as "Got it".</p><button class="btn" id="clr">Show all cards again</button></div>`;
      } else {
        const { c, idx } = deck[i];
        html += `<p class="muted" style="text-align:center;margin:14px 0 0">Card ${i + 1} of ${deck.length}${kn.has(idx) ? " · ✅ known" : ""}</p>
        <div class="scene"><button class="flip ${flipped ? "on" : ""}" id="flip" aria-label="Flashcard. Press to flip." >
          <span class="face f"><small>${TOPICS[c[2]].label}</small><b>${c[0]}</b><span class="hint">tap to flip</span></span>
          <span class="face b" aria-hidden="${!flipped}">${c[1]}</span></button></div>
        <div class="row" style="justify-content:center">
          <button class="btn alt" id="prev" aria-label="Previous card">←</button>
          <button class="btn bad" id="again">Still learning</button>
          <button class="btn good" id="got">Got it ✓</button>
          <button class="btn alt" id="next" aria-label="Next card">→</button></div>
        <p class="muted" style="text-align:center;font-size:.85rem">Tip: space = flip · arrow keys = move</p>`;
      }
      app.innerHTML = html;
      app.querySelectorAll("[data-t]").forEach(b => b.onclick = () => { topic = b.dataset.t; build(); draw(); });
      $("#only").onclick = () => { onlyLearning = !onlyLearning; build(); draw(); };
      $("#shuf").onclick = () => { deck = shuffle(deck); i = 0; flipped = false; draw(); };
      if ($("#clr")) $("#clr").onclick = () => { store.set("known", []); onlyLearning = false; build(); draw(); };
      if (deck.length) {
        $("#flip").onclick = () => { flipped = !flipped; $("#flip").classList.toggle("on", flipped); };
        const go = d => { i = (i + d + deck.length) % deck.length; flipped = false; draw(); $("#flip").focus(); };
        $("#prev").onclick = () => go(-1); $("#next").onclick = () => go(1);
        $("#got").onclick = () => { const s = known(); s.add(deck[i].idx); store.set("known", [...s]); go(1); };
        $("#again").onclick = () => { const s = known(); s.delete(deck[i].idx); store.set("known", [...s]); go(1); };
      }
    }
    cardKeys = e => {
      if (!deck.length || e.target.closest("button.chip")) return;
      if (e.key === "ArrowRight") { $("#next").click(); } else if (e.key === "ArrowLeft") { $("#prev").click(); }
    };
    build(); draw();
  }
  let cardKeys = null;
  document.addEventListener("keydown", e => { if (cardKeys && location.hash === "#/cards") cardKeys(e); });

  /* ---------- QUIZ ---------- */
  function quiz(preset) {
    function setup() {
      const sel = new Set(Object.keys(TOPICS)); let len = 10;
      const draw = () => {
        const pool = QUESTIONS.filter(q => sel.has(q.t));
        app.innerHTML = `<h1>✏️ Practice Quiz</h1><p class="muted">Pick topics and how many questions. After each answer you'll see why it's right or wrong.</p>
        <div class="card"><h3>Topics</h3><div class="row">${Object.entries(TOPICS).map(([k, v]) => `<button class="chip" data-t="${k}" aria-pressed="${sel.has(k)}">${v.emoji} ${v.label}</button>`).join("")}</div>
        <div class="row" style="margin-top:8px"><button class="chip" id="selall">Select all</button><button class="chip" id="selnone">Clear</button></div>
        <h3 style="margin-top:18px">Number of questions</h3><div class="row">${[10, 20, 0].map(n => `<button class="chip" data-n="${n}" aria-pressed="${len === n}">${n || "All"}</button>`).join("")}</div>
        <p class="muted" style="margin-top:14px">${pool.length} questions available in your selection.</p>
        <button class="btn" id="go" ${pool.length ? "" : "disabled"}>Start quiz</button></div>`;
        app.querySelectorAll("[data-t]").forEach(b => b.onclick = () => { sel.has(b.dataset.t) ? sel.delete(b.dataset.t) : sel.add(b.dataset.t); draw(); });
        app.querySelectorAll("[data-n]").forEach(b => b.onclick = () => { len = +b.dataset.n; draw(); });
        $("#selall").onclick = () => { Object.keys(TOPICS).forEach(k => sel.add(k)); draw(); };
        $("#selnone").onclick = () => { sel.clear(); draw(); };
        $("#go").onclick = () => { const s = shuffle(pool); run(len ? s.slice(0, len) : s); };
      };
      draw();
    }

    function run(list) {
      let n = 0, score = 0; const missed = [];
      function ask() {
        const q = list[n];
        const opts = shuffle(q.o.map((t, idx) => ({ t, ok: idx === 0 })));
        const L = "ABCD";
        app.innerHTML = `<div class="row spread"><span class="tag">${TOPICS[q.t].emoji} ${TOPICS[q.t].label}</span><span class="muted">Question ${n + 1} of ${list.length} · Score ${score}</span></div>
        <div class="bar" style="margin:10px 0 18px"><i style="width:${100 * n / list.length}%"></i></div>
        <div class="card"><h2 id="qtext">${q.q}</h2>
        <div role="group" aria-labelledby="qtext">${opts.map((o, k) => `<button class="opt" data-k="${k}"><span class="k">${L[k]}</span><span>${o.t}</span></button>`).join("")}</div>
        <div id="fb" aria-live="polite"></div></div>`;
        app.querySelectorAll(".opt").forEach(b => b.onclick = () => {
          const pick = opts[+b.dataset.k];
          app.querySelectorAll(".opt").forEach((x, k) => { x.disabled = true; if (opts[k].ok) x.classList.add("right"); });
          const good = pick.ok;
          if (good) { score++; const m = mastered(); m.add(qid(q)); store.set("mastered", [...m]); }
          else { b.classList.add("wrong"); missed.push({ q, pick: pick.t }); }
          const cheers = ["Nice work!", "Correct!", "You got it!", "Yes!", "Exactly right!"];
          const oops = ["Not quite.", "Almost!", "Good try.", "Let's learn from this one."];
          $("#fb").innerHTML = `<div class="fb ${good ? "ok" : "no"}"><b>${good ? "✅ " + cheers[n % cheers.length] : "❌ " + oops[n % oops.length]}</b>
            ${good ? "" : `<p>The correct answer is <b>${esc(opts.find(o => o.ok).t)}</b>.</p>`}<p>${q.e}</p></div>
            <button class="btn" id="nx">${n + 1 === list.length ? "See results" : "Next question →"}</button>`;
          $("#nx").focus();
          $("#nx").onclick = () => { n++; n < list.length ? ask() : done(); };
        });
      }
      function done() {
        const pct = Math.round(100 * score / list.length);
        const msg = pct === 100 ? "Perfect score! 🏆" : pct >= 80 ? "Great job! You're almost quiz-ready. 🌟" : pct >= 60 ? "Good start. Review the missed ones below. 💪" : "Keep going. Check the Learn tab, then try again. 📚";
        app.innerHTML = `<div class="card" style="text-align:center"><h1>Results</h1>
          <div class="score-ring" style="--p:${pct}"><span>${pct}%</span></div>
          <h2>${score} of ${list.length} correct</h2><p>${msg}</p>
          <div class="row" style="justify-content:center">
            ${missed.length ? `<button class="btn" id="retry">Retry the ${missed.length} I missed</button>` : ""}
            <button class="btn alt" id="again">New quiz</button><a class="btn alt" href="#/learn" style="text-decoration:none">Review notes</a></div></div>
          ${missed.length ? `<h2 style="margin-top:22px">What to review</h2>${missed.map(m => `<div class="missed"><b>${m.q.q}</b><br>You chose: ${esc(m.pick)}<br>Correct: <b>${esc(m.q.o[0])}</b><br><span class="muted">${m.q.e}</span></div>`).join("")}` : ""}`;
        if ($("#retry")) $("#retry").onclick = () => run(shuffle(missed.map(m => m.q)));
        $("#again").onclick = setup;
      }
      ask();
    }
    setup();
  }

  /* ---------- REVIEW BOARD ---------- */
  function board() {
    const state = store.get("board", {});
    const vals = [100, 200, 300, 400, 500];
    function draw() {
      const got = Object.values(state).filter(v => v === "got").length, tried = Object.keys(state).length;
      app.innerHTML = `<h1>🎯 Review Game</h1><p class="muted">The Jeopardy board from class. Tap a square, read the clue, say your answer out loud, then reveal it and score yourself. Tricky ones turn red so you can retry.</p>
      <div class="row spread" style="margin-bottom:10px"><b>✅ ${got} correct · ${tried} played of 25</b><button class="chip" id="rb">Reset board</button></div>
      <div class="board" role="grid">${BOARD.map(c => `<div class="cat">${c.cat}</div>`).join("")}
      ${vals.map((v, r) => BOARD.map((c, ci) => { const key = ci + "-" + r, s = state[key]; return `<button class="cell ${s || ""}" data-c="${ci}" data-r="${r}" aria-label="${c.cat} for ${v}${s ? ", " + s : ""}">${s === "got" ? "✓" : s === "miss" ? "✗" : v}</button>`; }).join("")).join("")}</div>
      <dialog id="dlg"><div class="in"></div></dialog>`;
      $("#rb").onclick = () => { Object.keys(state).forEach(k => delete state[k]); store.set("board", state); draw(); };
      app.querySelectorAll(".cell").forEach(b => b.onclick = () => open(+b.dataset.c, +b.dataset.r));
    }
    function open(c, r) {
      const [clue, ans] = BOARD[c].clues[r], d = $("#dlg"), key = c + "-" + r;
      d.querySelector(".in").innerHTML = `<span class="tag">${BOARD[c].cat} · ${vals[r]}</span><h2 style="margin-top:12px">${clue}</h2><div id="ar"><button class="btn" id="rev">Reveal answer</button></div>
        <p style="margin-top:14px"><button class="chip" id="cl">Close</button></p>`;
      d.showModal();
      $("#cl").onclick = () => d.close();
      $("#rev").onclick = () => {
        $("#ar").innerHTML = `<div class="ans">${ans}</div><p>Did you get it?</p><div class="row"><button class="btn good" id="y">I got it ✓</button><button class="btn bad" id="n">Not yet ✗</button></div>`;
        const fin = v => { state[key] = v; store.set("board", state); d.close(); draw(); };
        $("#y").onclick = () => fin("got"); $("#n").onclick = () => fin("miss");
      };
    }
    draw();
  }

  /* ---------- NAUTILUS ---------- */
  function nautilus() {
    const saved = store.get("nautilus", {});
    app.innerHTML = `<h1>🐚 Chambered Nautilus Essay</h1>
    <div class="card"><b>Study guide question:</b> How does the nautilus's body structure meet the needs of the animal? Support your answer with specific examples of the animal's body structures and function.
    <p class="muted" style="margin:.6em 0 0">Write a sentence or two for each part below. The checker highlights key words you used, so you can see what you might be missing. It can't grade your whole answer, so compare with the sample too.</p></div>
    ${NAUTILUS.map(s => `<div class="card" style="margin-top:14px"><h2>${s.emoji} ${s.title}</h2><p class="muted">${s.hint}</p>
      <label for="t-${s.id}" class="muted" style="font-size:.85rem">Your answer</label>
      <textarea id="t-${s.id}" placeholder="Type your answer here...">${esc(saved[s.id] || "")}</textarea>
      <div id="k-${s.id}" aria-live="polite"></div>
      <button class="chip" id="b-${s.id}" style="margin-top:10px">Show sample answer</button><div id="s-${s.id}"></div></div>`).join("")}
    <p class="muted" style="margin-top:14px">Your writing is saved on this device only.</p>`;
    NAUTILUS.forEach(s => {
      const ta = $("#t-" + s.id);
      const check = () => {
        const txt = ta.value.toLowerCase();
        $("#k-" + s.id).innerHTML = "Key words: " + s.keys.map((alts, i) => `<span class="kw ${alts.some(a => txt.includes(a)) ? "hit" : ""}">${alts.some(a => txt.includes(a)) ? "✓ " : ""}${s.keyLabels[i]}</span>`).join("");
        saved[s.id] = ta.value; store.set("nautilus", saved);
      };
      ta.oninput = check; check();
      $("#b-" + s.id).onclick = () => { $("#s-" + s.id).innerHTML = `<div class="sample"><b>Sample:</b> ${s.sample}</div>`; };
    });
  }

  /* ---------- router ---------- */
  const routes = { home, learn, cards, quiz, board, nautilus };
  function route() {
    cardKeys = null;
    const id = (location.hash.replace(/^#\/?/, "") || "home");
    const r = routes[id] ? id : "home";
    renderNav(r); routes[r](); window.scrollTo(0, 0);
    document.title = (r === "home" ? "" : NAV.find(n => n[0] === r)[1].replace(/^\S+\s/, "") + " · ") + "Animal Body Systems Study Hub";
  }
  window.addEventListener("hashchange", route);
  route();
})();
