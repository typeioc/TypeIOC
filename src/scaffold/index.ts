import {
    InternalStorage, RegistrationStorage, DisposableStorage
} from '../storage'
import {
    RegistrationBase, IRegistrationBase, Registration, IRegistration
} from '../registration'
import {
    Container, IContainer,
    ImportApi, Api as ContainerApi,
    ContainerBuilder, IContainerBuilder,
    InternalContainer, IInternalContainer,
    Invoker, IInvoker,
    IContainerBuilderService,
    IInternalContainerService,
    IInternalStorageService,
    IRegistrationBaseService,
    IContainerService,
    IInstanceRegistrationService,
    IDecoratorApiService,
    IRegistrationStorageService,
    IDisposableStorageService,
    IContainerApiService,
    IInvokerService
 } from '../build'
import {
    Decorator,
    RegistrationApi as DecoratorRegistrationApi,
    ResolutionApi as DecoratorResolutionApi,
    IDecorator,
    IDecoratorResolutionCollection,
    IDecoratorRegistrationApi,
    IDecoratorResolutionApi,
    IDecoratorResolutionParamsData
 } from '../decorators'
import {
    IInterceptor,
    Decorator as InterceptorDecorator,
    Interceptor,
    Proxy
} from '../interceptors'
import { IEntryPoint } from './types'

export * from './types'

export class Scaffold implements IEntryPoint {

    public createBuilder(): IContainerBuilder {

        const internalContainerService = this.internalContainerService()
        return this.builderService().create(internalContainerService)
    }

    public createDecorator(): IDecorator {

        const decoratorRegistrationService = this.decoratorRegistrationApiService()
        const internalStorageService =
            this.internalStorageService<{}, IDecoratorResolutionCollection>()
        const internalContainerService = this.internalContainerService()

        return new Decorator(
            this.builderService(),
            internalContainerService,
            decoratorRegistrationService,
            internalStorageService)
    }

    public createInterceptor(): IInterceptor {

        const decorator = new InterceptorDecorator()
        const proxy = new Proxy(decorator)

        return new Interceptor(proxy)
    }

    private builderService(): IContainerBuilderService {

        return {
            create: (internalContainerService: IInternalContainerService) => {

                const baseRegistrationService = this.registrationBaseService()
                const instanceRegistrationService = this.instanceRegistrationService()

                const containerService = this.containerService()

                return new ContainerBuilder(
                    baseRegistrationService,
                    instanceRegistrationService,
                    internalContainerService,
                    containerService)
            }
        }
    }

    private internalStorageService<K, T>(): IInternalStorageService<K, T> {

        return {
            create() {
                return new InternalStorage<K, T>()
            }
        }
    }

    private registrationStorageService(): IRegistrationStorageService {

        const service = {
            create<R1, R2>() {
                return new InternalStorage<R1, R2>()
            }
        }

        return {
            create() {
                return new RegistrationStorage(service)
            }
        }
    }

    private disposableStorageService(): IDisposableStorageService {
        return {
            create() {
                return new DisposableStorage()
            }
        }
    }

    private registrationBaseService(): IRegistrationBaseService {
        return {
            create(service: {}) {
                return new RegistrationBase(service)
            }
        }
    }

    private containerService(): IContainerService {
        return {
            create: (container: IInternalContainer) => new Container(container)
        }
    }

    private containerApiService(): IContainerApiService {

        return {
            create: <R>(container: ImportApi<R>) => {
                return new ContainerApi(container)
            }
        }
    }

    private instanceRegistrationService(): IInstanceRegistrationService {
        return {
            create: <R>(baseRegistration: IRegistrationBase): IRegistration<R> => {
                return new Registration(baseRegistration)
            }
        }
    }

    private internalContainerService(): IInternalContainerService {

        const dependencies = () => {
            const registrationStorageService = this.registrationStorageService()
            const disposableStorageService = this.disposableStorageService()
            const baseRegistrationService = this.registrationBaseService()
            const containerApiService = this.containerApiService()
            const invokerService = this.invokerService()

            return {
                registrationStorageService,
                disposableStorageService,
                baseRegistrationService,
                containerApiService,
                invokerService
            }
        }

        return {

            create() {
                const params = dependencies()

                return new InternalContainer(
                    params.registrationStorageService,
                    params.disposableStorageService,
                    params.baseRegistrationService,
                    params.containerApiService,
                    params.invokerService,
                    this.resolutionDetails)
            }
        }
    }

    private invokerService(): IInvokerService {
        return {
            create(
                container: IContainer,
                resolutionDetails: IDecoratorResolutionParamsData): IInvoker {
                return new Invoker(container, resolutionDetails)
            }
        }
    }

    private decoratorRegistrationApiService(): IDecoratorApiService {
        return {
            createRegistration<R>(register :(api: IDecoratorRegistrationApi<R>) => ClassDecorator)
                                : IDecoratorRegistrationApi<R> {
                return new DecoratorRegistrationApi(register)
            },

            createResolution(resolve: (api: IDecoratorResolutionApi) => ParameterDecorator)
                : IDecoratorResolutionApi {

                return new DecoratorResolutionApi(resolve)
            }
        }
    }
}
