/** local */
import { HealthState } from '../HealthState';
import { IHealthModel } from '../IHealthModel';
import { IHealthMonitor } from '../IHealthMonitor';
import { IHealthMonitorService } from './HealthMonitorService';

/**
 * defines functionality of monitor tree service
 */
export interface IHealthMonitorTreeService {
    /**
     * get a value indicating whether monitor is expanded in the tree
     * @param monitorIdentifier monitor id
     */
    isExpanded(monitorIdentifier: string): boolean;

    /**
     * toggles expanded status of the monitor
     * @param monitorIdentifier monitor id
     */
    toggleExpand(monitorIdentifier: string): void;
}

/**
 * implements monitor tree service
 */
export class HealthMonitorTreeService implements IHealthMonitorTreeService {
    /** map of monitors (by subject id) that are expanded in the tree */
    private _expandedMonitors: StringMap<boolean>;

    /**
     * initializes a new instance of the class
     * @param healthModel health model
     */
    public constructor(healthModel: IHealthModel, private healthMonitorService: IHealthMonitorService) {
        this.hackRemoveWorkloads(healthModel);

        this._expandedMonitors = this.getDefaultExpandedMonitors(healthModel);
    }

    /**
     * get a value indicating whether monitor is expanded in the tree
     * @param monitorIdentifier monitor id
     */
    public isExpanded(monitorIdentifier: string): boolean {
        if (!monitorIdentifier) {
            throw new Error(`@monitorIdentifier may not be null at HealthMonitorService.isExpanded()`);
        }

        return (this._expandedMonitors.hasOwnProperty(monitorIdentifier) && !!this._expandedMonitors[monitorIdentifier]);
    }

    /**
     * toggles expanded status of the monitor
     * @param monitorIdentifier monitor id
     */
    public toggleExpand(monitorIdentifier: string): void {
        if (!monitorIdentifier) {
            throw new Error(`@monitorIdentifier may not be null at HealthMonitorService.toggleExpand()`);
        }

        const currentState = this._expandedMonitors[monitorIdentifier];
        this._expandedMonitors[monitorIdentifier] = currentState === null ? true : !currentState;
    }

    /**
     * calculates initial set of monitors auto-expanded when tree is first visualized
     * @param healthModel health model
     * @returns map of monitor ids to be expanded by default
     */
    private getDefaultExpandedMonitors(healthModel: IHealthModel): StringMap<boolean> {
        if (!healthModel) { return {}; }

        const expandedMonitors: StringMap<boolean> = {};

        const rootMonitor = healthModel.monitors[healthModel.topLevelMonitorSubjectId];
        const aspectMonitors = rootMonitor.memberSubjectIds.map((aspectMonitor) => healthModel.monitors[aspectMonitor]);

        expandedMonitors[healthModel.topLevelMonitorSubjectId] = true;

        aspectMonitors.forEach((aspectMonitor) => {
            expandedMonitors[aspectMonitor.subjectId] = true;

            let monitorQueue = aspectMonitor.memberSubjectIds.map((monitor) => healthModel.monitors[monitor]);

            while (!!monitorQueue) {
                let badMonitorCount = 0;
                let badMonitorTarget: IHealthMonitor = null;

                monitorQueue.forEach((monitor) => {
                    const isInBadState = (monitor.state !== HealthState.Healthy) && (monitor.state !== HealthState.None);
                    if (isInBadState) {
                        badMonitorCount += 1;
                        badMonitorTarget = monitor;
                    }
                });

                if (badMonitorCount !== 1) { return; }

                expandedMonitors[badMonitorTarget.subjectId] = true;

                monitorQueue = null;

                if (!!badMonitorTarget.memberSubjectIds && badMonitorTarget.memberSubjectIds.length > 0) {
                    monitorQueue = badMonitorTarget.memberSubjectIds.map((monitor) => healthModel.monitors[monitor]);
                }
            }
        });

        for (const monitorIdentifier in healthModel.monitors) {
            if (expandedMonitors.hasOwnProperty(monitorIdentifier)) { continue; }

            expandedMonitors[monitorIdentifier] = false;
        }

        return expandedMonitors;
    }

    private hackRemoveWorkloads(healthModel: IHealthModel) {
        const rootId = healthModel.topLevelMonitorSubjectId;
        const rootMonitor = healthModel.monitors[rootId];

        let index = -1;

        rootMonitor.memberSubjectIds.forEach((monitor, localIndex) => {
            if (monitor === 'all_workloads') { index = localIndex; }
        });

        if (index < 0) { return; }

        rootMonitor.memberSubjectIds.splice(index, 1);

        if (rootMonitor.memberSubjectIds.length !== 2) { return; }

        let left = this.healthMonitorService.getMonitor(rootMonitor.memberSubjectIds[0]);
        const right = this.healthMonitorService.getMonitor(rootMonitor.memberSubjectIds[1]);

        if (!this.healthMonitorService.isWorse(left.state, right.state)) {
            left = right;
        }

        rootMonitor.state = left.state;
    }
}
