import { rolePermissions, Route, routePermissions } from "../rbac/role-n-permissiona";
import { Permission, Role } from "../types/user.types";

export function hasPermission(role: Role | undefined, permission: Permission): boolean {
    if (!role) return false;
    const permissions = rolePermissions[role] || [];
    return permissions.includes("*") || permissions.includes(permission);
}
    

export function hasRoutePermission(role : Role | undefined, permission : Route)  : boolean {
    if (!role) return false;
    const permissions = routePermissions[role] || [];
    return permissions.includes("*") || permissions.includes(permission);

}


