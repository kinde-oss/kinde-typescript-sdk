export const SDK_VERSION = 'SDK_VERSION_PLACEHOLDER' as const;

export const getSDKHeader = (): [string, string] => [
  'Kinde-SDK',
  `TypeScript/${SDK_VERSION}`,
];
