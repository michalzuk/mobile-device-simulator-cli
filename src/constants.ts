import type { MainMenuItem } from "./types.js";

const colors = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  blue: "\x1b[34m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  magenta: "\x1b[35m"
} as const;

export const icons = {
  ios: "🍎",
  android: "🤖",
  menu: "⚙"
} as const;

export function paint(text: string, color: keyof typeof colors): string {
  return `${colors[color]}${text}${colors.reset}`;
}

export const mainMenuItems: MainMenuItem[] = [
  {
    label: "Launch iOS simulator",
    value: "launch-ios-simulator",
    description: "Select and boot an iOS simulator"
  },
  {
    label: "Launch android emulator",
    value: "launch-android-emulator",
    description: "Select and start an Android AVD"
  },
  {
    label: "Active devices",
    value: "active-devices",
    description: "Show booted simulators and connected devices"
  },
  {
    label: "Exit",
    value: "exit",
    description: "Close CLI"
  }
];
