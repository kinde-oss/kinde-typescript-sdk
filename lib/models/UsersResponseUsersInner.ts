/* tslint:disable */
/* eslint-disable */
/**
 * Kinde Management API
 * Provides endpoints to manage your Kinde Businesses
 *
 * The version of the OpenAPI document: 1
 * Contact: support@kinde.com
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { exists, mapValues } from '../runtime.js';
import type { UserIdentitiesInner } from './UserIdentitiesInner.js';
import {
    UserIdentitiesInnerFromJSON,
    UserIdentitiesInnerFromJSONTyped,
    UserIdentitiesInnerToJSON,
} from './UserIdentitiesInner.js';

/**
 * 
 * @export
 * @interface UsersResponseUsersInner
 */
export interface UsersResponseUsersInner {
    /**
     * Unique id of the user in Kinde.
     * @type {string}
     * @memberof UsersResponseUsersInner
     */
    id?: string;
    /**
     * External id for user.
     * @type {string}
     * @memberof UsersResponseUsersInner
     */
    providedId?: string;
    /**
     * Default email address of the user in Kinde.
     * @type {string}
     * @memberof UsersResponseUsersInner
     */
    email?: string;
    /**
     * User's last name.
     * @type {string}
     * @memberof UsersResponseUsersInner
     */
    lastName?: string;
    /**
     * User's first name.
     * @type {string}
     * @memberof UsersResponseUsersInner
     */
    firstName?: string;
    /**
     * Whether the user is currently suspended or not.
     * @type {boolean}
     * @memberof UsersResponseUsersInner
     */
    isSuspended?: boolean;
    /**
     * User's profile picture URL.
     * @type {string}
     * @memberof UsersResponseUsersInner
     */
    picture?: string;
    /**
     * Total number of user sign ins.
     * @type {number}
     * @memberof UsersResponseUsersInner
     */
    totalSignIns?: number | null;
    /**
     * Number of consecutive failed user sign ins.
     * @type {number}
     * @memberof UsersResponseUsersInner
     */
    failedSignIns?: number | null;
    /**
     * Last sign in date in ISO 8601 format.
     * @type {string}
     * @memberof UsersResponseUsersInner
     */
    lastSignedIn?: string | null;
    /**
     * Date of user creation in ISO 8601 format.
     * @type {string}
     * @memberof UsersResponseUsersInner
     */
    createdOn?: string | null;
    /**
     * Array of organizations a user belongs to.
     * @type {Array<string>}
     * @memberof UsersResponseUsersInner
     */
    organizations?: Array<string>;
    /**
     * Array of identities belonging to the user.
     * @type {Array<UserIdentitiesInner>}
     * @memberof UsersResponseUsersInner
     */
    identities?: Array<UserIdentitiesInner>;
}

/**
 * Check if a given object implements the UsersResponseUsersInner interface.
 */
export function instanceOfUsersResponseUsersInner(value: object): boolean {
    let isInstance = true;

    return isInstance;
}

export function UsersResponseUsersInnerFromJSON(json: any): UsersResponseUsersInner {
    return UsersResponseUsersInnerFromJSONTyped(json, false);
}

export function UsersResponseUsersInnerFromJSONTyped(json: any, ignoreDiscriminator: boolean): UsersResponseUsersInner {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'id': !exists(json, 'id') ? undefined : json['id'],
        'providedId': !exists(json, 'provided_id') ? undefined : json['provided_id'],
        'email': !exists(json, 'email') ? undefined : json['email'],
        'lastName': !exists(json, 'last_name') ? undefined : json['last_name'],
        'firstName': !exists(json, 'first_name') ? undefined : json['first_name'],
        'isSuspended': !exists(json, 'is_suspended') ? undefined : json['is_suspended'],
        'picture': !exists(json, 'picture') ? undefined : json['picture'],
        'totalSignIns': !exists(json, 'total_sign_ins') ? undefined : json['total_sign_ins'],
        'failedSignIns': !exists(json, 'failed_sign_ins') ? undefined : json['failed_sign_ins'],
        'lastSignedIn': !exists(json, 'last_signed_in') ? undefined : json['last_signed_in'],
        'createdOn': !exists(json, 'created_on') ? undefined : json['created_on'],
        'organizations': !exists(json, 'organizations') ? undefined : json['organizations'],
        'identities': !exists(json, 'identities') ? undefined : ((json['identities'] as Array<any>).map(UserIdentitiesInnerFromJSON)),
    };
}

export function UsersResponseUsersInnerToJSON(value?: UsersResponseUsersInner | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'id': value.id,
        'provided_id': value.providedId,
        'email': value.email,
        'last_name': value.lastName,
        'first_name': value.firstName,
        'is_suspended': value.isSuspended,
        'picture': value.picture,
        'total_sign_ins': value.totalSignIns,
        'failed_sign_ins': value.failedSignIns,
        'last_signed_in': value.lastSignedIn,
        'created_on': value.createdOn,
        'organizations': value.organizations,
        'identities': value.identities === undefined ? undefined : ((value.identities as Array<any>).map(UserIdentitiesInnerToJSON)),
    };
}
