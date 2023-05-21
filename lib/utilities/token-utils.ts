import type { TokenCollection, User, TokenType } from "./types";
import { memoryStore } from "../stores";

const getTokenPayload = (token: string): any => {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch (e) {
    return null;
  }
};

const commitUserToMemoryFromToken = (idToken: string): void => {
  const idTokenPayload = getTokenPayload(idToken);
  memoryStore.setItem(
    "user",
    JSON.stringify({
      family_name: idTokenPayload.family_name,
      given_name: idTokenPayload.given_name,
      picture: idTokenPayload.picture,
      email: idTokenPayload.email,
      id: idTokenPayload.sub,
    })
  );
};

export const commitTokenToMemory = (token: string, type: TokenType): void => {
  const tokenPayload = getTokenPayload(token);
  memoryStore.setItem(type, token);
  if (type === "access_token") {
    memoryStore.setItem("access_token_payload", tokenPayload);
  } else if (type === "id_token") {
    memoryStore.setItem("id_token_payload", tokenPayload);
    commitUserToMemoryFromToken(token);
  }
};

export const commitTokensToMemory = (tokens: TokenCollection): void => {
  commitTokenToMemory(tokens.refresh_token, "refresh_token");
  commitTokenToMemory(tokens.access_token, "access_token");
  commitTokenToMemory(tokens.id_token, "id_token");
};

export const getRefreshToken = (): string | null => {
  return memoryStore.getItem("refresh_token") as string | null;
};

export const getAccessToken = (): string | null => {
  return memoryStore.getItem("access_token") as string | null;
};

export const getUserFromMemory = (): any => {
  return memoryStore.getItem("user") as User | null;
};

export const commitUserToMemory = (user: User) => {
  memoryStore.setItem("user", user);
};

export const isTokenExpired = (token: string | null): boolean => {
  if (token === null) return true;
  const currentUnixTime = Math.floor(Date.now() / 1000);
  const tokenPayload = getTokenPayload(token);
  return currentUnixTime >= tokenPayload.exp;
};
