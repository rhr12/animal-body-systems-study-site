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
| **Games → Review Game** | The 5x5 Jeopardy board from class, self-scored |
| **Games → Nautilus Essay** | Practice the long-answer question with a key-word checker and sample answers |

Progress is saved in your browser (localStorage) on your own device. No account or internet needed.

## Run it

It is plain HTML, CSS, and JavaScript. There is nothing to install or build.

**Easiest:** double-click `index.html` to open it in your browser.

**Or run a local server** (needed only if you want to test on your phone):

```bash
cd animal-body-systems-study-site
python3 -m http.server 8000
```

Then open <http://localhost:8000>. To try it on your phone, connect to the same Wi-Fi and open `http://<your-computer-ip>:8000`.

## Put it online (optional)

On GitHub: **Settings → Pages → Deploy from a branch → `main` / root**. Your site appears at `https://<username>.github.io/animal-body-systems-study-site/`.

## Project layout

```
index.html        page shell
css/styles.css    ocean theme, sidebar on desktop and tab bar on phone (light + dark mode)
js/data.js        ALL study content: notes, flashcards, quiz, board, essay
js/app.js         app logic (views, quiz engine, progress saving)
```

To add or fix a question, edit `js/data.js`. In `QUESTIONS`, the **first** option in `o` is the correct one (the app shuffles the order).

## Accuracy

All facts come from the two PDFs. A few quiz questions rephrase a fact as a scenario (for example, which systems deliver oxygen to a runner's muscles) using standard 7th grade science. If your teacher's wording differs from this site, follow your teacher.
