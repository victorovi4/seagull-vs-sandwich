# Wave System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить 5 волн по 30 с, паузу с репликой между ними, счётчик убитых чаек в HUD, номер волны, и экран победы со званием.

**Architecture:** Всё в одном файле `index.html`. Расширяем объект `state` новыми полями, рефакторим логику спавна на волновую, добавляем новые HTML-элементы (wave overlay, victory screen) и CSS.

**Tech Stack:** Vanilla JS, HTML5 Canvas, CSS — без зависимостей.

---

## Карта изменений в файле

| Область | Строки (прибл.) | Что меняем |
|---------|----------------|-----------|
| CSS блок | 10–168 | +стили: `.wave-overlay`, `.wave-indicator`, `.kill-badge`, `.victory-title` |
| HUD HTML | 173–176 | +kill counter span, +wave indicator div |
| endScreen HTML | 197–201 | остаётся для Game Over, без изменений |
| +victoryScreen HTML | после 201 | новый div#victoryScreen |
| +waveOverlay HTML | после victoryScreen | новый div#waveOverlay |
| state объект | 297–304 | +wave, waveTimer, wavePause, pauseTimer, killCount |
| JS переменные | 207–216 | +killEl, waveIndicatorEl, waveOverlayEl, waveMsgEl, waveNumEl, victoryScreenEl, victoryTitleEl, victoryStatsEl |
| handleTap / score++ | 914–915 | +state.killCount++, killEl.textContent |
| loop / спавн | 1056–1098 | заменить timeAlive-логику на волновую |
| loop / wave tick | после 1105 | +wavePause/waveTimer обновление |
| startGame() | 1152–1170 | +сброс новых полей, waveIndicatorEl.textContent |
| endGame() | 1172–1189 | без изменений (game over при потере жизней) |
| +victoryGame() | после endGame | новая функция |
| +spawnForWave() | до loop | новая функция |
| +WAVE_MESSAGES | до loop | константа |
| restartBtn listener | 1195 | +victoryBtn listener |

---

## Task 1: CSS + HTML структура

**Files:**
- Modify: `index.html` (CSS секция ~строки 10–168, HTML ~строки 173–202)

- [ ] **Шаг 1.1: Добавить CSS** — вставить перед закрывающим `</style>` (строка ~168):

```css
  .wave-indicator {
    font-family: 'Caveat', cursive;
    font-size: clamp(20px, 5vw, 28px);
    font-weight: 700;
    color: #2A2A2D;
    background: rgba(236, 232, 219, 0.85);
    padding: 2px 10px;
    border-radius: 2px;
    box-shadow: 2px 2px 0 rgba(0,0,0,0.1);
    transform: rotate(1deg);
  }
  .kill-badge {
    font-size: 0.82em;
    color: #5A5DAB;
    margin-left: 8px;
  }
  .wave-overlay {
    position: fixed;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%) rotate(-1.5deg);
    background: rgba(236, 232, 219, 0.95);
    padding: 16px 32px;
    border-radius: 4px;
    text-align: center;
    z-index: 8;
    box-shadow: 3px 3px 0 rgba(0,0,0,0.12);
    pointer-events: none;
  }
  .wave-overlay-msg {
    font-family: 'Caveat', cursive;
    font-size: clamp(24px, 6vw, 40px);
    font-weight: 700;
    color: #2A2A2D;
    line-height: 1.1;
  }
  .wave-overlay-num {
    font-family: 'Patrick Hand', cursive;
    font-size: clamp(14px, 3.5vw, 20px);
    color: #5A5DAB;
    margin-top: 4px;
  }
  .victory-rank {
    font-family: 'Caveat', cursive;
    font-size: clamp(30px, 7vw, 54px);
    font-weight: 700;
    color: #5A5DAB;
    margin: 8px 0 16px;
    transform: rotate(-1deg);
    display: block;
  }
```

- [ ] **Шаг 1.2: Обновить HUD HTML** — заменить строки 173–176:

```html
<div class="hud hidden" id="hud">
  <div class="score">Счёт: <span id="scoreVal">0</span><span class="kill-badge">🐦 <span id="killVal">0</span></span></div>
  <div class="wave-indicator" id="waveIndicator">Волна 1/5</div>
  <div class="lives" id="lives"></div>
</div>
```

- [ ] **Шаг 1.3: Добавить victoryScreen HTML** — вставить после строки 201 (`</div>` endScreen):

```html
<div class="overlay hidden" id="victoryScreen">
  <h1 style="font-family:'Caveat',cursive;font-size:clamp(48px,10vw,72px);transform:rotate(-2deg)">🎉 Победа!</h1>
  <span class="victory-rank" id="victoryRank"></span>
  <p id="victoryStats" style="font-size:clamp(16px,4vw,20px);color:#3F3F45;margin-bottom:20px"></p>
  <button class="btn" id="victoryBtn">Ещё раз!</button>
</div>
```

- [ ] **Шаг 1.4: Добавить waveOverlay HTML** — вставить сразу после victoryScreen:

```html
<div class="wave-overlay hidden" id="waveOverlay">
  <div class="wave-overlay-msg" id="waveMsg"></div>
  <div class="wave-overlay-num" id="waveNumEl"></div>
</div>
```

- [ ] **Шаг 1.5: Проверить** — открыть `index.html` в браузере, убедиться что стартовый экран выглядит как раньше, новые элементы hidden.

---

## Task 2: JS переменные + state + константы

**Files:**
- Modify: `index.html` (JS секция)

- [ ] **Шаг 2.1: Добавить DOM-переменные** — после строки 216 (`const styleNumEl = ...`):

```javascript
  const killEl            = document.getElementById('killVal');
  const waveIndicatorEl   = document.getElementById('waveIndicator');
  const waveOverlayEl     = document.getElementById('waveOverlay');
  const waveMsgEl         = document.getElementById('waveMsg');
  const waveNumElDOM      = document.getElementById('waveNumEl');
  const victoryScreenEl   = document.getElementById('victoryScreen');
  const victoryRankEl     = document.getElementById('victoryRank');
  const victoryStatsEl    = document.getElementById('victoryStats');
```

- [ ] **Шаг 2.2: Расширить объект state** — заменить строки 297–304:

```javascript
  const state = {
    running: false, score: 0, lives: 3,
    gulls: [], crumbs: [], feathers: [],
    spawnTimer: 800, spawnInterval: 2200,
    timeAlive: 0, shake: 0, flash: 0,
    biteProgress: 0,
    sandwichStyle: 1,
    // Wave system
    wave: 1,        // текущая волна 1..5
    waveTimer: 0,   // мс прошедших в текущей волне
    wavePause: false,
    pauseTimer: 0,  // обратный отсчёт паузы между волнами
    killCount: 0    // всего убито чаек
  };
```

- [ ] **Шаг 2.3: Добавить константы** — вставить после закрывающей скобки state (строка ~305):

```javascript
  const WAVE_DURATION = 30000; // мс на волну
  const PAUSE_DURATION = 3000; // мс паузы между волнами
  const TOTAL_WAVES = 5;

  const WAVE_MESSAGES = [
    '',                        // волна 1 — без паузы перед ней
    'Ещё одна стая летит!',   // перед волной 2
    'Держись, пират!',        // перед волной 3
    'Бутерброд в опасности!', // перед волной 4
    'Последняя волна!',       // перед волной 5
  ];

  function getTitle(kills) {
    if (kills >= 21) return 'Легенда парка 300-летия!';
    if (kills >= 13) return 'Гроза чаек';
    if (kills >= 6)  return 'Страж бутерброда';
    return 'Защитник';
  }
```

---

## Task 3: Волновой спавн + tick в loop

**Files:**
- Modify: `index.html` (функции спавна и game loop)

- [ ] **Шаг 3.1: Добавить функцию spawnForWave** — вставить перед функцией `loop` (строка ~1044):

```javascript
  function spawnForWave(wave) {
    const r = Math.random();
    if (wave === 1) {
      state.gulls.push(makeGull());
    } else if (wave === 2) {
      if (r < 0.22) {
        state.gulls.push(makeGull({ type: 'fromLeft' }));
        state.gulls.push(makeGull({ type: 'fromRight' }));
      } else {
        state.gulls.push(makeGull());
      }
    } else if (wave === 3) {
      if (r < 0.22) {
        state.gulls.push(makeGull({ type: 'fromLeft' }));
        state.gulls.push(makeGull({ type: 'fromRight' }));
      } else if (r < 0.38) {
        state.gulls.push(makeGull({ type: 'walking' }));
      } else {
        state.gulls.push(makeGull());
      }
    } else {
      // волны 4–5: всё включая пике и стаи
      if (r < 0.18) {
        state.gulls.push(makeGull({ type: 'fromLeft' }));
        state.gulls.push(makeGull({ type: 'fromRight' }));
        setTimeout(() => { if (state.running) state.gulls.push(makeGull()); }, 250);
      } else if (r < 0.30) {
        state.gulls.push(makeGull({ type: 'dive' }));
      } else if (r < 0.45) {
        state.gulls.push(makeGull({ type: 'walking' }));
      } else if (r < 0.62) {
        state.gulls.push(makeGull({ type: 'fromLeft' }));
        state.gulls.push(makeGull({ type: 'fromRight' }));
      } else {
        state.gulls.push(makeGull());
      }
    }
    // Скорость спавна: каждая волна чуть быстрее
    const waveFactor = [1.0, 0.88, 0.76, 0.62, 0.50][wave - 1];
    state.spawnInterval = (1900 + Math.random() * 600) * waveFactor;
    state.spawnTimer = state.spawnInterval;
  }
```

- [ ] **Шаг 3.2: Заменить старый спавн-блок в loop** — найти и заменить весь блок (строки ~1056–1098):

**БЫЛО** (весь блок от `state.spawnTimer -= dt;` до `state.spawnTimer = state.spawnInterval;`):
```javascript
      state.spawnTimer -= dt;
      if (state.spawnTimer <= 0) {
        // Difficulty stages
        // Stage 0:  0–15s — single normal gulls
        // ...
        const factor = Math.max(0.45, 1 - state.timeAlive * 0.000035);
        state.spawnInterval = (1900 + Math.random() * 600) * factor;
        state.spawnTimer = state.spawnInterval;
      }
```

**СТАЛО:**
```javascript
      // Спавн только вне паузы
      if (!state.wavePause) {
        state.spawnTimer -= dt;
        if (state.spawnTimer <= 0) {
          spawnForWave(state.wave);
        }
      }
```

- [ ] **Шаг 3.3: Добавить wave tick** — вставить после строки `if (boyHeadState.nod > 0) ...` (строка ~1105), т.е. в конец блока `if (state.running) {`:

```javascript
      // Wave timer
      if (!state.wavePause) {
        state.waveTimer += dt;
        if (state.waveTimer >= WAVE_DURATION) {
          if (state.wave < TOTAL_WAVES) {
            // Начать паузу перед следующей волной
            state.wavePause = true;
            state.pauseTimer = PAUSE_DURATION;
            state.waveTimer = 0;
            waveMsgEl.textContent = WAVE_MESSAGES[state.wave]; // state.wave ещё = текущая, сообщение про следующую
            waveNumElDOM.textContent = `Волна ${state.wave + 1} из ${TOTAL_WAVES}`;
            waveOverlayEl.classList.remove('hidden');
            triggerBoyNod();
          } else {
            // Волна 5 закончена — победа
            victoryGame();
          }
        }
      } else {
        // Идёт пауза
        state.pauseTimer -= dt;
        if (state.pauseTimer <= 0) {
          state.wavePause = false;
          state.wave++;
          state.waveTimer = 0;
          state.spawnTimer = 1200; // небольшая задержка перед первым спавном
          waveIndicatorEl.textContent = `Волна ${state.wave}/${TOTAL_WAVES}`;
          waveOverlayEl.classList.add('hidden');
        }
      }
```

---

## Task 4: Kill counter + victoryGame + startGame + wiring

**Files:**
- Modify: `index.html`

- [ ] **Шаг 4.1: Инкремент killCount при попадании** — в функции `handleTap`, найти строки ~914–915:

**БЫЛО:**
```javascript
        state.score++;
        scoreEl.textContent = state.score;
```

**СТАЛО:**
```javascript
        state.score++;
        state.killCount++;
        scoreEl.textContent = state.score;
        killEl.textContent = state.killCount;
```

- [ ] **Шаг 4.2: Добавить функцию victoryGame** — вставить после функции `endGame` (после строки ~1189):

```javascript
  function victoryGame() {
    state.running = false;
    const rank = getTitle(state.killCount);
    victoryRankEl.textContent = rank;
    victoryStatsEl.textContent = `Счёт: ${state.score}  ·  Чаек сбито: ${state.killCount}`;
    setTimeout(() => {
      hud.classList.add('hidden');
      styleBtn.classList.add('hidden');
      waveOverlayEl.classList.add('hidden');
      victoryScreenEl.classList.remove('hidden');
    }, 600);
  }
```

- [ ] **Шаг 4.3: Обновить startGame** — заменить строки ~1152–1170:

```javascript
  function startGame() {
    state.running = true;
    state.score = 0; state.lives = 3;
    state.gulls = []; state.feathers = []; state.crumbs = [];
    state.timeAlive = 0;
    state.spawnTimer = 1500;
    state.spawnInterval = 2200;
    state.shake = 0; state.flash = 0; state.biteProgress = 0;
    // Wave system reset
    state.wave = 1;
    state.waveTimer = 0;
    state.wavePause = false;
    state.pauseTimer = 0;
    state.killCount = 0;
    resetPerched();
    boyHeadState = { startle: 0, nod: 0 };
    sandwichCache.lives = -1;
    scoreEl.textContent = '0';
    killEl.textContent = '0';
    waveIndicatorEl.textContent = `Волна 1/${TOTAL_WAVES}`;
    styleNumEl.textContent = state.sandwichStyle;
    updateLivesUI();
    hud.classList.remove('hidden');
    styleBtn.classList.remove('hidden');
    waveOverlayEl.classList.add('hidden');
    victoryScreenEl.classList.add('hidden');
    startScreen.classList.add('hidden');
    endScreen.classList.add('hidden');
  }
```

- [ ] **Шаг 4.4: Добавить обработчик victoryBtn** — найти строку ~1195 (`document.getElementById('restartBtn')...`) и добавить после:

```javascript
  document.getElementById('victoryBtn').addEventListener('click', () => startGame());
```

- [ ] **Шаг 4.5: Коммит**

```bash
git add index.html
git commit -m "feat: add 5-wave system, kill counter, inter-wave pause, victory screen with rank"
```

---

## Task 5: Визуальная проверка

**Files:** нет изменений

- [ ] **Шаг 5.1: Запустить сервер**

```bash
python3 -m http.server 8000
# открыть http://localhost:8000
```

- [ ] **Шаг 5.2: Проверить HUD**
  - Виден «Счёт: 0 🐦 0» слева
  - Виден «Волна 1/5» по центру
  - Жизни справа

- [ ] **Шаг 5.3: Проверить смену волн**
  - Временно изменить `WAVE_DURATION = 5000` в коде (5 секунд вместо 30)
  - Запустить игру, убедиться что через 5 секунд появляется overlay с репликой
  - Через 3 секунды overlay скрывается, HUD показывает «Волна 2/5»
  - И так до волны 5

- [ ] **Шаг 5.4: Проверить счётчик убийств**
  - Тапать по чайкам — `🐦 N` увеличивается

- [ ] **Шаг 5.5: Проверить победу**
  - Дойти до конца волны 5 — появляется экран победы со званием
  - «Ещё раз!» — сбрасывает всё, возвращает на старт

- [ ] **Шаг 5.6: Проверить game over**
  - Намеренно потерять все жизни — должен появиться старый endScreen (не victoryScreen)

- [ ] **Шаг 5.7: Вернуть** `WAVE_DURATION = 30000`

- [ ] **Шаг 5.8: Финальный коммит**

```bash
git add index.html
git commit -m "chore: restore WAVE_DURATION=30000 after testing"
git push origin main
```

---

## Self-Review

**Spec coverage:**
- [x] 5 волн по 30 с — Task 3 (WAVE_DURATION=30000, TOTAL_WAVES=5)
- [x] Пауза 3 с с репликой — Task 3 (PAUSE_DURATION=3000, WAVE_MESSAGES)
- [x] Мальчик делает nod при паузе — Task 3 (`triggerBoyNod()`)
- [x] Счётчик убитых чаек в HUD — Task 1 (killVal span) + Task 4 (инкремент)
- [x] Номер волны в HUD — Task 1 (waveIndicator) + Task 3 (обновление)
- [x] Экран победы — Task 4 (victoryGame, victoryScreen HTML в Task 1)
- [x] Звания по количеству kills — Task 2 (getTitle) + Task 4 (victoryGame)
- [x] Кнопка «Ещё раз» — Task 4 (victoryBtn listener)
- [x] Сброс всех полей при startGame — Task 4
- [x] Работает на мобиле — CSS использует clamp() как и остальная игра

**Placeholder scan:** нет TBD, нет TODO, весь код конкретный.

**Type consistency:** `state.killCount` → `killEl.textContent` → `getTitle(state.killCount)` — всё согласовано. `WAVE_MESSAGES[state.wave]` — индексы 0..4 соответствуют волнам 1..5 (сообщение для волны N+1 берётся по индексу N текущей волны).
