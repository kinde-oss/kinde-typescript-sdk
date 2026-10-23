import { generatePortalUrl } from '@kinde/js-utils';
import type { GeneratePortalUrlParams } from '@kinde/js-utils';
import { type SessionManager } from '../session-managers/index.js';
import { withJsUtilsStorage } from './session-storage-bridge.js';

export const createPortalUrl = async (
  sessionManager: SessionManager,
  options: GeneratePortalUrlParams
): Promise<{ url: URL }> => {
  const token = await sessionManager.getSessionItem('access_token');

  if (!token) {
    throw new Error('No active session found.');
  }

  return await withJsUtilsStorage(sessionManager, async () =>
    generatePortalUrl({
      domain: options.domain,
      returnUrl: options.returnUrl,
      subNav: options.subNav,
    })
  );
};
