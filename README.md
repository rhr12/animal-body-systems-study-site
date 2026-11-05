# Animal Body Systems Study Hub 🐚

An interactive study website for 7th grade science, **Module B · Unit 2 · Lesson 3 (MBU2L3)**.
Built from Ms. Richmond's Study Guide and the Jeopardy-style review. Quiz date: **11/06/26**.

## What's inside

| Tab | What it does |
| --- | --- |
| **Home** | Quiz countdown and a 5-step study path with saved progress |
| **Learn** | Short, easy notes on every system, tissue, and the chambered nautilus |
| **Flashcards** | 34 flip cards, filter by topic, mark "Got it" / "Still learning" |
| **Quiz** | 41 multiple-choice questions, instant feedback with explanations, retry the ones you missed |
| **Party** | Multiplayer quiz with party codes (needs the party server, see below) |
| **Games → Review Game** | The 5x5 Jeopardy board from class, self-scored |
| **Games → Nautilus Essay** | Practice the long-answer question with a key-word checker and sample answers |

Study progress is saved in your browser (localStorage) on your own device. No account is needed.

## Run it

**Study tabs only (no server):** double-click `index.html`. Everything except **Party** works with no install.

**Everything including Party mode:** you need Node.js 18 or newer.

```bash
npm install
npm start
```

Open <http://localhost:3000>. The server also serves the website, so this one command runs it all. To play with friends on the same Wi-Fi, they open `http://<your-computer-ip>:3000` on their own devices. To play over the internet, host the server (see "Hosting Party mode").

Run the tests (real WebSocket clients against the real server):

```bash
npm test
```

## Party mode (multiplayer)

1. One player taps **Party → Create a room** and picks a name and 5, 10, 15 or 20 questions. They become the host and get a 4-character code.
2. Friends tap **Party → Join a room**, enter the code and a name. Up to 8 players.
3. The host sees everyone in the lobby and can start once 2 players have joined.
4. Everyone gets the same questions in the same order, and answers on their own device at their own pace. A live scoreboard shows each player's score and progress.
5. Scoring matches the normal quiz: **1 point per correct answer, nothing lost for a wrong one.**
6. At the end everyone sees the ranked results and their own answers with explanations. Ties share a rank.

### How it works

- **Server:** `server/server.js` is a Node server using WebSockets (the `ws` package). WebSockets fit because the server must push lobby and score changes to every player instantly, and each player needs a two-way connection.
- **Server decides everything:** it picks and shuffles the questions, checks every answer, and keeps all scores. The browser only sends "I choose option 2 for question 4". The correct answer is only sent back to a player after they answer. A browser cannot send a score, skip ahead, or answer a question twice.
- **One source of questions:** the server reads `js/data.js`, the same file the quiz uses.
- **Room data:** rooms live in server memory only (names, scores, answers). Nothing is saved to disk, and a server restart clears all rooms.
- **Refresh or disconnect:** each player gets a secret token stored in that browser tab (`sessionStorage`). After a refresh or dropped connection the page reconnects automatically and uses the token to return to the same seat with the same score. A disconnected player stays in the game about a minute before the game stops waiting for them, and in the lobby for 30 seconds. They can still rejoin after that if the room is still open.
- **Host leaves:** if the host leaves or stays disconnected for a minute, the lobby closes, or a running game ends early and shows results. The host can also end a game early, or close the room.
- **Other limits:** 8 players per room, 200 rooms per server, rate limiting per connection, small message size limit, names validated on the server, cross-origin WebSocket connections refused unless allowed.

### Hosting Party mode

GitHub Pages only hosts static files, so Party mode needs a Node host such as Render, Railway or Fly.io. The start command is `npm start`. The server reads the `PORT` environment variable that these hosts set.

Two ways to deploy:

1. **Host everything there (simplest).** Deploy this repo to the Node host and open its URL. No extra setup.
2. **Keep the site on GitHub Pages, run only the server elsewhere.** Set your server's address in `js/config.js` (for example `window.MP_SERVER = "https://my-party.onrender.com";`), and set the server environment variable `ALLOWED_ORIGINS=https://rhr12.github.io` so it accepts connections from the Pages site.

No API keys or secrets are used anywhere. Free hosting tiers may sleep when idle, so the first connection can take a while, and a restart clears rooms.

## Put it online (optional)

On GitHub: **Settings → Pages → Deploy from a branch → `main` / root**. Your site appears at `https://<username>.github.io/animal-body-systems-study-site/`.

## Project layout

```
index.html        page shell
css/styles.css    ocean theme, sidebar on desktop and tab bar on phone (light + dark mode)
js/data.js        ALL study content: notes, flashcards, quiz, board, essay
js/app.js         app logic (views, quiz engine, progress saving)
js/multi.js       Party mode client (menu, lobby, game, results)
js/config.js      address of the party server (blank = same site)
server/server.js  party server: rooms, scoring, WebSockets, static files
test/             server tests (npm test)
```

To add or fix a question, edit `js/data.js`. In `QUESTIONS`, the **first** option in `o` is the correct one (the app shuffles the order).

## Accuracy

All facts come from the two PDFs. A few quiz questions rephrase a fact as a scenario (for example, which systems deliver oxygen to a runner's muscles) using standard 7th grade science. If your teacher's wording differs from this site, follow your teacher.
