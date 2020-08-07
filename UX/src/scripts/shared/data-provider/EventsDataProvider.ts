import { StringHelpers } from '../Utilities/StringHelpers';
import { LiveDataProvider } from './LiveDataProvider';
import { ILogItem } from '../Utilities/LogBufferManager';
import { TelemetryFactory } from '../TelemetryFactory';
import { TelemetryMainArea } from '../Telemetry';

/**
 * Handle the continue tokens of the kubeapi (wrapper around LiveDataProvider itself which knows how to make single
 * one off requests against the kubeapi proxy)
 */
export class EventsDataProvider {
    private _liveDataProvider: LiveDataProvider;
    private _events: ILogItem[] = [];

    private _namespace: string;
    private _fieldSelectors: string;

    private _enacted: boolean = false;

    private _resolve: (data: ILogItem[]) => void;
    private _reject: (err: Error) => void;

    /**
     * ctor() 
     * @param kubernetesProvider live data provider which understands how to make requests against kubeapi proxy
     */
    constructor(kubernetesProvider: LiveDataProvider) {
        this._liveDataProvider = kubernetesProvider;
    }

    /**
     * begin a request to retrieve events
     * @param namespace name of cluster
     */
    public start(namespace: string, fieldSelectors: string): Promise<ILogItem[]> {
        if (this._enacted) {
            throw new Error('Start called twice before finalize in EventsDataProvider::start()');
        }

        this._enacted = true;
        this._namespace = namespace;
        this._fieldSelectors = fieldSelectors;

        return new Promise<ILogItem[]>((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;
            this.enact(null);
        });
    }

    /**
     * enact wrapper will invoke the proxy and utilize continue tokens if available
     * @param encodedContinueToken optionally the continue token from previous call
     */
    private enact(namespace: string, encodedContinueToken?: string): void {
        this._liveDataProvider.getLiveEvents(
            this._namespace,
            this._fieldSelectors,
            encodedContinueToken
        ).then((data) => {
            this._events = this._events.concat(data.formattedEventItems);

            if (!StringHelpers.isNullOrEmpty(data.encodedContinueToken)) {
                let telemetry = TelemetryFactory.get(TelemetryMainArea.Containers);
                telemetry.logEvent('ContinueToken', { location: 'EventsDataProvider.enact' }, null);
                this.enact(data.encodedContinueToken);
            } else {
                this.complete(null);
            }
        }).catch((error: Error) => {
            this.complete(error);
        });
    }

    /**
     * called when finally no continue tokens are provided to resolve the promise
     * @param error parameter which contains error information if promise failed
     */
    private complete(error: any) {
        this._enacted = false;
        this._namespace = null;

        if (error) {
            this._reject(error);
        } else {
            this._resolve(this._events);
        }

        this._resolve = null;
        this._reject = null;
        this._events = [];
    }
}
