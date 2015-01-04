/*---------------------------------------------------------------------------------------------------
 * Copyright (c) 2014 Maxim Gherman
 * typeioc - Dependency injection container for node typescript
 * @version v1.2.6
 * @link https://github.com/maxgherman/TypeIOC
 * @license (MIT) - https://github.com/maxgherman/TypeIOC/blob/master/LICENSE
 * --------------------------------------------------------------------------------------------------*/

/// <reference path="../../d.ts/typeioc.internal.d.ts" />

'use strict';

import Exceptions = require('../exceptions/index');


export class Container implements Typeioc.Internal.IContainer {

    private _container : Typeioc.Internal.IContainer;

    constructor(private _registrationStorageService : Typeioc.Internal.IRegistrationStorageService,
                private _disposableStorageService : Typeioc.Internal.IIDisposableStorageService,
                private _registrationBaseService : Typeioc.Internal.IRegistrationBaseService,
                private _containerApiService : Typeioc.Internal.IContainerApiService,
                container? : Typeioc.Internal.IContainer) {

        this._container = container ||
            new InternalContainer(
            _registrationStorageService,
            _disposableStorageService ,
            _registrationBaseService,
            _containerApiService
        );
    }

    public add(registrations : Typeioc.Internal.IRegistrationBase[]) : void {
        this._container.add(registrations);
    }

    public createChild() : Typeioc.IContainer {

        return new Container(this._registrationStorageService,
            this._disposableStorageService ,
            this._registrationBaseService,
            this._containerApiService,
            <Typeioc.Internal.IContainer>this._container.createChild());
    }

    public dispose() : void {
        this._container.dispose();
    }

    public resolve<R>(service: any, ...args:any[]) : R {

        if(!service)
            throw new Exceptions.ArgumentNullError("service");

        args = flattenArgs([service], args);

        return this._container.resolve.apply(this._container, args);
    }

    public tryResolve<R>(service: any, ...args:any[]) : R {

        if(!service)
            throw new Exceptions.ArgumentNullError("service");

        args = flattenArgs([service], args);

        return this._container.tryResolve.apply(this._container, args);
    }

    public resolveNamed<R>(service: any, name : string, ...args:any[]) : R {

        if(!service)
            throw new Exceptions.ArgumentNullError("service");

        args = flattenArgs([service, name], args);

        return this._container.resolveNamed.apply(this._container, args);
    }

    public tryResolveNamed<R>(service: any, name : string, ...args:any[]) : R {

        if(!service)
            throw new Exceptions.ArgumentNullError("service");

        args = flattenArgs([service, name], args);

        return this._container.tryResolveNamed.apply(this._container, args);
    }

    public resolveWithDependencies<R>(service: any, dependencies : Typeioc.IDynamicDependency[]) : R {

        if(!service)
            throw new Exceptions.ArgumentNullError("service");

        if(!dependencies || dependencies.length <= 0)
            throw new Exceptions.ResolutionError('No dependencies provided');

        return this._container.resolveWithDependencies<R>(service, dependencies);
    }

    public resolveWith<R>(service : any) : Typeioc.IResolveWith<R> {

        if(!service)
            throw new Exceptions.ArgumentNullError("service");

        return this._container.resolveWith<R>(service);
    }
}

class InternalContainer implements Typeioc.Internal.IContainer {

    private parent : InternalContainer ;
    private children : InternalContainer [] = [];
    private _disposableStorage : Typeioc.Internal.IDisposableStorage;
    private _collection : Typeioc.Internal.IRegistrationStorage;

    constructor(private _registrationStorageService : Typeioc.Internal.IRegistrationStorageService,
                private _disposableStorageService : Typeioc.Internal.IIDisposableStorageService,
                private _registrationBaseService : Typeioc.Internal.IRegistrationBaseService,
                private _containerApiService : Typeioc.Internal.IContainerApiService) {

        this._collection = this._registrationStorageService.create();
        this._disposableStorage = this._disposableStorageService.create();
    }

    public add(registrations : Typeioc.Internal.IRegistrationBase[]) {

        registrations.forEach(this.registerImpl.bind(this));
    }

    public createChild() : Typeioc.IContainer {

        var child = new InternalContainer (
            this._registrationStorageService,
            this._disposableStorageService,
            this._registrationBaseService,
            this._containerApiService);
        child.parent = this;
        this.children.push(child);
        return child;
    }

    public dispose() : void {

        this._disposableStorage.disposeItems();

        while(this.children.length > 0) {
            var item = this.children.pop();
            item.dispose();
        }
    }

    public resolve<R>(service: any, ...args:any[]) : R {
        var rego = this.createRegistration(service);
        rego.args = args;

        return this.resolveBase(rego, true);
    }

    public tryResolve<R>(service: any, ...args:any[]) : R {
        var rego = this.createRegistration(service);
        rego.args = args;

        return this.resolveBase(rego, false);
    }

    public resolveNamed<R>(service: any, name : string, ...args:any[]) : R {
        var rego = this.createRegistration(service);
        rego.name = name;
        rego.args = args;

        return this.resolveBase(rego, true);
    }

    public tryResolveNamed<R>(service: any, name : string, ...args:any[]) : R {
        var rego = this.createRegistration(service);
        rego.name = name;
        rego.args = args;

        return this.resolveBase(rego, false);
    }

    public resolveWithDependencies<R>(service: any, dependencies : Typeioc.IDynamicDependency[]) : R {

        var api = this._containerApiService.create<R>(undefined);
        api.service(service)
           .dependencies(dependencies);

        return this.resolveWithDepBase<R>(api);
    }

    public resolveWith<R>(service : any) : Typeioc.IResolveWith<R> {

        var importApi : Typeioc.Internal.IImportApi<R> = {
            execute : function(api : Typeioc.Internal.IContainerApi<R>) : R {

                if(api.isDependenciesResolvable) {
                    return this.resolveWithDepBase(api);
                } else {
                    var rego = this.createRegistration(api.service);
                    rego.name = api.nameValue;
                    rego.args = api.argsValue;

                    return this.resolveBase(rego, api.throwResolveError);
                }
            }
        }

        var api = this._containerApiService.create<R>(importApi);

        return api.service(service);
    }

    private registerImpl(registration : Typeioc.Internal.IRegistrationBase) : void {

        if(!registration.factory){
            var exception = new Exceptions.ArgumentNullError("Factory is not defined");
            exception.data = registration.service;
            throw exception;
        }

        registration.container = this;

        this._collection.addEntry(registration);
    }

    private resolveBase(registration : Typeioc.Internal.IRegistrationBase, throwIfNotFound : boolean) : any {

        var entry = this.resolveImpl(registration, throwIfNotFound);

        if(!entry && throwIfNotFound === false) return null;
        entry.args = registration.args;

        return this.resolveScope(entry, throwIfNotFound);
    }

    private resolveImpl(registration : Typeioc.Internal.IRegistrationBase, throwIfNotFound : boolean) : Typeioc.Internal.IRegistrationBase {

        var serviceEntry = this._collection.getEntry(registration);

        if(!serviceEntry  && this.parent) {
            return this.parent.resolveImpl(registration, throwIfNotFound);
        }

        if(!serviceEntry  && throwIfNotFound === true) {
            var exception = new Exceptions.ResolutionError('Could not resolve service');
            exception.data = registration.service;
            throw exception;
        }

        return serviceEntry;
    }

    private resolveScope(registration : Typeioc.Internal.IRegistrationBase,
                          throwIfNotFound : boolean) : any {

        switch(registration.scope) {
            case Typeioc.Types.Scope.None:
                return this.createTrackable(registration);

            case Typeioc.Types.Scope.Container:

                return this.resolveContainerScope(registration);

            case Typeioc.Types.Scope.Hierarchy :

                return this.resolveHierarchyScope(registration, throwIfNotFound);

            default:
                throw new Exceptions.ResolutionError('Unknown scoping');
        }
    }

    private resolveContainerScope(registration : Typeioc.Internal.IRegistrationBase) : any {
        var entry : Typeioc.Internal.IRegistrationBase;

        if(registration.container !== this) {
            entry = registration.cloneFor(this);
            this._collection.addEntry(entry);
        } else {
            entry = registration;
        }

        if(!entry.instance) {
            entry.instance = this.createTrackable(entry);
        }

        return entry.instance;
    }

    private resolveHierarchyScope(registration : Typeioc.Internal.IRegistrationBase, throwIfNotFound : boolean) : any {
        if(registration.container &&
            registration.container !== this) {

            var container = <InternalContainer>registration.container;

            return container.resolveBase(registration, throwIfNotFound);
        }

        if(!registration.instance) {

            registration.instance = this.createTrackable(registration);
        }

        return registration.instance;
    }

    private createTrackable(registration : Typeioc.Internal.IRegistrationBase) : any {

        var instance = registration.invoker();

        if(registration.owner === Typeioc.Types.Owner.Container &&
            registration.disposer) {

            this._disposableStorage.add(instance, registration.disposer);
        }

        if(registration.initializer) {
            registration.initializer(this, instance);
        }

        return instance;
    }

    private createRegistration(service: any) : Typeioc.Internal.IRegistrationBase {
        return this._registrationBaseService.create(service);
    }

    private createDependenciesRegistration<R>(api : Typeioc.Internal.IContainerApi<R>)
        : Array<Typeioc.Internal.IRegistrationBase> {

        var items = api.dependenciesValue.map(dependency => {

            if(!dependency.service) {
                var exception = new Exceptions.ResolutionError('Service is not defined');
                exception.data = dependency;
                throw exception;
            }

            if(!dependency.factory) {
                var exception = new Exceptions.ResolutionError('Factory is not defined');
                exception.data = dependency;
                throw exception;
            }

            var registration = this.createRegistration(dependency.service);
            registration.factory = dependency.factory;
            registration.args = dependency.args || [];
            registration.name = dependency.named;

            return {
                implementation : this.resolveImpl(registration, api.throwResolveError),
                dependency : dependency
            };
        })
        .filter(item => item.implementation ? true : false);

        if(items.length !== api.dependenciesValue.length) return [];

        return items.map(item => {
            var baseRegistration = item.implementation.cloneFor(this);
            baseRegistration.factory = item.dependency.factory;
            baseRegistration.name = item.dependency.named;
            baseRegistration.args = item.dependency.args;
            baseRegistration.initializer = item.dependency.initializer;
            baseRegistration.disposer = undefined;

            return baseRegistration;
        });
    }

    private resolveWithDepBase<R>(api : Typeioc.Internal.IContainerApi<R>) : R {
        var child = <InternalContainer>this.createChild();

        var registration = this.createRegistration(api.serviceValue);
        registration.args = api.argsValue;
        registration.name = api.nameValue;

        var implementation = this.resolveImpl(registration, api.throwResolveError);
        var baseRegistration = implementation.cloneFor(child);
        baseRegistration.args = api.argsValue;
        baseRegistration.name = api.nameValue;
        baseRegistration.disposer = undefined;

        var regoes = this.createDependenciesRegistration(api);

        if(regoes.length <= 0) return null;

        regoes.push(baseRegistration);

        child.add(regoes);

        return <R>child.resolveBase(baseRegistration, api.throwResolveError);
    }
}

function flattenArgs(args : any[], tailArgs : any[]) : any[] {

    args.push.apply(args, tailArgs);

    return args;
}