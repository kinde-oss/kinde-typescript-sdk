import { SessionManager } from "../../session-managers";
import * as utilities from '../../utilities/index.js';

import type {
  ClaimTokenType,
  GetFlagType,
  FlagType,
} from '../../utilities/index.js';

const withAuthUtilities = (
  isAuthenticated: (session: SessionManager) => Promise<boolean>
) => {
  const { featureFlags, tokenClaims } = utilities;

  /**
   * Method extracts the provided number feature flag from the access token in
   * the current session.
   * @param {SessionManager} sessionManager
   * @param {string} code
   * @param {number} defaultValue
   * @returns {number} integer flag value
   */
  const getIntegerFlag = async (
    sessionManager: SessionManager,
    code: string,
    defaultValue?: number
  ): Promise<number> => {
    if (!(await isAuthenticated(sessionManager))) {
      throw new Error(
        `Cannot return integer flag "${code}", no authentication credential found`,
      );
    }
    return await featureFlags.getIntegerFlag(
      sessionManager,
      code,
      defaultValue
    );
  };

  /**
   * Method extracts the provided string feature flag from the access token in
   * the current session.
   * @param {SessionManager} sessionManager
   * @param {string} code
   * @param {string} defaultValue
   * @returns {string} string flag value
   */
  const getStringFlag = async (
    sessionManager: SessionManager,
    code: string,
    defaultValue?: string
  ): Promise<string> => {
    if (!(await isAuthenticated(sessionManager))) {
      throw new Error(
        `Cannot return string flag "${code}", no authentication credential found`,
      );
    }
    return await featureFlags.getStringFlag(sessionManager, code, defaultValue);
  };

  /**
   * Method extracts the provided boolean feature flag from the access token in
   * the current session.
   * @param {SessionManager} sessionManager
   * @param {string} code
   * @param {boolean} defaultValue
   * @returns {boolean} boolean flag value
   */
  const getBooleanFlag = async (
    sessionManager: SessionManager,
    code: string,
    defaultValue?: boolean
  ): Promise<boolean> => {
    if (!(await isAuthenticated(sessionManager))) {
      throw new Error(
        `Cannot return boolean flag "${code}", no authentication credential found`,
      );
    }
    return await featureFlags.getBooleanFlag(
      sessionManager,
      code,
      defaultValue
    );
  };

  /**
   * Method extracts the provided claim from the provided token type in the
   * current session.
   * @param {SessionManager} sessionManager
   * @param {string} claim
   * @param {ClaimTokenType} type
   * @returns {unknown | null}
   */
  const getClaimValue = async (
    sessionManager: SessionManager,
    claim: string,
    type: ClaimTokenType = 'access_token'
  ): Promise<unknown | null> => {
    if (!(await isAuthenticated(sessionManager))) {
      throw new Error(
        `Cannot return claim "${claim}", no authentication credential found`,
      );
    }
    return tokenClaims.getClaimValue(sessionManager, claim, type);
  };

  /**
   * Method extracts the provided claim from the provided token type in the
   * current session, the returned object includes the provided claim.
   * @param {SessionManager} sessionManager
   * @param {string} claim
   * @param {ClaimTokenType} type
   * @returns {{ name: string, value: unknown | null }}
   */
  const getClaim = async (
    sessionManager: SessionManager,
    claim: string,
    type: ClaimTokenType = 'access_token'
  ): Promise<{ name: string; value: unknown | null }> => {
    if (!(await isAuthenticated(sessionManager))) {
      throw new Error(
        `Cannot return claim "${claim}", no authentication credential found`,
      );
    }
    return await tokenClaims.getClaim(sessionManager, claim, type);
  };

  /**
   * Method returns the organization code from the current session and returns
   * a boolean in the returned object indicating if the provided permission is
   * present in the session.
   * @param {SessionManager} sessionManager
   * @param {string} name
   * @returns {{ orgCode: string | null, isGranted: boolean }}
   */
  const getPermission = async (
    sessionManager: SessionManager,
    name: string
  ): Promise<{ orgCode: string | null; isGranted: boolean }> => {
    if (!(await isAuthenticated(sessionManager))) {
      throw new Error(
        `Cannot return permission "${name}", no authentication credential found`,
      );
    }
    return await tokenClaims.getPermission(sessionManager, name);
  };

  /**
   * Method extracts the organization code from the current session.
   * @param {SessionManager} sessionManager
   * @returns {{ orgCode: string | null }}
   */
  const getOrganization = async (
    sessionManager: SessionManager
  ): Promise<{ orgCode: string | null }> => {
    if (!(await isAuthenticated(sessionManager))) {
      throw new Error(
        'Cannot return user organization, no authentication credential found',
      );
    }
    return await tokenClaims.getOrganization(sessionManager);
  };

  /**
   * Method extracts all organization codes from the id token in the current
   * session.
   * @param {SessionManager} sessionManager
   * @returns {{ orgCodes: string[] }}
   */
  const getUserOrganizations = async (
    sessionManager: SessionManager
  ): Promise<{ orgCodes: string[] }> => {
    if (!(await isAuthenticated(sessionManager))) {
      throw new Error(
        'Cannot return user organizations, no authentication credential found',
      );
    }
    return await tokenClaims.getUserOrganizations(sessionManager);
  };

  /**
   * Method extracts all the permission and the organization code in the access
   * token in the current session.
   * @param {SessionManager} sessionManager
   * @returns {{ permissions: string[], orgCode: string | null }}
   */
  const getPermissions = async (
    sessionManager: SessionManager
  ): Promise<{
    permissions: string[];
    orgCode: string | null;
  }> => {
    if (!(await isAuthenticated(sessionManager))) {
      throw new Error(
        'Cannot return user permissions, no authentication credential found',
      );
    }
    return await tokenClaims.getPermissions(sessionManager);
  };

  /**
   * Method extracts the provided feature flag from the access token in the
   * current session.
   * @param {SessionManager} sessionManager
   * @param {string} code
   * @param {FlagType[keyof FlagType]} defaultValue
   * @param {keyof FlagType} type
   * @returns {GetFlagType}
   */
  const getFlag = async (
    sessionManager: SessionManager,
    code: string,
    defaultValue?: FlagType[keyof FlagType],
    type?: keyof FlagType
  ): Promise<GetFlagType> => {
    if (!(await isAuthenticated(sessionManager))) {
      throw new Error(
        `Cannot return flag "${code}", no authentication credential found`,
      );
    }
    return await featureFlags.getFlag(sessionManager, code, defaultValue, type);
  };

  return {
    getUserOrganizations,
    getOrganization,
    getBooleanFlag,
    getIntegerFlag,
    getPermissions,
    getPermission,
    getClaimValue,
    getStringFlag,
    getClaim,
    getFlag,
  };
}

export default withAuthUtilities;