import { type default as createPKCEClient } from "./authcode-with-pkce";
import { type default as createCCClient } from "./client-credentials";

export type PKCEClient = ReturnType<typeof createPKCEClient>;
export type CCClient = ReturnType<typeof createCCClient>;
