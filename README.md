# Mobile Device Simulator CLI

Interactive TypeScript CLI for launching iOS simulators and Android emulators from one terminal menu.

[![Node.js >= 18](https://img.shields.io/badge/node-%3E%3D18-339933.svg)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

## Features

- Launch available iOS simulators via `xcrun simctl`
- Launch available Android AVDs via `emulator -list-avds`
- View active iOS and Android devices on the main screen
- Keyboard-first navigation (arrow keys, enter, filter mode)
- Pre-push safety check with `lefthook` running `npm test`

## Requirements

- Node.js 18+
- macOS (for iOS simulator commands)
- Xcode command line tools (`xcrun`)
- Android SDK tools available in PATH (`emulator`, `adb`)

## Installation

Install dependencies for local development:

```bash
npm install
```

Use `npm run setup:hooks` to install local git hooks for contributors.

Install globally as a CLI (after publish):

```bash
npm install -g mobile-device-simulator-cli
```

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

Run as installed CLI:

```bash
mobile-device-simulator
```

Run without global install:

```bash
npx mobile-device-simulator-cli
```

## Controls

- `Up` / `Down`: move selection
- `Enter`: confirm action
- `f`: toggle filter mode (iOS/Android list screens)
- `k`: kill selected active iOS simulator or Android emulator
- `Backspace`: clear filter char (in filter mode) or go back
- `Esc`: exit filter mode or return to main menu
- `Ctrl+C`: exit

## Testing

```bash
npm test
```

Run full local quality checks:

```bash
npm run check
```

Current test suite covers:

- State filtering and selection normalization
- iOS/Android parsing helpers
- Active-device fallback behavior

## Git Hooks

This project uses Lefthook.

- `pre-push` runs `npm test`

Install hooks for local development:

```bash
npm run setup:hooks
npx lefthook run pre-push
```

## Troubleshooting

- `Unable to read iOS simulator state`: ensure `xcrun` is installed (`xcode-select --install`)
- `Unable to read Android device state`: ensure `adb` and `emulator` are in `PATH`
- No devices listed: verify at least one iOS simulator or Android AVD exists

## Release Checklist

Before publishing a new version:

```bash
npm ci
npm run check
npm run build
npm pack --dry-run
npm publish --dry-run
```

Verify dry-run output includes only expected files (`dist`, `README.md`, `LICENSE`) and no local secrets.

Smoke-test the packaged artifact locally before publishing:

```bash
PACKAGE_FILE=$(npm pack --silent)
npm install -g "./$PACKAGE_FILE"
mobile-device-simulator --help || true
npm uninstall -g mobile-device-simulator-cli
rm "$PACKAGE_FILE"
```

## Data Storage

- Recent device history is stored locally at `~/.mobile-device-simulator-history.json`
- No credentials are collected or transmitted by this CLI

## Security

Please report vulnerabilities privately. See `SECURITY.md` for policy and reporting instructions.

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
