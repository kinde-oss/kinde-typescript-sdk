export interface TokenCollection {
  refresh_token: string;
  access_token: string;
  id_token: string;
}

export interface UserType {
  picture: null | string;
  family_name: string;
  given_name: string;
  email: string;
  id: string;
}

export type TokenType = 'refresh_token' | 'access_token' | 'id_token';
export type ClaimTokenType = 'access_token' | 'id_token';

export enum FlagDataType {
  s = 'string',
  b = 'boolean',
  i = 'number',
}

export interface FlagType {
  s: string;
  b: boolean;
  i: number;
}

export interface FeatureFlag<T extends keyof FlagType> {
  t: T;
  v: FlagType[T];
}

export type FeatureFlags = Record<string, FeatureFlag<'b' | 'i' | 's'> | undefined>;

export interface GetFlagType {
  type?: 'string' | 'boolean' | 'number';
  value: FlagType[keyof FlagType];
  is_default: boolean;
  code: string;
}

export type WebhookSource = 'admin' | 'api' | 'user';

export interface UserCreatedWebhookEvent {
  data: {
    user: {
      email: string | null;
      first_name: string;
      id: string;
      last_name: string;
      phone: string | null;
    };
  };
  event_id: string;
  source: WebhookSource;
  timestamp: string;
  type: 'user.created';
}

export interface UserUpdatedWebhookEvent {
  data: {
    user: {
      email: string;
      first_name: string;
      id: string;
      is_password_reset_requested: boolean;
      is_suspended: boolean;
      last_name: string;
      organizations: {
        code: string;
        permissions: {
          id: string;
          key: string;
        }[] | null;
        roles: any[] | null;
      }[];
      phone: string | null;
    };
  };
  event_id: string;
  source: WebhookSource;
  timestamp: string;
  type: 'user.updated';
}

export interface UserDeletedWebhookEvent {
  data: {
    user: {
      id: string;
    };
  };
  event_id: string;
  source: WebhookSource;
  timestamp: string;
  type: 'user.deleted';
}

export interface UserAuthenticatedWebhookEvent {
  data: {
    user: {
      id: string;
    };
  };
  event_id: string;
  source: WebhookSource;
  timestamp: string;
  type: 'user.authenticated';
}

export interface UserAuthenticationFailedWebhookEvent {
  data: {
    user: {
      id: string;
    };
  };
  event_id: string;
  source: WebhookSource;
  timestamp: string;
  type: 'user.authentication_failed';
}

export interface AccessRequestCreatedWebhookEvent {
  data: {
    access_request: {
      email: string;
      first_name: string;
      last_name: string;
      user_id: string;
    };
  };
  event_id: string;
  source: WebhookSource;
  timestamp: string;
  type: "access_request.created";
}

export interface OrganizationCreatedWebhookEvent {
  data: {
    organization: {
      code: string;
      external_id: string | null;
      handle: string;
      name: string;
    };
  };
  event_id: string;
  source: WebhookSource;
  timestamp: string;
  type: "organization.created";
}

export interface OrganizationUpdatedWebhookEvent {
  data: {
    organization: {
      code: string;
      external_id: string | null;
      handle: string;
      is_allow_registrations: boolean;
      name: string;
    };
  };
  event_id: string;
  source: WebhookSource;
  timestamp: string;
  type: "organization.updated";
}

export interface OrganizationDeletedWebhookEvent {
  data: {
    organization: {
      code: string;
    };
  };
  event_id: string;
  source: WebhookSource;
  timestamp: string;
  type: "organization.deleted";
}

export interface PermissionCreatedWebhookEvent {
  data: {
    permission: {
      description: string;
      id: string;
      key: string;
      name: string;
    };
  };
  event_id: string;
  source: WebhookSource;
  timestamp: string;
  type: "permission.created";
}

export interface PermissionUpdatedWebhookEvent {
  data: {
    permission: {
      description: string;
      id: string;
      key: string;
      name: string;
    };
  };
  event_id: string;
  source: WebhookSource;
  timestamp: string;
  type: "permission.updated";
}

export interface PermissionDeletedWebhookEvent {
  data: {
    permission: {
      id: string;
    };
  };
  event_id: string;
  source: WebhookSource;
  timestamp: string;
  type: "permission.deleted";
}

export interface RoleCreatedWebhookEvent {
  data: {
    role: {
      description: string;
      id: string;
      is_default_role: boolean;
      key: string;
      name: string;
    };
  };
  event_id: string;
  source: WebhookSource;
  timestamp: string;
  type: "role.created";
}

export interface RoleUpdatedWebhookEvent {
  data: {
    role: {
      description: string;
      id: string;
      is_default_role: boolean;
      key: string;
      name: string;
    };
  };
  event_id: string;
  source: WebhookSource;
  timestamp: string;
  type: "role.updated";
}

export interface RoleDeletedWebhookEvent {
  data: {
    role: {
      id: string;
    };
  };
  event_id: string;
  source: WebhookSource;
  timestamp: string;
  type: "role.deleted";
}

export interface SubscriberCreatedWebhookEvent {
  data: {
    subscriber: {
      email: string;
      first_name: string;
      id: string;
      last_name: string;
      user_id: string;
    };
  };
  event_id: string;
  source: WebhookSource;
  timestamp: string;
  type: "subscriber.created";
}
