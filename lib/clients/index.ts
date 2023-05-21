import { GrantType, type ClientOptions } from "../oauth2-flows";
import createPKCEClient from "./authcode-with-pkce";
import createCCClient from "./client-credentials";

const createKindeClient = (options: ClientOptions) => {
  if (options.grantType === GrantType.CLIENT_CREDENTIALS) {
    return createCCClient(options);
  } else if (options.grantType === GrantType.PKCE) {
    return createPKCEClient(options);
  }
};

export default createKindeClient;
