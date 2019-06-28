import { owner, OwnerType } from './owner'
import { scope, ScopeType } from './scope'

export interface IDefaults {
    scope : ScopeType,
    owner : OwnerType
}

export const defaults: IDefaults = {
    get scope(): ScopeType {
        return scope.none
    },

    get owner(): OwnerType {
        return owner.container
    }
}

export { owner, OwnerType } from './owner'
export { scope, ScopeType } from './scope'
export { callInfo, CallInfo, CallInfoType  } from './call-info-type'
