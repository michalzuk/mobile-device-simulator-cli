# Changelog

All notable changes to this project are documented in this file.

The format is based on Keep a Changelog and this project follows Semantic Versioning.

## [Unreleased]

### Added

- Security policy in `SECURITY.md`
- Release checklist and troubleshooting guidance in `README.md`
- Packaging metadata hardening in `package.json` (`repository`, `bugs`, `homepage`, publish config, file whitelist)
- New quality scripts: `typecheck`, `lint`, and `check`

### Changed

- Added command execution guards in `src/command-runner.ts` (timeout and max buffer)
- Improved iOS and active-device JSON parsing error messages in `src/devices/ios.ts` and `src/devices/active.ts`
- Reduced repeated work in list partitioning logic in `src/state.ts`
