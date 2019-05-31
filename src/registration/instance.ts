import {
    IFactory,
    IName,
    IInitializer,
    IDisposer,
    WithAs, WithInitializeBy, WithLazy, WithName, WithScope,
    IRegistrationBase,
    IRegistration
} from './types'
import { scope, owner, Scope, Owner } from '../common'

export class Registration<T> implements IRegistration<T> {

    constructor(private _base: IRegistrationBase) {
        this.initializeBy = this.initializeBy.bind(this)
        this.dispose = this.dispose.bind(this)
        this.named = this.named.bind(this)
        this.name = this.name.bind(this)
        this.within = this.within.bind(this)
        this.ownedBy = this.ownedBy.bind(this)
        this.ownedInternally = this.ownedInternally.bind(this)
        this.ownedExternally = this.ownedExternally.bind(this)
        this.transient = this.transient.bind(this)
        this.singleton = this.singleton.bind(this)
        this.instancePerContainer = this.instancePerContainer.bind(this)
        this.lazy = this.lazy.bind(this)
    }

    public as(factory: IFactory<T>): WithAs<T> {

        this._base.factory = factory

        return {
            initializeBy: this.initializeBy,
            lazy: this.lazy,
            dispose: this.dispose,
            named: this.named,
            within: this.within,
            ownedBy: this.ownedBy,
            ownedInternally: this.ownedInternally,
            ownedExternally: this.ownedExternally,
            transient: this.transient,
            singleton: this.singleton,
            instancePerContainer: this.instancePerContainer
        }
    }

    public asType(type: T, ...params: {}[]): WithAs<T> {

        this._base.factoryType = type
        this._base.params = params

        return {
            initializeBy: this.initializeBy,
            lazy: this.lazy,
            dispose: this.dispose,
            named: this.named,
            within: this.within,
            ownedBy: this.ownedBy,
            ownedInternally: this.ownedInternally,
            ownedExternally: this.ownedExternally,
            transient: this.transient,
            singleton: this.singleton,
            instancePerContainer: this.instancePerContainer
        }
    }

    public asSelf(...params: {}[]): WithAs<T> {
        return this.asType(this._base.service as T, ...params)
    }

    public asValue(value: {}): IName {
        this._base.factoryValue = value
        this._base.owner = owner.externals
        this._base.scope = scope.none

        return {
            named: this.name
        }
    }

    private name(value: string): void {
        this.named(value)
    }

    private named(value : string): WithName<T> {

        this._base.name = value

        return {
            within : this.within,
            ownedBy : this.ownedBy,
            ownedInternally: this.ownedInternally,
            ownedExternally: this.ownedExternally,
            transient: this.transient,
            singleton: this.singleton,
            instancePerContainer: this.instancePerContainer
        }
    }

    private within(scope: Scope): WithScope<T> {

        this._base.scope = scope

        return {
            ownedBy : this.ownedBy,
            ownedInternally: this.ownedInternally,
            ownedExternally: this.ownedExternally
        }
    }

    private transient(): WithScope<T> {
        return this.within(scope.none)
    }

    private singleton(): WithScope<T> {
        return this.within(scope.hierarchy)
    }

    private instancePerContainer(): WithScope<T> {
        return this.within(scope.container)
    }

    private ownedBy(owner: Owner): void {
        this._base.owner = owner
    }

    private ownedInternally(): void {
        this.ownedBy(owner.container)
    }

    private ownedExternally(): void {
        this.ownedBy(owner.externals)
    }

    private initializeBy(action: IInitializer<T>): WithInitializeBy<T> {
        (this._base.initializer as IInitializer<T> | undefined) = action

        return {
            lazy: this.lazy,
            dispose : this.dispose,
            named : this.named,
            within : this.within,
            ownedBy : this.ownedBy,
            ownedInternally: this.ownedInternally,
            ownedExternally: this.ownedExternally,
            transient: this.transient,
            singleton: this.singleton,
            instancePerContainer: this.instancePerContainer
        }
    }

    private dispose(action: IDisposer<T>): WithLazy<T> {
        (this._base.disposer as IDisposer<T> | undefined) = action

        return {
            named : this.named,
            within : this.within,
            ownedBy : this.ownedBy,
            ownedInternally: this.ownedInternally,
            ownedExternally: this.ownedExternally,
            transient: this.transient,
            singleton: this.singleton,
            instancePerContainer: this.instancePerContainer
        }
    }

    private lazy(): WithLazy<T> {
        this._base.isLazy = true

        return {
            named : this.named,
            within : this.within,
            ownedBy : this.ownedBy,
            ownedInternally: this.ownedInternally,
            ownedExternally: this.ownedExternally,
            transient: this.transient,
            singleton: this.singleton,
            instancePerContainer: this.instancePerContainer
        }
    }
}
