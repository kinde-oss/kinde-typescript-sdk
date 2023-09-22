# @kinde-oss/kinde-typescript-sdk 
The `@kinde-oss/kinde-typescript-sdk` allows developers to integrate [**Kinde**](https://kinde.com)
Authentication into their TypeScript projects. This SDK implements the following
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
This SDK has been written to be used with node version `v18.16.x` or later in mind 
and can be installed using any appropriate package manager be it `npm`, `yarn` or 
`pnpm`.

```bash
npm install --save @kinde-oss/kinde-typescript-sdk
pnpm add --save @kinde-oss/kinde-typescript-sdk
yarn add @kinde-oss/kinde-typescript-sdk
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

The `@kinde-oss/kinde-typescript-sdk` package is intended to work on both browser
and Node.js environments, consequently for both environments the SDK provides 
different clients, we provide examples below to demonstrate this.

**Creating a Authorization Code server client**
```ts
import { 
  createKindeServerClient, 
  GrantType,
  type ACClientOptions,
} from "@kinde-oss/kinde-typescript-sdk";

const clientOptions: ACClientOptions = {
  authDomain: process.env.KINDE_AUTH_DOMAIN,
  clientId: process.env.KINDE_CLIENT_ID,
  clientSecret: process.env.KINDE_CLIENT_SECRET,
  logoutRedirectURL: process.env.KINDE_LOGOUT_REDIRECT_URL,
  redirectURL: process.env.KINDE_REDIRECT_URL
};

const client = createKindeServerClient(
  GrantType.AUTHORIZATION_CODE, clientOptions
);
```

**Creating a PKCE server client**  
```ts
import { 
  createKindeServerClient, 
  GrantType,
  type PKCEClientOptions,
} from "@kinde-oss/kinde-typescript-sdk";

const clientOptions: PKCEClientOptions = {
  authDomain: process.env.KINDE_AUTH_DOMAIN,
  clientId: process.env.KINDE_CLIENT_ID,
  logoutRedirectURL: process.env.KINDE_LOGOUT_REDIRECT_URL,
  redirectURL: process.env.KINDE_REDIRECT_URL
};

const client = createKindeServerClient(
  GrantType.PKCE, clientOptions
);
```

**Creating a Client Credentials server client**
```ts
import { 
  createKindeServerClient, 
  GrantType,
  type CCClientOptions,
} from "@kinde-oss/kinde-typescript-sdk";

const clientOptions: CCClientOptions = {
  authDomain: process.env.KINDE_AUTH_DOMAIN,
  clientId: process.env.KINDE_CLIENT_ID,
  clientSecret: process.env.KINDE_CLIENT_SECRET,
  logoutRedirectURL: process.env.KINDE_LOGOUT_REDIRECT_URL
};

const client = createKindeServerClient(
  GrantType.CLIENT_CREDENTIALS, clientOptions
)
```

**Creating a Browser Client**  
Of the many OAuth2.0 flows mentioned above in the introduction, the only secure flow
available for public clients is the Authorization Code flow with PKCE extension thus
the creation of a browser client is considerably more straightforward as mentioned
below.

```ts
import { 
  createKindeBrowserClient, 
  type PKCEClientOptions,
} from "@kinde-oss/kinde-typescript-sdk";

const clientOptions: PKCEClientOptions = {
  authDomain: process.env.KINDE_AUTH_DOMAIN,
  clientId: process.env.KINDE_CLIENT_ID,
  logoutRedirectURL: process.env.KINDE_LOGOUT_REDIRECT_URL,
  redirectURL: process.env.KINDE_REDIRECT_URL
};

const client = createKindeBrowserClient(clientOptions);
```

## Overriding `audience` and `scope`
Regardless of the environment in question for both client creation methods i.e.
`createKindeServerClient` and `createKindeBrowserClient` , the `clientOptions`
parameter accepts the `audience` and `scope` optional parameters.

The `audience` parameter defines who the tokens received post-authentication are
intended for, and the `scope` parameter defining what actions the received token is
permitted to perform, in the event `scope` is not provided it is assigned the 
following default value.
```ts
'openid profile email offline'
```

An example demonstrating overriding `audience` and `scope` for an `AUTHORIZATION_CODE`
client is provided below, however this is valid for `PKCE` and `CLIENT_CREDENTIALS`
grant type as well.

```ts
import { 
  createKindeServerClient, 
  GrantType,
  type ACClientOptions,
} from "@kinde-oss/kinde-typescript-sdk";

const clientOptions: ACClientOptions = {
  authDomain: process.env.KINDE_AUTH_DOMAIN,
  clientId: process.env.KINDE_CLIENT_ID,
  clientSecret: process.env.KINDE_CLIENT_SECRET,
  logoutRedirectURL: process.env.KINDE_LOGOUT_REDIRECT_URL,
  redirectURL: process.env.KINDE_REDIRECT_URL,
  scope: 'openid email offline',
  audience: 'api.example.com/v1'
};

const client = createKindeServerClient(
  GrantType.AUTHORIZATION_CODE, clientOptions
);
```

An example demonstrating this on the browser is provided below.
```ts
import { 
  createKindeBrowserClient, 
  type PKCEClientOptions,
} from "@kinde-oss/kinde-typescript-sdk";

const clientOptions: PKCEClientOptions = {
  authDomain: process.env.KINDE_AUTH_DOMAIN,
  clientId: process.env.KINDE_CLIENT_ID,
  logoutRedirectURL: process.env.KINDE_LOGOUT_REDIRECT_URL,
  redirectURL: process.env.KINDE_REDIRECT_URL,
  scope: 'openid email offline',
  audience: 'api.example.com/v1'
};

const client = createKindeBrowserClient(clientOptions);
```

## Overriding Tracking Header
Whenever the SDK requests new tokens either on initial login or on subsequent token
refreshes. The SDK adds the header `Kinde-SDK: TypeScript/current-version`, to this 
request, however this header can be overriden for *all clients*, by providing the 
`framework` and `frameworkVersion` options as part of the client options. We present 
an example below to demonstrate this.

```ts
import { 
  createKindeServerClient, 
  GrantType,
  type ACClientOptions,
} from "@kinde-oss/kinde-typescript-sdk";

const clientOptions: ACClientOptions = {
  authDomain: process.env.KINDE_AUTH_DOMAIN,
  clientId: process.env.KINDE_CLIENT_ID,
  clientSecret: process.env.KINDE_CLIENT_SECRET,
  logoutRedirectURL: process.env.KINDE_LOGOUT_REDIRECT_URL,
  redirectURL: process.env.KINDE_REDIRECT_URL,
  frameworkVersion: '1.1.1',
  framework: 'ExpressJS'
};

const client = createKindeServerClient(
  GrantType.AUTHORIZATION_CODE, clientOptions
);
```

## Server Client Methods
Please note that depending on the provided grant type the created server client
will expose different methods, however certain methods are common to all oauth2 flows,
which we have listed below, for details on what these methods are please refere 
to the detailed SDK reference provided below.

- `getToken()`
- `logout()`

In addition to the above both clients expose certain utility methods for handling 
token claims and feature flags we discuss them further below.

## Registration, Login and Logout
To demonstrate usage of the Kinde Server client. We present an **example** below of a 
backend scenario where we attempt to integrate the SDK with the express framework,
with the grant type of interest being either `AUTHORIZATION_CODE` or `PKCE`. This
example will also show how we may make use of the `register`, `login` and `logout`
methods exposed by the client.

```ts
import { sessionManager } from "./middlewares";
import { client } from "./kinde-client";
import session from "express-session";
import * as config from "./config";
import { Express } from "express";
import { join } from "path";

const app = express();

const sessionConfig = {
  secret: "secret",
  saveUninitialized: true,
  cookie: { maxAge: 1000 * 60 * 60 * 24 },
  resave: false,
};

app.use(session(sessionConfig));
app.use(sessionManager);

app.get("/callback", async (req, res) => {
  const callbackURL = new URL(join(config.appBaseURL, req.url));
  await client.handleRedirectToApp(req, callbackURL);
  res.redirect("/");
});

app.get("/register", async (req, res) => {
  if (await client.isAuthenticated(req)) {
    return res.send({ message: "You are already authenticated !" });
  }

  const registrationURL = (await client.register(req)).toString();
  res.redirect(registrationURL);
});

app.get("/login", async (req, res) => {
  if (await client.isAuthenticated(req)) {
    return res.send({ message: "You are already authenticated !" });
  }

  const loginURL = (await client.login(req)).toString();
  res.redirect(loginURL);
});

app.get("/logout", async (req, res) => {
  const logoutURL = (await client.logout(req)).toString();
  res.redirect(logoutURL);
});
```

Please note from the above example that SDK does not perform any redirection by
itself, since this SDK is intended to be used both on the server and client side
it performs only the necessary work required for authentication, we leave it to
end-user to perform the necessary redirection.

## Framework agnostic server session management
You may have noticed the `sessionManager` import in the above example it is 
important to expand on this, this is in fact a middleware the implementation of 
which is provided below, To understand why is this required please keep reading.

```ts
export const sessionManager = (
  req: Request, res: Response, next: NextFunction
) => {
  req.setSessionItem = async (itemKey: string, itemValue: unknown) => {
    req.session[itemKey] = itemValue;
  }

  req.getSessionItem = async (itemKey: string) => {
    return req.session[itemKey] ?? null;
  }

  req.removeSessionItem = async (itemKey: string) => {
    delete req.session[itemKey];
  }

  req.destroySession = async () => {
    req.session.destroy(error => console.error(error));
  }

  next();
}
```
please note that the `express-session` package used above is used just to make the 
implementation of this middleware easier and **is not a dependency of the SDK itself**.

### The `SessionManager` interface
This SDK is intended to be **framework agnostic**, consequently it exports a custom
interface called `SessionManager` to enforce a contract between the end-user 
framework and the SDK. The definition of which is presented below.
```ts
type Awaitable<T> = Promise<T>;

interface SessionManager {
  getSessionItem: (itemKey: string) => Awaitable<unknown | null>;
  setSessionItem: (itemKey: string, itemValue: unknown) => Awaitable<void>;
  removeSessionItem: (itemKey: string) => Awaitable<void>;
  destroySession: () => Awaitable<void>;
}
```

This allows the SDK to interact with the *external* session store in a controller 
manner. The `sessionManager` middleware that you see above is how this "contract" 
manifests itself in the case of the `express` framework, depending on which 
framework your project uses the *implementation of said contract will differ*
*from the one presented above*.

### Type considerations for the `SessionManager` interface
Since the additional methods that are required by the `SessionManager` interface
will be bound to the *request context* object (`req: Request` in the case of
the `express` framework). We have to ensure our typescript setup is able to 
accomodate this, *again it must be noted that this will differ depending on the 
framework in question*.

To achieve this in the case of the above `express` example, we make use of the
concept of [**declaration merging**](https://www.typescriptlang.org/docs/handbook/declaration-merging.html).
Start by creating a `custom.d.ts` declaration file in your `src` directory with 
the following definitions, and add this file to the `files` key of your project's 
`tsconfig.json`.

```ts
import { SessionManager } from "@kinde-oss/kinde-typescript-sdk";
import { Session, SessionData } from "express-session";

declare module 'express-session' {
  interface SessionData {
    [key: string]: unknown
  }
}

declare global {
  namespace Express {
    export interface Request extends SessionManager {
      session: Session & Partial<SessionData>;
      sessionID: string;
    }
  }
}
```

## Securing Protected Routes
Continuing on with the above exampmle in mind, we can also make use of the 
`isAuthenticated` method to arrive at a middleware for protected routes.

```ts
import { client } from "./kinde-client";
import type { 
  Request, 
  Response, 
  NextFunction 
} from "express";

export const isAuthenticated = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  if (!(await client.isAuthenticated(req))) {
    return next();
  }
  next(new Error("not authenticated"));
}
```

Once we have the above middleware in place our protected route could then look 
something like the following.
```ts
import { isAuthenticated } from "./middlewares";
import { client } from "./kinde-client";
import { Router } from "express";

const router = Router();

router.get("/user", isAuthenticated, async (req, res) => {
  // Protected route implementation
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
client.getUser(req);
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
client.getOrganization(req);
// { orgCode: 'org_1234' }

client.getUserOrganizations(req);
// { 
//   orgCodes: [
//     'org_1234', 
//     'org_abcd'
//   ] 
// }
```

**User permissions**
```ts
client.getPermission(req, 'create:todos');
// { orgCode: 'org_1234', isGranted: true }

client.getPermissions(req);
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
client.getClaim(req, 'aud');
// { name: "aud", value: ["local-testing@kinde.com"] }

client.getClaimValue(req, 'aud')
// ["local-testing@kinde.com"]
```

By default the `getClaim` and `getClaimValue` look for the requested claim in the 
access token however you can provide a second parameter to change the target token 
for example. 
```ts
client.getClaim(req, 'email', 'id_token');
// { name: "email", value: "first.last@test.com" }

client.getClaimValue(req, 'email', 'id_token')
// "first.last@test.com"
```

Feature flags are special claims that reside within the access token and the SDK 
provides methods for extracting them from the access token. Consider the examples
below.
```ts
client.getFeatureFlag(req, 'theme')
// {
//   "is_default": false 
//   "value": "pink",
//   "code": "theme",
//   "type": "string",
// }
```

```ts
client.getFeatureFlag(req, 'no-feature-flag')
// Error: "Flag no-feature-flag was not found, and no default value has been provided"
```

```ts
client.getFeatureFlag(req, 'no-feature-flag', 'default-value')
// {
//   "is_default": true
//   "code": "no-feature-flag",
//   "value": "default-value",
// }
```

```ts
client.getFeatureFlag(req, 'theme', 'default-theme', 'b')
// Error: "Flag theme is of type string, expected type is boolean
```

## SDK Server API Reference
We first discuss the methods provided by `createKindeServerClient` for grant 
types `AUTHORIZATION_CODE` and `PKCE`.

### `register`
The method returns the registration URL, your app should redirect to this URL
when you are registering new users, post registration Kinde will redirect the
user back to your application at the callback route that you have configured. 
The app takes the following options as an argument. 
```ts
register(
  sessionManager: SessionManager, 
  options?: LoginURLOptions
): Promise<URL>
```

```ts
interface RegisterURLOptions {
  org_name?: string;
  org_code?: string;
  state?: string;
}
```
Notice that you are able to override the `state` parameter in `RegisterURLOptions`,
if not provided then the SDK will assign a random string to this value, this
applies to the `login` method discussed below as well. In addition it must be 
noted that internally this method will ensure the resulting registration URL has
the `start_page` query parameter to `'registration'`.

### `login`
The method returns the login URL, your app should redirect to this URL when 
you are signing in a user, post authentication Kinde will redirect the user 
back to your application at the callback route that you have configured. 
The app takes the following options as argument.

```ts
login(
  sessionManager: SessionManager, 
  options?: LoginURLOptions
): Promise<URL>
```

```ts
interface LoginURLOptions {
  org_name?: string;
  org_code?: string;
  state?: string;
}
```

### `createOrg`
This method will return a registration URL, with the `is_create_org` parameter
set to true, do make sure to provide the `org_name` as part of the `options` 
argument, this will create the provide organization as part of the registration 
process.
```ts
createOrg(
  sessionManager: SessionManager, 
  options?: CreateOrgURLOptions
): Promise<URL>
```

```ts
interface CreateOrgURLOptions {
  org_name?: string;
  org_code?: string;
  state?: string;
}
```
In addition it must be noted that as in the `registration` method above internally 
this method will also set the `start_page` query parameter to `'registration'`.
in the resulting URL.

### `handleRedirectToApp`
This method accepts the callback URL in your application, to which Kinde redirects
to post registration or login, validates state query parameter and exchanges the
obtained authorization code to get the access, refresh and Id tokens. In addition
it commits those tokens to memory.
```ts
handleRedirectToApp(
  sessionManager: SessionManager, 
  callbackURL: URL
): Promise<void>
```

### `logout`
This method clears all tokens stored in memory and returns the logout URL. It is
the responsibility of the end-user application to redirect the user to this URL
to terminate the user's session.

```ts
logout(sessionManager: SessionManager): URL
```

### `isAuthenticated`
This method indicates whether an **unexpired access token** exists in memory,
effectively communicating if some user is presently signed in or not, in the
event that the token is expired it first attempts to refresh first, if the 
refresh fails `false` is returned.
```ts
isAuthenticated(sessionManager: SessionManager): Promise<boolean>
```

### `getUser`
This method extracts the user details from the Id token obtained post authentication,
it will throw an error if invoked prior to authentication.
```ts
getUser(sessionManager: SessionManager): Promise<UserType>
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
getToken(sessionManager: SessionManager): Promise<string>
```

### `getUserProfile`
This method extracts makes use of the `getToken` method above to fetch user details
it will throw an error if invoked prior to authentication.
```ts
getUserProfile(sessionManager: SessionManager): Promise<UserType>
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
getClaim(
  sessionManager: SessionManager, 
  claim: string, 
  tokenType: ClaimTokenType
): { 
  name: string, 
  value: unknown | null,
};
```
where

```ts
type ClaimTokenType = 
  | 'access_token' 
  | 'id_token';
```

### `getClaimValue`
```ts
getClaimValue(
  sessionManager: SessionManager,
  claim: string, 
  type: ClaimTokenType = 'access_token'
): unknown | null
```

### `getPermission`
```ts
getPermission(sessionManager: SessionManager, name: string): { 
  orgCode: string | null, isGranted: boolean 
}
```

### `getPermissions`
```ts
getPermissions(sessionManager: SessionManager, name: string): { 
  orgCode: string | null, permissions: string[]
}
```

### `getUserOrganizations`
```ts
getUserOrganizations(sessionManager: SessionManager): string[]
```

### `getOrganization`
```ts
getOrganization(sessionManager: SessionManager): string | null
```

### `getFlag`
```ts
getFlag = (
  sessionManager: SessionManager,
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
`getFlag(sessionManager, code, defaultValue, 'i')`
```ts
getIntegerFlag(
  sessionManager: SessionManager, 
  code: string, 
  defaultValue?: number
): number
```

### `getStringFlag`
This is a wrapper method around `getFlag` and is essentially equivalent to
`getFlag(sessionManager, code, defaultValue, 's')`
```ts
getIntegerFlag(
  sessionManager: SessionManager, 
  code: string, 
  defaultValue?: string
): string
```
### `getBooleanFlag`
This is a wrapper method around `getFlag` and is essentially equivalent to
`getFlag(sessionManager, code, defaultValue, 'b')`
```ts
getBooleanFlag(
  sessionManager: SessionManager, 
  code: string, 
  defaultValue?: boolean
): boolean
```

## SDK Browser API Reference
The methods exposed by `createKindeBrowserClient` are identitical to those exposed
by the `createKindeServerClient` for the `PKCE` grant type, however the methods
for the browser client do not accept the `SessionManager` parameter, for this 
purpose we do not repeat the method reference provided above. It does suffice to
provide some examples below.

### `login`
```ts
login(options?: LoginURLOptions): Promise<URL>
```

### `getOrganization`
```ts
getOrganization(): string
```

If you need help connecting to Kinde, please contact us at 
[support@kinde.com](mailto:support@kinde.com).