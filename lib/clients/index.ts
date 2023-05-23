import type { PKCEClientOptions, CCClientOptions } from "../oauth2-flows/types";
import { type CCClient, type PKCEClient } from "./types";
import createPKCEClient from "./authcode-with-pkce";
import createCCClient from "./client-credentials";
import { GrantType } from "../oauth2-flows";

export const createKindeClient = <
  C extends PKCEClient | CCClient,
  O extends PKCEClientOptions | CCClientOptions
>(
  grantType: GrantType,
  options: O
) => {
  switch (grantType) {
    case GrantType.PKCE: {
      const clientOptions = options as PKCEClientOptions;
      return createPKCEClient(clientOptions) as C;
    }
    case GrantType.CLIENT_CREDENTIALS: {
      const clientOptions = options as CCClientOptions;
      return createCCClient(clientOptions) as C;
    }
    default: {
      throw new Error("Unrecognized grant type provided");
    }
  }
};

export * from "./types";
