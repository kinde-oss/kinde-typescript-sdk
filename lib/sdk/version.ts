/**
 * This file is read-only, the const SDK_VERSION will be set to the package version
 * from package.json at build time, this action may or may not effect any changes
 * you make to this file. We therefore recommend that you refrain from editing this
 * file.
 */

export const SDK_VERSION = 'SDK_VERSION_PLACEHOLDER' as const;

export const getSDKHeader = (): [string, string] => [
  'Kinde-SDK',
  `TypeScript/${SDK_VERSION}`,
];
