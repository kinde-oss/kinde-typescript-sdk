import type { TokenCollection, UserType, TokenType } from './types';
import { type SessionManager } from '../session-managers';

const getTokenPayload = (token: string): any => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

const commitUserToMemoryFromToken = (
  sessionManager: SessionManager,
  idToken: string
): void => {
  const idTokenPayload = getTokenPayload(idToken);
  const user: UserType = {
    family_name: idTokenPayload.family_name,
    given_name: idTokenPayload.given_name,
    picture: idTokenPayload.picture ?? null,
    email: idTokenPayload.email,
    id: idTokenPayload.sub,
  };

  sessionManager.setSessionItem('user', JSON.stringify(user));
};

export const commitTokenToMemory = (
  sessionManager: SessionManager,
  token: string,
  type: TokenType
): void => {
  const tokenPayload = getTokenPayload(token);
  sessionManager.setSessionItem(type, token);
  if (type === 'access_token') {
    sessionManager.setSessionItem('access_token_payload', tokenPayload);
  } else if (type === 'id_token') {
    sessionManager.setSessionItem('id_token_payload', tokenPayload);
    commitUserToMemoryFromToken(sessionManager, token);
  }
};

export const commitTokensToMemory = (
  sessionManager: SessionManager,
  tokens: TokenCollection
): void => {
  commitTokenToMemory(sessionManager, tokens.refresh_token, 'refresh_token');
  commitTokenToMemory(sessionManager, tokens.access_token, 'access_token');
  commitTokenToMemory(sessionManager, tokens.id_token, 'id_token');
};

export const getRefreshToken = (
  sessionManager: SessionManager
): string | null => {
  return sessionManager.getSessionItem('refresh_token') as string | null;
};

export const getAccessToken = (
  sessionManager: SessionManager
): string | null => {
  return sessionManager.getSessionItem('access_token') as string | null;
};

export const getUserFromMemory = (
  sessionManager: SessionManager
): UserType | null => {
  return sessionManager.getSessionItem('user') as UserType | null;
};

export const commitUserToMemory = (
  sessionManager: SessionManager,
  user: UserType
) => {
  sessionManager.setSessionItem('user', user);
};

export const isTokenExpired = (token: string | null): boolean => {
  if (token === null) return true;
  const currentUnixTime = Math.floor(Date.now() / 1000);
  const tokenPayload = getTokenPayload(token);
  return currentUnixTime >= tokenPayload.exp;
};
