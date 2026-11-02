# PS1 Escape Room

A small browser escape room in the style of late-90s PlayStation survival horror.
You play by typing commands. There's no movement and no clicking. Each room
has two fixed camera shots, and `turn` switches between them.

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

## How to play

| Command               | Effect                                 |
| --------------------- | -------------------------------------- |
| `look`                | Describe the current camera view       |
| `turn`                | Switch to the opposite camera          |
| `inspect <object>`    | Examine something                      |
| `open <object>`       | Try to open something                  |
| `use <item> <target>` | Use an item, or enter a code (`use 1234 safe`) |
| `inventory`           | List what you carry                    |

Commands are case-insensitive and ignore extra whitespace. Press Enter to
submit, and use Up/Down to recall earlier commands. The **Restart** button
(reachable with Tab) starts a new game. Items are picked up automatically.
The game never lists objects for you, so work out what's there from the
picture and the descriptions.

<details>
<summary>Solution to The Locked Study (spoilers)</summary>

```text
inspect clock      -> hands stopped at 03:15
use 0315 drawer    -> brass key
turn
use key door       -> escape
```
</details>

## Layout

```text
src/
  engine/           no DOM access; all of it runs under Node
    types.ts        Command, GameState, RoomDefinition, GameEvent
    parser.ts       text -> Command (with alias resolution)
    state.ts        createInitialState() and the pure step() function
    rules.ts        condition checks and effect application
    validate.ts     load-time room JSON validation
    index.ts        public exports
  ui/
    renderer.ts     the only module that touches the DOM
    style.css
  main.ts           wires the room, engine and renderer together
rooms/study/        room.json + camera_a.png + camera_c.png
tests/              parser, engine and full-playthrough tests
tools/render_study.py  generates the placeholder camera images
```

### Engine contract

```ts
const parsed = parse("use key door", buildAliasMap(room)); // { ok, command } | { ok: false, error }
const { state, events } = step(state, parsed.command, room); // never mutates its input
```

`events` are semantic (`message`, `camera_changed`, `item_added`, `inventory`,
`flag_set`, `room_changed`, `game_completed`, `failure`). Every event that the
player should see has a `text`.

A `failure` event always shows the player `Nothing special.` (for inspect) or
`Nothing happens.` (for everything else). Its `reason` field is for debugging
and tests only: `unknown_object`, `not_visible`, `item_not_held`,
`no_interaction` or `conditions_unmet`. Malformed input never reaches the
engine. The parser rejects it with a short usage message instead.

## Making a new room

1. Create `rooms/<id>/` containing `room.json` and two images, one per camera.
   Any PNG, WebP or JPG works. 320×240 suits the look, because the UI scales
   it up with nearest-neighbour filtering.
2. Import the JSON in `src/main.ts` and pass it to `start(validateRoom(...))`.
   Images under `rooms/*/` are bundled automatically.

`room.json` has this structure:

```jsonc
{
  "id": "study",                       // must match the folder name
  "title": "The Locked Study",
  "cameras": {
    "A": { "image": "camera_a.png", "description": "Text shown by look." },
    "C": { "image": "camera_c.png", "description": "..." }
  },
  "objects": {                         // things in the room
    "clock": { "name": "clock", "aliases": ["wall clock"], "cameras": ["A"] }
  },
  "items": {                           // things that can be carried
    "brass_key": { "name": "Brass key", "aliases": ["key"], "description": "Shown by inspect when held." }
  },
  "initialFlags": { "drawer_open": false },
  "interactions": [
    {
      "verb": "use",                   // inspect | open | use
      "item": "0315",                  // use only: an item id, or a literal code
      "object": "drawer",              // the object being inspected/opened/used on
      "conditions": [{ "type": "flag_equals", "flag": "drawer_open", "value": false }],
      "effects": [
        { "type": "set_flag", "flag": "drawer_open", "value": true },
        { "type": "display_message", "text": "The drawer opens." },
        { "type": "add_item", "item": "brass_key" }
      ]
    }
  ]
}
```

Rules:

- An object can only be used from the cameras listed in its `cameras` field.
  Items you carry can be inspected from either camera.
- `interactions` are checked in order. The first one whose verb and arguments
  match and whose `conditions` all pass is applied. To give an object a
  different response depending on state, list the conditional rule first and
  the fallback after it.
- When `use` names a real item, the player has to be holding it. Anything
  else in that position is compared literally, which is how codes work.
- Conditions: `flag_equals {flag, value}`, `has_item {item}`.
- Effects: `set_flag {flag, value}`, `add_item {item}` (does nothing if the
  item is already held), `display_message {text}`, `complete_game`,
  `change_room {room}` (sets `roomId` and resets to camera A; loading the next
  room is up to the host).
- Each object or item can be reached by its id, its id with spaces in place of
  underscores, its `name`, and its `aliases`. These are case-insensitive and
  must be unique across the whole room.

`validateRoom()` checks the structure and every reference: unknown objects,
items, verbs, condition or effect types, and names used twice. It reports all
problems together in one `RoomValidationError`.

### Placeholder art

`python3 tools/render_study.py` (requires Pillow) regenerates the study
images. It's a tiny flat-shaded software renderer that adds distance fog,
a vignette and 15-bit colour with ordered dithering. Replacing the PNGs with
real art doesn't require any code changes.
