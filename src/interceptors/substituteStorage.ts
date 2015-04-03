
/// <reference path="../../d.ts/typeioc.internal.d.ts" />

'use strict';


import IIndex = Typeioc.Internal.IIndexedCollection;
import ISubstitute = Typeioc.Interceptors.ISubstitute;
import IList = Typeioc.Internal.IList;


export class SubstituteStorage implements Typeioc.Internal.Interceptors.IStorage {

    private _known : IIndex<IIndex<IList<ISubstitute>>>;
    private _unknown : IIndex<IList<ISubstitute>>;

    public get known() : IIndex<IIndex<IList<ISubstitute>>> {
        return this._known;
    }

    public get unknown() : IIndex<IList<ISubstitute>> {
        return this._unknown;
    }

    constructor() {
        this._known = {};
        this._unknown = {};
    }

    public add(value : ISubstitute) {

        var key = value.method;

        if(!key) {

            this.addToTypedStorage(this._unknown, value);
            return;
        }

        var item = this._known[key];

        if(!item) {
            item = {};
            this._known[key] = item;
        }

        this.addToTypedStorage(item, value);
    }

    public getKnownTypes(name : string) : Array<Typeioc.Interceptors.CallInfoType> {
        var item = this._known[name];

        if(!item) return [];

        return Object.getOwnPropertyNames(item).map(item => ~~item);
    }

    public getSubstitutes(name : string, types : Array<Typeioc.Interceptors.CallInfoType>) : Array<ISubstitute> {
        var item = this._known[name];

        if(!item) return [];

        var anySubstitute = item[Typeioc.Interceptors.CallInfoType.Any];
        if(anySubstitute) {
            anySubstitute = this.copySubstitute(anySubstitute, name);
        }

        return types.filter(type => type !== Typeioc.Interceptors.CallInfoType.Any)
            .map(type => {

                var result = item[type];

                if(anySubstitute) {
                    anySubstitute.tail.next = result.head;
                    anySubstitute.tail = result.tail;
                    result = anySubstitute;
                }

                var unknownSubstitute = this.getUnknownSubstitute(type, name);

                if(unknownSubstitute) {
                    unknownSubstitute.tail.next = result.head;
                    unknownSubstitute.tail = result.tail;
                    result = unknownSubstitute;
                }

                return result.head;
            });
    }

    private getUnknownSubstitute(type : Typeioc.Interceptors.CallInfoType, name : string) : IList<ISubstitute> {

        var typedSubstitute = this.unknown[type]

        if(typedSubstitute)
            typedSubstitute = this.copySubstitute(typedSubstitute, name);

        var anySubstitute = this.unknown[Typeioc.Interceptors.CallInfoType.Any];

        if(!anySubstitute) return typedSubstitute;

        anySubstitute = this.copySubstitute(anySubstitute, name);

        if(!typedSubstitute) return anySubstitute;

        anySubstitute.tail.next = typedSubstitute.head;
        anySubstitute.tail = typedSubstitute.tail;

        return anySubstitute;
    }

    private copySubstitute(list : IList<ISubstitute>, name : string) : IList<ISubstitute> {

        var result = {
            head : undefined,
            tail : undefined
        };
        var head = list.head;

        while(head) {

            var substitute = {
                method : head.method || name,
                type : head.type,
                wrapper : head.wrapper
            };

            if(!result.head) {
                result.head = substitute;
                result.tail = substitute;
            } else {
                result.tail.next = substitute;
                result.tail = result.tail.next;
            }

            head = head.next;
        }

        return result;
    }


    private addToTypedStorage(storage : IIndex<IList<ISubstitute>>, substitute : ISubstitute) {
        var item = storage[substitute.type];

        if(!item) {
            item = {
                head : substitute,
                tail : substitute
            };

            storage[substitute.type] = item;
        } else {
            item.tail.next = substitute;
            item.tail = item.tail.next;
        }
    }
}