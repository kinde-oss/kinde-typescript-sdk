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

import { exists, mapValues } from '../runtime';
/**
 * 
 * @export
 * @interface Permissions
 */
export interface Permissions {
    /**
     * The permission identifier to use in code.
     * @type {string}
     * @memberof Permissions
     */
    id?: string;
    /**
     * The permission's name.
     * @type {string}
     * @memberof Permissions
     */
    name?: string;
    /**
     * The permission's description.
     * @type {string}
     * @memberof Permissions
     */
    description?: string;
}

/**
 * Check if a given object implements the Permissions interface.
 */
export function instanceOfPermissions(value: object): boolean {
    let isInstance = true;

    return isInstance;
}

export function PermissionsFromJSON(json: any): Permissions {
    return PermissionsFromJSONTyped(json, false);
}

export function PermissionsFromJSONTyped(json: any, ignoreDiscriminator: boolean): Permissions {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'id': !exists(json, 'id') ? undefined : json['id'],
        'name': !exists(json, 'name') ? undefined : json['name'],
        'description': !exists(json, 'description') ? undefined : json['description'],
    };
}

export function PermissionsToJSON(value?: Permissions | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'id': value.id,
        'name': value.name,
        'description': value.description,
    };
}
