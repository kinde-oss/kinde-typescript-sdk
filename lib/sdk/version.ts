/**
 * This file is read-only, the const SDK_VERSION will be set to the package version
 * from package.json at build time, this action may or may not effect any changes
 * you make to this file. We therefore recommend that you refrain from editing this
 * file.
 */

import { type SDKHeaderOverrideOptions } from './oauth2-flows';

export const SDK_VERSION = 'SDK_VERSION_PLACEHOLDER' as const;

export const getSDKHeader = (
  options: SDKHeaderOverrideOptions = {}
): [string, string] => {
  const version = options.frameworkVersion ?? SDK_VERSION;
  const framework = options.framework ?? 'TypeScript';
  const headerValue = `${framework}/${version}`;
  return ['Kinde-SDK', headerValue];
};
