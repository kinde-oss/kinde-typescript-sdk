# @kinde-oss/kinde-typescript-sdk 
The `@kinde-oss/kinde-typescript-sdk` allows developers to integrate [**Kinde**](https://kinde.com)
Authentication into there TypeScript projects. This SDK implements the following
OAuth2.0 flows.

- **Authorization Code**    
  Intended for confidentials clients for e.g. web-servers

- **Authorization Code with PKCE extension**  
  For public clients for e.g. single page web application and or mobile applications,
  and confidentials clients for e.g. web-servers.

- **Client Credentials Flow**   
  Intended for confidential clients, where machine to machine communication is 
  required.

## Installations and Requirements
This SDK has been written to be used with node version `18.x.x` or later in mind and 
can be installed using any appropriate package manager be it `npm`, `yarn` or 
`pnpm`.

```bash
npm install --save @kinde-oss/kinde-typescript
pnpm add --save @kinde-oss/kinde-typescript
yarn add @kinde-oss/kinde-typescript
```

## Kinde Registration and Setup
To get started you will need a Kinde domain, to do this you will first need to
[register for a Kinde account](http://app.kinde.com/register). Once completed you 
will need to create your app, to do so navigate to **settings** > **applications**,
and then navigate to **frontend app** or **backend app** which ever applies.

The remaining task is then to setup your callback URLs
- Allowed callback URLs  
  see the description provided for `KINDE_REDIRECT_URL` in the following section
  for an explanation on this.

- Allowed logout redirect URLs   
  see the description provided for `KINDE_LOGOUT_REDIRECT_URL` in the following 
  section for an explanation on this.

## Creating Kinde Clients
Please be mindful of providing the following environment variables whenever you
are instantiating a Kinde client. We first explicitly mention what each of these 
are before proceeding forward.

- `KINDE_AUTH_DOMAIN`  
This is the domain provided to you by kinde when you setup a new business, please 
observe that while Kinde comes with a production environment, you can create and 
setup multiple independent environments in which it is necessary to provide the 
environment subdomain when specifying this domain.

- `KINDE_CLIENT_ID`  
This is the client Id provided to you by kinde when you create your application
and is used by Kinde to identify your application.

- `KINDE_REDIRECT_URL`  
This is the route in your application that Kinde will redirect back to once the
end user has provided there credentials, this is exclusive to the `AUTHORIZATION_CODE`
and `PKCE` flows since we don't require this in the `CLIENT_CREDENTIALS` flow.

- `KINDE_LOGOUT_REDIRECT_URL`  
This is the route in your application that Kinde will redirect back to whenever
your application navigates to the logout url.

- `KINDE_CLIENT_SECRET`  
The client secret provided to you by Kinde when you setup your **backend** app,
please note that this is exclusive to the `AUTHORIZATION_CODE` and `CLIENT_CREDENTIALS` 
flows.

**Creating a Authorization Code Client**
```ts
import { 
  createKindeClient, 
  GrantType,
  type ACClientOptions,
  type ACClient, 
} from "@kinde-oss/kinde-typescript-sdk";

const clientOptions: ACClientOptions = {
  authDomain: process.env.KINDE_AUTH_DOMAIN,
  clientId: process.env.KINDE_CLIENT_ID,
  clientSecret: process.env.KINDE_CLIENT_SECRET,
  logoutRedirectURL: process.env.KINDE_LOGOUT_REDIRECT_URL,
  redirectURL: process.env.KINDE_REDIRECT_URL
};

const client = createKindeClient<ACClient, ACClientOptions>(
  GrantType.AUTHORIZATION_CODE, clientOptions
);
```

**Creating a PKCE Client**  
```ts
import { 
  createKindeClient, 
  GrantType,
  type PKCEClientOptions,
  type ACClient, 
} from "@kinde-oss/kinde-typescript-sdk";

const clientOptions: PKCEClientOptions = {
  authDomain: process.env.KINDE_AUTH_DOMAIN,
  clientId: process.env.KINDE_CLIENT_ID,
  logoutRedirectURL: process.env.KINDE_LOGOUT_REDIRECT_URL,
  redirectURL: process.env.KINDE_REDIRECT_URL
};

const client = createKindeClient<ACClient, PKCEClientOptions>(
  GrantType.PKCE, clientOptions
);
```

**Creating a Client Credentials Client**
```ts
import { 
  createKindeClient, 
  GrantType,
  type CCClientOptions,
  type CCClient, 
} from "@kinde-oss/kinde-typescript-sdk";

const clientOptions: CCClientOptions = {
  authDomain: process.env.KINDE_AUTH_DOMAIN,
  clientId: process.env.KINDE_CLIENT_ID,
  clientSecret: process.env.KINDE_CLIENT_SECRET,
  logoutRedirectURL: process.env.KINDE_LOGOUT_REDIRECT_URL
};

const client = createKindeClient<CCClient, CCClientOptions>(
  GrantType.CLIENT_CREDENTIALS, clientOptions
)
```

## Client Methods
Please note that depending on the provided grant type the created client will
expose different methods, however certain methods are common to all oauth2 flows,
which we have listed below, for details on what these methods are please refere 
to the detailed SDK reference provided below.

- `isAuthenticated()`
- `getToken()`
- `logout()`

In addition to the above both clients expose certain utility methods for handling 
token claims and feature flags we discuss them further below.

## Registration, Login and Logout
We present an example below of using a Kinde client for perfoming authentication. A 
backend scenario of using `AUTHORIZATION_CODE` or `PKCE` with the express framework 
may look something like the following.

```ts
import { client } from "./kinde-client";
import * as config from "./config";
import { Express } from "express";
import { join } from "path";

const app = express();

app.get("/callback", async (req, res) => {
  const callbackURL = new URL(join(config.appBaseURL, req.url));
  await client.handleRedirectToApp(callbackURL);
  res.redirect("/");
});

app.get("/register", async (req, res) => {
  const registrationURL = (await client.register()).toString();
  res.redirect(registrationURL);
});

app.get("/login", async (req, res) => {
  const loginURL = (await client.login()).toString();
  res.redirect(loginURL);
});

app.get("/logout", async (req, res) => {
  const logoutURL = client.logout();
  res.redirect(logoutURL);
});
```

Please note from the above example that SDK does not perform any redirection by
itself, since this SDK is intended to be used both on the server and client side
it performs only the necessary work required for authentication, we leave it to
end-user to perform the necessary redirection.

We can also make use of the `isAuthenticated` method to arrive at a middleware for
protected routes.

```ts
import { client } from "./kinde-client";
import type { 
  Request, 
  Response, 
  NextFunction 
} from "express";

export const isAuthenticated = (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  if (client.isAuthenticated()) {
    return next();
  }
  next(new Error("not authenticated"));
}
```

Once we have the above middleware in place our route protected route could then look 
something like the following.
```ts
import { isAuthenticated } from "./middlewares";
import { client } from "./kinde-client";
import { Router } from "express";

const router = Router();

router.get("/user", isAuthenticated, async (req, res) => {
  res.send({ user: client.getUser() });
});
```
## Getting User Information
Once a user authenticates and signs in, the retrieved access token and id tokens will 
allow us to get information about the authenticated user, using the following methods.
Before proceeeding further please note that while 
[user permissions are set in Kinde](https://kinde.com/docs/user-management/user-permissions), 
you must also configure your application to unlock these functions.
```ts
"permissions": [
  "create:todos",
  "update:todos",
  "read:todos",
  "delete:todos",
  "create:tasks",
  "update:tasks",
  "read:tasks",
  "delete:tasks",
];
```

For the following discussion we will assume that permissions mentioned above have 
been setup.

**User**
```ts
client.getUser();
// {
//   "family_name": "last",
//   "given_name": "first",
//   "picture": null,
//   "email": "first.last@gmail.com",
//   "id": "kp_0c9ff3d08ca1239095a3291sd236428750be7"
// }
```

**User Organizations**  
```ts
client.getOrganization();
// { orgCode: 'org_1234' }

client.getUserOrganizations();
// { 
//   orgCodes: [
//     'org_1234', 
//     'org_abcd'
//   ] 
// }
```

**User permissions**
```ts
client.getPermission('create:todos');
// { orgCode: 'org_1234', isGranted: true }

client.getPermissions();
// { 
//   orgCode: 'org_1234', 
//   permissions: [
//     'create:todos', 
//     'update:todos', 
//     'read:todos'
//   ] 
// }
```
## Extracting Token Claims and Feature Flags 
As mentioned above for all oauth2-flows the created client will provide methods for
extracting the claims and the feature flag information that resides within those 
JSON Web Tokens. Consider now the following JSON that represents the payload of an
access token issued by Kinde.

```sh
{
  "iss": "local-testing@kinde.com",
  "aud": ["local-testing@kinde.com"],
  "gty": ["authorization_code"],
  "exp": 1658475930,
  "iat": 1658472329,
  "scp": [
    "openid",
    "profile",
    "email",
    "offline"
  ],
  "jti": "8a567995-ace9-4e82-8724-94651a5ca50c",
  "sub": "kp_0c3ff3d085flo6396as29d4ffee750be7",
  "permissions": [
    "perm1", 
    "perm2", 
    "perm3"
  ],
  "azp": "",
  "org_code": "org_123456789",
  "feature_flags": {
    "is_dark_mode": {
      "t": "b",
      "v": false
    },
    "competitions_limit": {
      "t": "i",
      "v": 5
    },
    "theme": {
      "t": "s",
      "v": "pink"
    }
  }
}
```

The client provides `getClaim` and `getClaimValue` methods that allow use to extract
the claims within this payload like so, the user organization and permission methods
mentioned above in fact make use of these methods.
```ts
client.getClaim('aud');
// { name: "aud", value: ["local-testing@kinde.com"] }

client.getClaimValue('aud')
// ["local-testing@kinde.com"]
```

By default the `getClaim` and `getClaimValue` look for the requested claim in the 
access token however you can provide a second parameter to change target token for
example. 
```ts
client.getClaim('email', 'id_token');
// { name: "email", value: "first.last@test.com" }

client.getClaimValue('email', 'id_token')
// "first.last@test.com"
```

Feature flags are special claims that reside within the access token and the SDK 
provides methods for extracting them from the access token. Consider the examples
below.
```ts
client.getFeatureFlag('theme')
// {
//   "is_default": false 
//   "value": "pink",
//   "code": "theme",
//   "type": "string",
// }
```

```ts
client.getFeatureFlag('no-feature-flag')
// Error: "Flag no-feature-flag was not found, and no default value has been provided"
```

```ts
client.getFeatureFlag('no-feature-flag', 'default-value')
// {
//   "is_default": true
//   "code": "no-feature-flag",
//   "value": "default-value",
// }
```

```ts
client.getFeatureFlag('theme', 'default-theme', 'b')
// Error: "Flag theme is of type string, expected type is boolean
```

## SDK API Reference
We first discuss the methods provided by `createKindeClient` for grant types
`AUTHORIZATION_CODE` and `PKCE`.

### `register`
The method returns the registration URL, your app should redirect to this URL
when you are registering new users, post registration Kinde will redirect the
user back to your application at the callback route that you have configured. 
The app takes the following options as an argument. 
```ts
register(options?: AuthURLOptions): Promise<URL>
```

```ts
interface AuthURLOptions {
  start_page?: string;
  audience?: string;
  is_create_org?: boolean;
  org_name?: string;
  state?: string;
  scope?: string;
}
```

Notice that you are able to override the `state`, `scope` and `audience` 
parameters, with the default value for the scope parameter set to 
`openid profile email offline`.

### `login`
The method returns the login URL, your app should redirect to this URL when 
you are signing in a user, post authentication Kinde will redirect the user 
back to your application at the callback route that you have configured. 
The app takes the following options as argument.
```ts
login(options?: AuthURLOptions): Promise<URL>
```

### `createOrg`
This method will return a registration URL, with the `is_create_org` parameter,
do make sure to provide the `org_name` as part of the `options` argument, this 
will create the provide organization as part of the registration process.
```ts
createOrg(options?: AuthURLOptions): Promise<URL>
```

### `handleRedirectToApp`
This method accepts the callback URL in your application, to which Kinde redirects
to post registration or login, validates state query parameter and exchanges the
obtained authorization code to get the access, refresh and Id tokens. In addition
it commits those tokens to memory.
```ts
handleRedirectToApp(callbackURL: URL): Promise<void>
```

### `logout`
This method clears all tokens stored in memory and returns the logout URL. It is
the responsibility of the end-user application to redirect the user to this URL
to terminate the user's session.

```ts
logout(): string 
```

### `isAuthenticated`
This method indicates whether an **unexpired access token** exists in memory,
effectively communicating if some user is presently signed in or not.
```ts
isAuthenticated(): boolean
```

### `getUser`
This method extracts the user details from the Id token obtained post authentication,
it will throw an error if invoked prior to authentication.
```ts
getUser(): Promise<UserType>
```

```ts
interface UserType {
  picture: null | string;
  family_name: string;
  given_name: string;
  email: string;
  id: string;
}
```

### `getToken`
This method returns the access token obtained post authentication, if the access 
token is expired it will refresh the access token using the available refresh 
token if neither are available an error will be thrown.
```ts
getToken(): Promise<string>
```

### `getUserProfile`
This method extracts makes use of the `getToken` method above to fetch user details
it will throw an error if invoked prior to authentication.
```ts
getUserProfile(): Promise<UserType>
```

Apart from the token claims and feature flag utility methods common to all clients. 
The `CLIENT_CREDENTIALS` grant type provides only the three methods discussed above
in **Client Methods**, all of which have the same signature as the ones for the 
`AUTHORIZATION_CODE` and `PKCE` grant types, however unlike the `AUTHORIZATION_CODE` 
and `PKCE` clients, the `getToken` method here does not make use of of any 
refresh token and a new access token is obtained if the present one is expired.

Since we have presented detailed examples of using the token claims and feature flag
utilities above, to avoid duplication will present only there signatures here.

### `getClaim`
```ts
getClaim(claim: string, tokenType: TokenType): { 
  name: string, 
  value: unknown | null,
};
```
where

```ts
type TokenType = 
  | 'refresh_token' 
  | 'access_token' 
  | 'id_token';
```

### `getClaimValue`
```ts
getClaimValue(
  claim: string, type: TokenType = 'access_token'
): unknown | null
```

### `getPermission`
```ts
getPermission(name: string): { 
  orgCode: string, isGranted: boolean 
}
```

### `getPermissions`
```ts
getPermissions(name: string): { 
  orgCode: string, isGranted: boolean 
}
```

### `getUserOrganizations`
```ts
getUserOrganizations(): string[]
```

### `getOrganization`
```ts
getOrganization(): string
```

### `getFlag`
```ts
getFlag = (
  code: string,
  defaultValue?: FlagType[keyof FlagType],
  type?: keyof FlagType
): GetFlagType
```

where

```ts
interface FlagType {
  s: string;
  b: boolean;
  i: number;
}

interface GetFlagType {
  type?: 'string' | 'boolean' | 'number';
  value: FlagType[keyof FlagType];
  is_default: boolean;
  code: string;
}
```

### `getIntegerFlag`
This is a wrapper method around `getFlag` and is essentially equivalent to
`getFlag(code, defaultValue, 'i')`
```ts
getIntegerFlag(code: string, defaultValue?: number): number
```

### `getStringFlag`
This is a wrapper method around `getFlag` and is essentially equivalent to
`getFlag(code, defaultValue, 's')`
```ts
getIntegerFlag(code: string, defaultValue?: string): string
```
### `getBooleanFlag`
This is a wrapper method around `getFlag` and is essentially equivalent to
`getFlag(code, defaultValue, 'b')`
```ts
getBooleanFlag(code: string, defaultValue?: boolean): boolean
```

If you need help connecting to Kinde, please contact us at 
[support@kinde.com](mailto:support@kinde.com).