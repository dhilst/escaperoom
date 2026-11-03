# PS1 Escape Room

A small browser escape room in the style of late-90s PlayStation survival horror.
You play by typing commands. There's no movement and no clicking. *The Hollow
House* has twenty rooms, played as levels: the Locked Study, the Flooded
Cellar, the Observatory, the Rooftop Greenhouse, the Nursery, the Library, the
Chapel, the Clock Tower, the Kitchen, the Laundry, the Dining Hall, the Music
Room, the Billiard Room, the Portrait Gallery, the Trophy Room, the Master
Bedroom, the Bathroom, the Darkroom, the Attic and the Grand Foyer. Each room has two
fixed camera shots, and `turn` switches between them.

The game logic is a pure, deterministic engine driven by JSON room data. The
browser UI only draws what the engine returns, so the engine can be reused by
something else later, such as a livestream chat-voting frontend.

## Run

```sh
npm install
npm run dev        # open the printed URL (default http://localhost:5173)
```

Other scripts:

```sh
npm test           # run the Vitest suite once
npm run typecheck  # tsc --noEmit
npm run build      # typecheck and build a static site into dist/
```

## Publish

The game is a static site, published with GitHub Pages at
**https://dhilst.github.io/escaperoom/**.

Publishing is automatic. On every push to `main`, the GitHub Actions workflow
in `.github/workflows/publish.yml` runs the tests and the build and, if both
pass, publishes `dist/` to the `gh-pages` branch, which Pages serves. Pull
requests only run the tests and the build. To publish by hand from a local
checkout:

```sh
npm run deploy     # build, then force-push dist/ as the gh-pages branch
```

The `gh-pages` branch contains only the build output, and each deploy
replaces it with a single commit. The build uses relative asset paths, so it
works under any URL path.

## Languages

The game is available in US English (the default), Brazilian Portuguese and
Spanish. Choose one with the `lang` query parameter:

```text
http://localhost:5173/              English (US)
http://localhost:5173/?lang=pt-BR   Português (Brasil)
http://localhost:5173/?lang=es      Español
```

The value is forgiving: `pt_BR`, `pt-br` and `pt` all select Portuguese, and
`es-MX` selects Spanish. A missing or unknown value falls back to English. Room
text, interface labels, engine messages and the commands themselves all change
with the language.

## How to play

You play by saying phrases: words in a fixed order. The more you know, the
longer your phrases get.

| You type | Effect |
| --- | --- |
| a name: `clock` | Look at something in view, or at something you carry |
| an item and a target: `key door` | Use what you carry on what you see |
| a code and a target: `0315 drawer` | Enter a code |
| `open` and a name: `open toolbox` | Open something |
| `look` · `turn` · `inventory` | Describe the view · switch camera · list what you carry |

In Portuguese the global words are `olhar`, `virar`, `abrir` and
`inventário`, and in Spanish `mirar`, `girar`, `abrir` and `inventario`.
Objects and items go by their names in the player's language (`chave porta`,
`llave puerta`). Rooms can add their own verbs too.

Responses appear as subtitles over the bottom of the camera view, typed out
like the old Resident Evil games, at 200 words per minute by default. Long
texts scroll on their own so the newest words stay in view. Each one stays
for 10 seconds after it finishes typing (the `help` text for 15), and a new
command replaces it immediately.

The typing speed can be changed with `?wpm=N` (words per minute, with the
usual 5 characters per word; any value from 10 to 5000), for example
`https://dhilst.github.io/escaperoom/?wpm=120`. Unlike the testing aids
below, this one works on the published site too. Screen readers
get the full text at once, and with reduced motion enabled the text appears
without the typing effect.

Every word counts, so filler words are not ignored: `key on the door` is a
different phrase from `key door`, and so is `door key`. Case, accents and
extra spaces don't matter, so `relogio` matches `relógio`. Press Enter to
submit, and use Up/Down to recall earlier commands. Items are picked up
automatically, and each level starts with an empty inventory. The game never
lists objects for you, so work out what's there from the picture and the
descriptions.

Naming one thing is always safe. If it isn't in the room, the game says so
(`There is no such painting.`), and if it's only visible from the other
camera, you get `You don't see any door here.` A longer phrase either works
or gets `Nothing happens.`, whatever was wrong with it. A failed attempt never
reveals which of its words were right. Guessing a phrase of n words from a
room's vocabulary of V words therefore costs about V^n tries, not n·V, so
longer phrases protect the later puzzles.

The game uses this as a difficulty curve. Early rooms are solved with
two-word phrases. Later, a room's final unlock is a longer phrase built
from everything you learned there. The nursery's lock wants its pictures
pressed in the mural's order and then the code (five words). In the chapel,
the lit taper is carried to the three candles in the hymn's order (four words). The
front door wants its three keys in the order carved above it (four words).
Doing the parts one at a time doesn't work in those rooms.

### Saved progress

The game saves to the browser's `localStorage` after every command: the
room, camera, inventory, flags, revealed hints and the level's hint clock.
Reopening the page resumes where you left off, with "Your progress was
restored.", even in a different `?lang`.

The save also lists the levels you have finished, so new levels never cost
you progress (`resumeGame()` in `src/engine/save.ts`):

- A save that still fits the current rooms resumes exactly.
- A finished game is kept. If levels were added since, the next visit
  starts at the first one you haven't played. If not, it starts a new game.
- A save whose room changed shape restarts that room, not the whole game.
  One whose room was removed goes on at the first unfinished level.

To start over by hand, clear the site's data in the browser. In
development, `?room=N` always starts that level and doesn't save, so
testing never overwrites real progress.

### Hidden commands

`help` (`ajuda`, `ayuda`) lists the commands above, and the game suggests it
once, when it starts.

`hint` (`dica`, `pista`) is hidden: it appears neither in `help` nor in the
table above, and it reveals the next hint for the current room.

There is deliberately no restart command. In collective play, one player
restarting would wipe out everyone's progress. When the game is won, the
ending banner tells you to reload the page to play again.

**Hints.** Each room has up to 5 hints, ordered from vague to explicit, and
only the next one can be revealed. A hint about a step the player has already
solved is skipped, so every revealed hint is useful. Revealed hints stay on
screen for the rest of the level, in a box under the camera view that appears
with the first hint. The newest hint is shown in full, older ones are shortened
to one line, and a `HINT n/5` counter heads the box. The layout always reserves
room for a full box, so the camera view never changes size during play. Hints
reset when you enter a new room.

Hints also unlock over time, counted from the moment you enter the level: the
1st after 10 minutes, the 2nd after 30, the 3rd after 1h30, the 4th after 3h
and the 5th after 6h. Asking earlier shows `Next hint available in HH:MM:SS`,
and the seconds tick down while the subtitle is on screen. The schedule is `HINT_UNLOCK_MS` in
`src/engine/types.ts`.

Testing aids, which only work on the dev server (`npm run dev`). Production
builds ignore them, and the published site contains none of their code:

- `?hintTimer=off` unlocks every hint immediately.
- `?room=N` starts at level N (1-based). A room id such as `?room=cellar`
  works too.

They can be combined, for example
`http://localhost:5173/?room=5&hintTimer=off&lang=pt-BR`.

**Solutions (spoilers):** each room's solution is in `rooms/<id>/solution.json`,
in every language. The tests play them, both room by room and chained
through the whole game.

## Layout

```text
src/
  engine/           no DOM access; all of it runs under Node
    types.ts        Command, GameState, RoomDefinition, GameEvent
    parser.ts       text -> Command (with alias resolution)
    state.ts        createInitialState() and the pure single-room step()
    game.ts         stepGame(): step() across rooms, handling level changes
    rules.ts        condition checks and effect application
    validate.ts     load-time validation of rooms and the game manifest
    index.ts        public exports
  i18n/
    index.ts        locale list, ?lang= resolution, localize() for room data
    language.ts     the Language type: parser words, engine messages, UI labels
    locales/        en-US.ts, pt-BR.ts, es.ts
  ui/
    renderer.ts     the only module that touches the DOM
    subtitles.ts    typed, timed subtitles for responses
    style.css
  content.ts        bundles the rooms and resolves them for one locale
  persistence.ts    saves and loads progress in localStorage
  main.ts           wires the game, engine and renderer together
rooms/
  game.json         title and level order
  <id>/             room.json, solution.json, camera_a.png, camera_c.png
tests/              parser, engine, per-room, full-game and i18n tests
tools/render_rooms.py  generates the camera images
tools/rooms/<id>.py    per-room art for the renderer (rooms 4-10)
```

### Engine contract

```ts
const lang = LANGUAGES["pt-BR"];
const game = loadGame("pt-BR");                     // validated, text already in Portuguese
let state = createGameState(game);                  // first room in game.json
const vocabulary = buildVocabulary(game.rooms[state.roomId], lang.parser);
const parsed = parse("chave porta", vocabulary, lang.parser); // { words: ["brass_key", "door"], typed }
if (parsed.ok) ({ state, events } = stepGame(state, parsed.command, game, lang.engine)); // pure
```

The language arguments are optional and default to English. The engine itself
has no idea which language is in use: rooms are translated before validation,
and commands and `GameState` contain only ids, flags and codes. As a result,
the same game played in different languages produces identical states.

`step(state, command, room)` is the same thing for a single room. `stepGame`
calls it and, when a `change_room` effect fires, moves the player into the next
room with `enterRoom()`. This resets the camera to A, empties the inventory and
loads the new room's `initialFlags`.

`events` are semantic (`message`, `camera_changed`, `item_added`,
`item_removed`, `inventory`, `flag_set`, `room_changed`, `room_entered`,
`game_completed`, `hint_revealed`, `hint_locked`, `failure`). Every event that
the player should see has a `text`. `GameState.hints` lists the indices of the
current room's revealed hints in reveal order.

Time enters the engine only as an argument: `stepGame(..., now)` and
`createGameState(game, now)` take the host clock in milliseconds, and
`GameState.levelStartedAt` records when the level began. Hint unlocking is
the only thing that depends on it. Given the same states, commands and `now`
values, the results are always identical, so tests can simulate any moment.
A `hint_locked` event carries `availableAt`, which the UI uses to tick the
countdown.

A `failure` event has a `reason`, and its text depends on that reason:

| reason | player sees |
| --- | --- |
| `unknown_object` | `There is no such <what they typed>.` |
| `not_visible` (other camera, or an item not carried) | `You don't see any <what they typed> here.` |
| `item_not_held`, `no_interaction`, `conditions_unmet` | `Nothing special.` for a single name, `Nothing happens.` otherwise |

The two explicit messages are only given for a single word. Any phrase of two
or more words that fails gets `Nothing happens.`, so failures never reveal
partial correctness. A command is `{ words, typed }`: `words` holds ids, plus
literal text for anything the room doesn't know, such as codes. `typed` holds
the player's own wording of each word, so the explicit messages can echo it
back. Only empty input is a parser error. The messages above are the English
versions; each language pack has its own.

## Making a new room

1. Create `rooms/<id>/` containing `room.json` and two images, one per camera.
   Any PNG, WebP or JPG works. 320×240 suits the look, because the UI scales
   it up with nearest-neighbour filtering.
2. Add the id to `rooms` in `rooms/game.json`, in the position where the level
   should appear.
3. Link it in. The previous room needs an interaction with a
   `{ "type": "change_room", "room": "<id>" }` effect. The last room ends the
   game with `complete_game`.
4. Add `rooms/<id>/solution.json` with the commands that solve the room in
   every language. `tests/rooms.test.ts` then checks the room automatically:
   the solution must work in each language with no failing step, and the room
   must not be finishable by naming things and opening them.
5. For art, add `tools/rooms/<id>.py` (see `load_room_modules` in
   `tools/render_rooms.py`) and run `python3 tools/render_rooms.py <id>`.

No code changes are needed. Room files and images are bundled automatically.

`room.json` has this structure:

```jsonc
{
  "id": "study",                       // must match the folder name
  "title": { "en-US": "The Locked Study", "pt-BR": "O Escritório Trancado", "es": "El Estudio Cerrado" },
  "cameras": {
    "A": { "image": "camera_a.png", "description": { "en-US": "Text shown by look.", "pt-BR": "...", "es": "..." } },
    "C": { "image": "camera_c.png", "description": { "en-US": "...", "pt-BR": "...", "es": "..." } }
  },
  "objects": {                         // things in the room
    "clock": {
      "name": { "en-US": "clock", "pt-BR": "relógio", "es": "reloj" },
      "aliases": { "en-US": ["wall clock"], "pt-BR": ["relógio de parede"], "es": ["reloj de pared"] },
      "cameras": ["A"]
    }
  },
  "items": {                           // things that can be carried
    "brass_key": {
      "name": { "en-US": "Brass key", "pt-BR": "Chave de latão", "es": "Llave de latón" },
      "aliases": { "en-US": ["key"], "pt-BR": ["chave"], "es": ["llave"] },
      "description": { "en-US": "Shown when named while carried.", "pt-BR": "...", "es": "..." }
    }
  },
  "initialFlags": { "drawer_open": false },
  "interactions": [
    {
      "say": ["0315", "drawer"],       // the exact phrase: ids and literals, in order
      "conditions": [{ "type": "flag_equals", "flag": "drawer_open", "value": false }],
      "effects": [
        { "type": "set_flag", "flag": "drawer_open", "value": true },
        { "type": "display_message", "text": { "en-US": "The drawer opens.", "pt-BR": "A gaveta se abre.", "es": "El cajón se abre." } },
        { "type": "add_item", "item": "brass_key" }
      ]
    }
  ],
  "hints": [                           // optional, at most 5, vague -> explicit
    {
      "text": { "en-US": "Time seems to have stopped here.", "pt-BR": "...", "es": "..." },
      "skipIf": [{ "type": "flag_equals", "flag": "drawer_open", "value": true }]  // optional
    }
  ]
}
```

Rules:

- Each rule's `say` is a phrase of words. Each word is an id (a global word
  such as `open`, or one of the room's objects, items or `verbs`), or a
  literal such as a code. Examples: `["clock"]` looks at the clock,
  `["open", "drawer"]` opens it, `["brass_key", "door"]` uses the key on the
  door, and `["dawn", "blood", "night", "altar"]` uses room verbs.
- The last word of a phrase is its target. It must be visible from the current
  camera (objects list their `cameras`) or be a carried item, and every item
  word in the phrase must be carried. A single item word with no rule shows
  the item's `description`.
- `verbs` defines room-specific words: `{ "pray": { "name": {...}, "aliases": {...} } }`.
- `interactions` are checked in order. The first one whose phrase matches
  exactly and whose `conditions` all pass is applied. To give an object a
  different response depending on state, list the conditional rule first and
  the fallback after it.
- Conditions: `flag_equals {flag, value}`, `has_item {item}`.
- A camera can have `variants`, written as `[{ "when": [conditions], "description": ... }]`.
  The first variant whose conditions all hold replaces the camera's
  `description`, for `look`, `turn` and when entering the room. For example,
  the cellar mentions the red numbers once the lights are on.
- Lighting: `brightness` sets how bright the room's images are drawn
  (1 = as painted, default), and `lighting` rules (`[{ "when": [...], "brightness": 1.1 }]`)
  override it, with the first match winning. When brightness goes up within a
  room, the image flickers like a bulb sputtering on. When it goes down, it
  fades. The cellar uses `0.45` until `power_on` is set.
- `hints` is revealed in order. A hint is skipped when all of its `skipIf`
  conditions hold, meaning the step it helps with is already done.
- When an interaction reveals a code, also give the player a note item that
  records what they saw, such as `Clock: 03:15` or `Wall: 7 4 1 9`. Add it
  with `add_item` next to the message, so the code stays in the inventory and
  nobody has to remember it. Record the clue as seen, not the code to type.
- Hints exist to get a stuck player moving again, not to solve the puzzle for
  them. Point at where to look or what to think about, and get a little more
  specific with each step, but never give a code, a number or a ready-made
  command. A test rejects any hint that contains a digit or a phrase that
  solves one of the room's rules.
- Effects: `set_flag {flag, value}`, `add_item {item}` (does nothing if the
  item is already held), `remove_item {item}` (for items used up),
  `display_message {text}`, `complete_game`, `change_room {room}` (next level).
  When a rule uses an item up and also hands out a reward, guard the rule with
  a flag. Otherwise repeating the action could give the reward again.
- Each object, item or room verb can be reached by its id, its id with spaces
  in place of underscores, its `name`, and its `aliases` for the current
  language. Case and accents are ignored. In every language, each of these
  must mean exactly one thing in the room, global words included. Multi-word
  names are read longest first, so `fuse box` wins over `fuse`, and every
  rule's phrase must be typeable: writing its words by name must parse back
  to exactly that phrase. Validation checks both.
- Player-facing text (`title`, `description`, `name`, `text`, `aliases`) is an
  object with one entry per locale. Ids, flags, codes and image paths are
  never translated. Loading fails and names any text that is missing a
  translation, and a test checks that no player-facing text was left as a
  plain string.

### Adding a language

1. Copy `src/i18n/locales/en-US.ts` and translate it. It contains the global
   words (`look`, `turn`, `open`, `inventory`, `help`, `hint`; several
   spellings per word are allowed), the engine's built-in messages and the
   interface labels.
2. Register it in `LANGUAGES` in `src/i18n/index.ts`.
3. Add the new locale key to every localized entry in `rooms/game.json` and
   each `rooms/*/room.json`. Until you do, the game refuses to load and lists
   every missing translation.

`validateRoom()` checks the structure and every reference: unknown objects,
items, condition or effect types, words with two meanings and phrases that
can't be typed. `validateGame()`
runs that on every room and also checks the manifest and that every
`change_room` points at a listed room. All problems are reported together in
one `RoomValidationError`.

### Placeholder art

`python3 tools/render_rooms.py [room ...]` (requires Pillow) regenerates the
room images. It's a tiny flat-shaded software renderer that adds distance fog,
a vignette and 15-bit colour with ordered dithering. Replacing the PNGs with
real art doesn't require any code changes.
