# Mobile Device Simulator CLI

Interactive TypeScript CLI for launching iOS simulators and Android emulators from one terminal menu.

## Features

- Launch available iOS simulators via `xcrun simctl`
- Launch available Android AVDs via `emulator -list-avds`
- View active iOS and Android devices in one screen
- Keyboard-first navigation (arrow keys, enter, filter mode)
- Pre-push safety check with `lefthook` running `npm test`

## Requirements

- Node.js 18+
- macOS (for iOS simulator commands)
- Xcode command line tools (`xcrun`)
- Android SDK tools available in PATH (`emulator`, `adb`)

## Installation

```bash
npm install
```

The `prepare` script installs git hooks automatically via Lefthook.

## Usage

Run in development mode:

```bash
npm run dev
```

Build and run compiled output:

```bash
npm run build
npm start
```

## Controls

- `Up` / `Down`: move selection
- `Enter`: confirm action
- `f`: toggle filter mode (iOS/Android list screens)
- `Backspace`: clear filter char (in filter mode) or go back
- `Esc`: exit filter mode or return to main menu
- `q` or `Ctrl+C`: exit

## Testing

```bash
npm test
```

Current test suite covers:

- State filtering and selection normalization
- iOS/Android parsing helpers
- Active-device fallback behavior

## Git Hooks

This project uses Lefthook.

- `pre-push` runs `npm test`

Run manually:

```bash
npx lefthook run pre-push
```

## Project Structure

```text
src/
  index.ts              # CLI bootstrap
  actions.ts            # input handling and high-level flows
  render.ts             # terminal rendering
  state.ts              # app state and selectors
  constants.ts          # menu items, icons, paint helper
  command-runner.ts     # shell command wrapper
  devices/
    ios.ts              # iOS list/launch logic
    android.ts          # Android list/launch logic
    active.ts           # active device aggregation
```
