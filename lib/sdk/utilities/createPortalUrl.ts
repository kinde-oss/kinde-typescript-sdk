import {
  generatePortalUrl,
  MemoryStorage,
  setActiveStorage,
  StorageKeys,
} from '@kinde/js-utils';
import type { GeneratePortalUrlParams } from '@kinde/js-utils';
import { type SessionManager } from '../session-managers/index.js';

export const createPortalUrl = async (
  sessionManager: SessionManager,
  options: GeneratePortalUrlParams
): Promise<{ url: URL }> => {
  const token = await sessionManager.getSessionItem('access_token'); // Ensure session is initialized

  if (!token) {
    throw new Error('No active session found.');
  }

  const storage = new MemoryStorage();
  await storage.setSessionItem(StorageKeys.accessToken, token);
  setActiveStorage(storage);

  return await generatePortalUrl({
    domain: options.domain,
    returnUrl: options.returnUrl,
    subNav: options.subNav,
  });
};
