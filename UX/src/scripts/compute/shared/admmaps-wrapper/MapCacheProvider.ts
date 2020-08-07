/**
 * Compute imports
 */
import { MapProviderV3 } from '../../data-provider/MapProviderV3';

/**
 * shared imports
 */
import { IWorkspaceInfo } from '../../../shared/IWorkspaceInfo';
import { StringMap } from '../../../shared/StringMap';
import { Promise } from 'es6-promise';

const cacheDurationSeconds: number = 300;

interface ICacheEntry {
    item: DependencyMap.SelectionContext;
    expireAt: number;
}

/**
 * Adds a cache for getMachine queries to make reloading the property panel fast and painless
 */
export class MapCacheProvider {
    private mapProvider: MapProviderV3;
    private privateCache: StringMap<ICacheEntry>;

    constructor(provider: MapProviderV3) {
        this.mapProvider = provider;
        this.privateCache = {};
    }


    /**
     * Strips the machineId from computerId and repasses the call to getMachine which
     * retrieves the Machine
     * @param  {string} workspaceId workaspace id
     * @param  {string} computerId computer id in the format:
     *    subscriptions/.../resourceGroups/.../providers/.../workspaces/.../features/serviceMap/machines/<machnieId>
     * @return {Promise<DependencyMap.SelectionContext>} a promise which resolves to map data
     * @memberof MapCacheProvider
     */
    public getMachineWithComputerId(workspace: IWorkspaceInfo, computerId: string, queryStartTime: Date, queryEndTime: Date)
        : Promise<DependencyMap.SelectionContext> {
        if (!computerId || computerId.length < 1) {
            return Promise.reject({ responseText: 'An invalid computer ID was specified.' });
        }

        const lastSlash = computerId.lastIndexOf('/');
        if (lastSlash === -1) {
            return Promise.reject({ responseText: 'An computer ID with invalid format was specified.' });
        }

        return this.getMachine(workspace, computerId.substr(lastSlash + 1), queryStartTime, queryEndTime);
    }

    /**
     * Wrapper around getMachine which will cache responses from getMachine and handle parsing the information
     * into a format our application can understand.
     * @param workspaceId the workspace id that resource is in
     * @param machineId The machine id is the last string in the slash separated computer id like:
     *        subscriptions/.../resourceGroups/.../providers/.../workspaces/.../features/serviceMap/machines/<machnieId>
     * @returns {Promise<DependencyMap.SelectionContext>} a promise which resolves (hopefully) to useful maps data
     */
    public getMachine(workspace: IWorkspaceInfo, machineId: string, queryStartTime: Date, queryEndTime: Date)
        : Promise<DependencyMap.SelectionContext> {

        if (!machineId || machineId.length < 1) {
            return Promise.reject({ responseText: 'An invalid resource ID was specified.' });
        }

        const hash = `${machineId}\n${workspace && workspace.id}`;

        const cachedEntry = this.privateCache[hash];
        const now = (new Date()).getTime();
        if (cachedEntry && cachedEntry.expireAt > now) {
            return Promise.resolve(this.privateCache[hash].item);
        }
        return this.mapProvider.getMachine(workspace, machineId, queryStartTime, queryEndTime)
            .then((machine: any) => {
                const returnObject: DependencyMap.SelectionContext = {
                    entity: DependencyMap.AdmViewModelFactory.createFromArmEntity(machine) as DependencyMap.Machine,
                    edge: null,
                    nodes: [DependencyMap.AdmViewModelFactory.createFromArmEntity(machine) as DependencyMap.Machine]
                };
                const expireAt = (new Date()).getTime() + (cacheDurationSeconds * 1000);
                this.privateCache[hash] = { item: returnObject, expireAt };

                return returnObject;
            });
    }
}
