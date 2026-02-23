export type MainAction = "launch-ios-simulator" | "launch-android-emulator" | "exit";

export type Screen = "main" | "ios" | "android";

export type MainMenuItem = {
  label: string;
  value: MainAction;
  description: string;
};

export type IosSimulator = {
  udid: string;
  name: string;
  state: string;
  runtime: string;
};

export type SimctlDevicesResponse = {
  devices: Record<
    string,
    Array<{
      udid: string;
      name: string;
      state: string;
    }>
  >;
};

export type ActiveDevices = {
  ios: string;
  android: string;
};

export type ConfirmKill = {
  platform: "ios" | "android";
  id: string;
  label: string;
  phase: "confirm" | "running";
};

export type AppState = {
  screen: Screen;
  mainIndex: number;
  iosIndex: number;
  androidIndex: number;
  iosFilterQuery: string;
  androidFilterQuery: string;
  filterActive: boolean;
  statusMessage: string;
  busy: boolean;
  iosSimulators: IosSimulator[];
  androidAvds: string[];
  bootedAndroidAvdNames: string[];
  recentIosUdids: string[];
  recentAndroidAvdNames: string[];
  activeDevices: ActiveDevices;
  activeIosBooted: IosSimulator[];
  activeAndroidDeviceLines: string[];
  confirmKill: ConfirmKill | null;
};
