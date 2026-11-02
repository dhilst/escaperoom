# PS1 Escape Room

A small browser escape room in the style of late-90s PlayStation survival horror.
You play by typing commands. There's no movement and no clicking. *The Hollow
House* has three rooms, played as levels: **The Locked Study**, **The Flooded
Cellar** and **The Observatory**. Each room has two fixed camera shots, and
`turn` switches between them.

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
(reachable with Tab) restarts the current level. After you win, it starts a
new game from level 1. Items are picked up automatically, and each level
starts with an empty inventory.
The game never lists objects for you, so work out what's there from the
picture and the descriptions.

<details>
<summary>Solutions (spoilers)</summary>

```text
# The Locked Study
inspect clock         -> hands stopped at 03:15
use 0315 drawer       -> brass key
turn
use key door          -> down to the cellar

# The Flooded Cellar
open toolbox          -> crowbar
turn
use crowbar crate     -> fuse
turn
use fuse fuse box     -> the lights come on
turn
inspect wall          -> 7 4 1 9
use 7419 door         -> up to the observatory

# The Observatory
inspect star chart    -> "She only sings when wound."
open birdcage         -> winding crank
turn
use crank music box   -> glass lens
turn
use lens telescope
inspect telescope     -> 2, 6, 1, 8
turn
use 2618 hatch        -> escape
```
</details>

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
  ui/
    renderer.ts     the only module that touches the DOM
    style.css
  content.ts        bundles rooms/game.json and every rooms/*/room.json
  main.ts           wires the game, engine and renderer together
rooms/
  game.json         title and level order
  <id>/             room.json + camera_a.png + camera_c.png
tests/              parser, engine, per-room and full-game tests
tools/render_rooms.py  generates the placeholder camera images
```

### Engine contract

```ts
const game = loadGame();                                      // validated GameDefinition
let state = createGameState(game);                            // first room in game.json
const parsed = parse("use key door", buildAliasMap(game.rooms[state.roomId]));
if (parsed.ok) ({ state, events } = stepGame(state, parsed.command, game)); // pure
```

`step(state, command, room)` is the same thing for a single room. `stepGame`
calls it and, when a `change_room` effect fires, moves the player into the next
room with `enterRoom()`. This resets the camera to A, empties the inventory and
loads the new room's `initialFlags`.

`events` are semantic (`message`, `camera_changed`, `item_added`,
`item_removed`, `inventory`, `flag_set`, `room_changed`, `room_entered`,
`game_completed`, `failure`). Every event that the player should see has a
`text`.

A `failure` event always shows the player `Nothing special.` (for inspect) or
`Nothing happens.` (for everything else). Its `reason` field is for debugging
and tests only: `unknown_object`, `not_visible`, `item_not_held`,
`no_interaction` or `conditions_unmet`. Malformed input never reaches the
engine. The parser rejects it with a short usage message instead.

## Making a new room

1. Create `rooms/<id>/` containing `room.json` and two images, one per camera.
   Any PNG, WebP or JPG works. 320×240 suits the look, because the UI scales
   it up with nearest-neighbour filtering.
2. Add the id to `rooms` in `rooms/game.json`, in the position where the level
   should appear.
3. Link it in. The previous room needs an interaction with a
   `{ "type": "change_room", "room": "<id>" }` effect. The last room ends the
   game with `complete_game`.

No code changes are needed. Room files and images are bundled automatically.

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
  item is already held), `remove_item {item}` (for items used up),
  `display_message {text}`, `complete_game`, `change_room {room}` (next level).
  When a rule uses an item up and also hands out a reward, guard the rule with
  a flag. Otherwise repeating the action could give the reward again.
- Each object or item can be reached by its id, its id with spaces in place of
  underscores, its `name`, and its `aliases`. These are case-insensitive and
  must be unique across the whole room.

`validateRoom()` checks the structure and every reference: unknown objects,
items, verbs, condition or effect types, and names used twice. `validateGame()`
runs that on every room and also checks the manifest and that every
`change_room` points at a listed room. All problems are reported together in
one `RoomValidationError`.

### Placeholder art

`python3 tools/render_rooms.py [room ...]` (requires Pillow) regenerates the
room images. It's a tiny flat-shaded software renderer that adds distance fog,
a vignette and 15-bit colour with ordered dithering. Replacing the PNGs with
real art doesn't require any code changes.
