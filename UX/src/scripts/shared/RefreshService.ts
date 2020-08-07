import * as uuid from 'uuid';

import { StringMap } from './StringMap';
import { StringHelpers } from './Utilities/StringHelpers';
import { DeferredPromise } from './DeferredPromise';

export type RefreshEventCallback = () => Promise<number>;

enum ThreadState {
    WaitingForTimer,
    InvokingCallback,
}

export interface RefreshRegistration {
    refreshIntervalId: string;
    systemId: any;
    durationMs: number;
    onRefresh: RefreshEventCallback;
    threadState: ThreadState;
}

export class RefreshService {
    private static __instance: RefreshService = null;

    private _refreshRegistrations: StringMap<RefreshRegistration> = {};

    private _deferredCancelledationPromise: StringMap<DeferredPromise<void>> =  {};

    public static Instance(): RefreshService {
        if (!RefreshService.__instance) {
            RefreshService.__instance = new RefreshService();
        }
        return RefreshService.__instance;
    }

    public registerRefreshInterval(durationMs: number, onRefresh: RefreshEventCallback, 
        triggerOnStart: boolean = false): RefreshRegistration {
        const refreshIntervalId: string = uuid();

        const refreshRegistration: RefreshRegistration = {
            systemId: null,
            refreshIntervalId,
            durationMs,
            onRefresh,
            threadState: ThreadState.WaitingForTimer
        };
        this._refreshRegistrations[refreshIntervalId] = refreshRegistration;


        if (triggerOnStart) {
            this._internalRefreshWrapper(refreshIntervalId);
        } else {
            this._refreshRegistrations[refreshIntervalId].systemId = setTimeout(() => {
                this._internalRefreshWrapper(refreshIntervalId);
            }, durationMs);
        }

        return refreshRegistration;
    }

    public cancelRegistration(refreshIntervalId: string): Promise<void> {
        this._checkRegistration(refreshIntervalId);

        if (this._deferredCancelledationPromise.hasOwnProperty(refreshIntervalId)) {
            return Promise.reject('Timer registration already set to cancel');
        }

        const refreshRegistration = this._refreshRegistrations[refreshIntervalId];

        if (refreshRegistration.threadState === ThreadState.WaitingForTimer) {
            clearInterval(refreshRegistration.systemId);
    
            delete this._refreshRegistrations[refreshIntervalId];
    
            return Promise.resolve();
        } else if (refreshRegistration.threadState === ThreadState.InvokingCallback) {
            this._deferredCancelledationPromise[refreshIntervalId] = new DeferredPromise();
            return this._deferredCancelledationPromise[refreshIntervalId].promise();
        } else {
            return Promise.reject('Invalid thread state while cancelling');
        }
    }

    private _checkRegistration(refreshIntervalId: string) {
        const registrationIds = Object.keys(this._refreshRegistrations);
        if (!StringHelpers.contains(registrationIds, refreshIntervalId)) {
            throw 'Attempted operation on a registration that doesnt exist!';
        }
    }

    private _internalRefreshWrapper(refreshIntervalId: string) {
        this._checkRegistration(refreshIntervalId);

        const registration = this._refreshRegistrations[refreshIntervalId];

        registration.threadState = ThreadState.InvokingCallback;
        registration.onRefresh().then((refreshDelay) => {

            if (this._deferredCancelledationPromise.hasOwnProperty(refreshIntervalId)) {
                console.log('DEFERED PROMISE CANCELLATION REQUESTED');
                delete this._refreshRegistrations[refreshIntervalId];

                this._deferredCancelledationPromise[refreshIntervalId].resolve(null);

                delete this._deferredCancelledationPromise[refreshIntervalId];
                return;
            }

            registration.threadState = ThreadState.WaitingForTimer;

            // bbax: allow the callback to delay the next timer refresh... for example if we need to wait
            // 3 seconds before the next grain point for a chart, the callback can return 3000 and we will
            // delay the next timeout call by 3 seconds before we start the real timer
            registration.systemId = setTimeout(() => {
                
                // bbax: any superfluous timeouts have expired, do a real time interval
                registration.systemId = setTimeout(() => {
                    this._internalRefreshWrapper(refreshIntervalId);
                }, registration.durationMs);
    
            }, refreshDelay);
        }).catch((err) => {
            console.error('Exception in refresh callback, shutting down timer', err);
            delete this._internalRefreshWrapper[refreshIntervalId];
        });
    }
}

