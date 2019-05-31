import { Tap } from '@common/tap'
const tap = require('tap') as Tap
import typeioc,
    { IContainerBuilder, scope, owner, ApplicationError } from '@lib'
import {
    Test1Base,
    Test5,
} from '@data/base'

type Context = { builder: IContainerBuilder }

tap.beforeEach<Context>((done, setUp) => {
    setUp!.context.builder = typeioc.createBuilder()
    done()
})

tap.test<Context>('fluent api initialize by disposed named within owned by', (test) => {

    const { builder } = test.context

    builder.register<Test1Base>(Test1Base)
        .as(() => new Test5())
        .initializeBy((_c, item) => item)
        .dispose((item) => (item as Test5).dispose())
        .named('Some Name')
        .within(scope.hierarchy)
        .ownedBy(owner.container)

    test.done()
})

tap.test<Context>('fluent api as', (test) => {

    const { builder } = test.context

    const registration = builder.register<Test1Base>(Test1Base)
        .as(() => new Test5())

    test.notOk((registration as any).as)
    test.ok(registration.initializeBy)
    test.ok(registration.dispose)
    test.ok(registration.named)
    test.ok(registration.ownedBy)
    test.ok(registration.within)

    test.done()
})

tap.test<Context>('fluent api initialize by', (test) => {

    const { builder } = test.context

    const registration = builder.register<Test1Base>(Test1Base)
        .as(() => new Test5())
        .initializeBy((_c, item) => item)

    test.notOk((registration as any).as)
    test.notOk((registration as any).initializeBy)
    test.ok(registration.dispose)
    test.ok(registration.named)
    test.ok(registration.ownedBy)
    test.ok(registration.within)

    test.done()
})

tap.test<Context>('fluent api dispose', (test) => {

    const { builder } = test.context

    const registration = builder.register<Test1Base>(Test1Base)
        .as(() => new Test5())
        .dispose((item) => (item as Test5).dispose())

    test.notOk((registration as any).as)
    test.notOk((registration as any).initializeBy)
    test.notOk((registration as any).dispose)
    test.ok(registration.named)
    test.ok(registration.ownedBy)
    test.ok(registration.within)

    test.done()
})

tap.test<Context>('fluent api named', (test) => {

    const { builder } = test.context

    const registration = builder.register<Test1Base>(Test1Base)
        .as(() => new Test5())
        .named('Some Name')

    test.notOk((registration as any).as)
    test.notOk((registration as any).initializeBy)
    test.notOk((registration as any).dispose)
    test.notOk((registration as any).named)
    test.ok(registration.ownedBy)
    test.ok(registration.within)

    test.done()
})

tap.test<Context>('fluent api within', (test) => {

    const { builder } = test.context

    const registration = builder.register<Test1Base>(Test1Base)
        .as(() => new Test5())
        .within(scope.hierarchy)

    test.notOk((registration as any).as)
    test.notOk((registration as any).initializeBy)
    test.notOk((registration as any).dispose)
    test.notOk((registration as any).named)
    test.notOk((registration as any).within)
    test.ok(registration.ownedBy)

    test.done()
})

tap.test<Context>('factory not defined error when no factory provided', (test) => {

    const { builder } = test.context

    builder.register<Test1Base>(Test1Base)

    const delegate = () => builder.build()

    test.throws(delegate, new ApplicationError({
        message: 'Unknown registration type'
    }))

    test.done()
})
