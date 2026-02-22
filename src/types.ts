export type MainAction = "launch-ios-simulator" | "launch-android-emulator" | "active-devices" | "exit";

export type Screen = "main" | "ios" | "android" | "devices";

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
  activeDevices: ActiveDevices;
};
