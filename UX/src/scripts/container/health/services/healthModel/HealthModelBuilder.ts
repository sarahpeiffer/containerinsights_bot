/** tpl */
import findIndex = require('array.prototype.findindex');

/** local */
import { IMonitorStateTransition } from '../IMonitorStateTransition';
import { IHealthModel } from '../../IHealthModel';
import { IHealthMonitor } from '../../IHealthMonitor';
import { IParentHealthMonitorIdProvider } from './ParentHealthMonitorIdProvider';
import { HealthState } from '../../HealthState';
import { IHealthMonitorSubject } from '../../IHealthMonitorSubject';
import { HealthDataProvider } from '../data-provider/HealthDataProvider';

/** defines health model builder functionality */
export interface IHealthModelBuilder {
    /**
     * prepares model builder for state transition processing
     */
    initialize(): void;

    /** 
     * processes state transition obtained from the store 
     * @param stateTransition health monitor state transition
     */
    processStateTransition(stateTransition: IMonitorStateTransition): void;

    /**
     * finishes processing state transitions and finalizes the model
     * @returns health model
     */
    finalize(): IHealthModel;
}

/**
 * provides health model builder implementation
 */
export class HealthModelBuilder implements IHealthModelBuilder {
    /** parent monitor id provider */
    private _parentMonitorIdProvider: IParentHealthMonitorIdProvider;

    /** monitors - members of the health model */
    private _monitors: StringMap<IHealthMonitor>;

    /** pending monitors not yet associated to parents */
    private _pendingMembers: StringMap<string[]>;

    /** top level monitor subject id */
    private _topLevelMonitorSubjectId: string;

    /**
     * initializes a new instance of the class
     * @param parentMonitorIdProvider parent monitor id provider for model construction
     */
    constructor(parentMonitorIdProvider: IParentHealthMonitorIdProvider) {
        if (!parentMonitorIdProvider) {
            throw new Error(`@parentMonitorIdProvider may not be null or empty at HealthModelBuilder.ctor()`);
        }

        this._parentMonitorIdProvider = parentMonitorIdProvider;
        this._monitors = {};
        this._pendingMembers = {};
        this._topLevelMonitorSubjectId = null;
    }

    /**
     * prepares model builder for state transition processing
     */
    public initialize(): void {
        this._monitors = {};
        this._pendingMembers = {};
        this._topLevelMonitorSubjectId = null;
    }

    /** 
     * processes state transition obtained from the store 
     * @param stateTransition health monitor state transition
     */
    public processStateTransition(stateTransition: IMonitorStateTransition): void {
        if (!stateTransition) {
            throw new Error(`@stateTransition may not be null or empty at HealthModelBuilder.processStateTransition()`);
        }

        if (this._monitors.hasOwnProperty(stateTransition.monitorSubjectId)) {
            throw new Error(`Duplicate state transition processed for monitor type ` 
                          + `'${stateTransition.monitorTypeId}' subject '${stateTransition.monitorSubjectId}'`);
        }

        const monitor = this.createMonitor(stateTransition);
        this.mergePendingMembers(monitor);

        this._monitors[stateTransition.monitorSubjectId] = monitor;
        
        const parentSubjectId = this._parentMonitorIdProvider.getParentSubjectId({
            monitorTypeId: monitor.typeId,
            labels: monitor.labels
        });

        if (parentSubjectId) {
            this.addMember(parentSubjectId, monitor.subjectId);
        } else {
            // looks like this is top level monitor
            if (this._topLevelMonitorSubjectId) {
                throw new Error(`Duplicate top-level monitor found. ${this._topLevelMonitorSubjectId} and ` 
                              + `${monitor.subjectId} have no parent defined`);
            }
            this._topLevelMonitorSubjectId = monitor.subjectId;
        }
    }

    /**
     * finishes processing state transitions and finalizes the model
     * @returns health model
     */
    public finalize(): IHealthModel {
        if (!this._topLevelMonitorSubjectId) {
            throw new Error(`No top-level monitor found for the model`);
        }

        this.mergePendingMemberMonitors();
        this.eliminateNoneStateMonitors();
        const errors = this.checkForErrors();

        return {
            monitors: this._monitors,
            topLevelMonitorSubjectId: this._topLevelMonitorSubjectId,
            errors: errors
        }
    }

    /**
     * checks model for errors
     * @returns an array of errors in the model such as 
     *          member monitor without parent, parent monitor details
     *          having member list & states that does not match actual
     *          member list/state, etc
     */
    private checkForErrors(): string[] {
        return this.checkForOrphanedMemberMonitors().concat(
               this.checkForParentStateInconsistencies());
    }

     /**
     * checks model to see if any member monitors do not have parents
     * @returns an array of error descriptions for orphan monitors
     */
    private checkForOrphanedMemberMonitors(): string[] {
        const errors: string[] = [];

        if (this._pendingMembers) {
            for (const parentMonitorSubjectId in this._pendingMembers) {
                if (this._pendingMembers.hasOwnProperty(parentMonitorSubjectId)) {
                    const orphanMemberMonitorSubjectIds = this._pendingMembers[parentMonitorSubjectId].join(',');

                    // monitor has state transition event but parent monitor does not have any state transition
                    const error = `No parent state transition exists for monitor subject id ${orphanMemberMonitorSubjectIds}`;
                    errors.push(error);

                    console.warn(`HEALTH_MODEL consistency error: ${error}`);
                }
            }
        }

        return errors;
    }

     /**
     * checks model to see if state is inconsistent when comparing 
     * parent monitor details to its member monitor actual states
     * @returns an array of error descriptions for inconsistent state monitors
     */
    private checkForParentStateInconsistencies(): string[] {
        const errors: string[] = [];

        // check each monitor that has members
        for (const parentMonitorSubjectId in this._monitors) {
            if (!this._monitors.hasOwnProperty(parentMonitorSubjectId)) { continue; }

            const parentMonitor = this._monitors[parentMonitorSubjectId];
            if (!parentMonitor.memberSubjectIds || (parentMonitor.memberSubjectIds.length <= 0)) { continue; }

            const parentMonitorDetails = parentMonitor.details;
            if (!parentMonitorDetails || !parentMonitorDetails.details) {
                const error = `Parent monitor ${parentMonitorSubjectId} missing member monitor state map in details.details property`;
                errors.push(error);

                console.warn(`HEALTH_MODEL consistency error: ${error}`);
                continue;
            }

            const memberMonitorStateMap = parentMonitorDetails.details;

            // check each member monitor is present with some state
            for (const memberMonitorSubjectId of parentMonitor.memberSubjectIds) {
                let isFoundInDetails: boolean = false;

                for (const status in memberMonitorStateMap) {
                    if (!memberMonitorStateMap.hasOwnProperty(status)) { continue; }

                    const memberMonitorSubjectIdsInDetails = memberMonitorStateMap[status];
                    if (!memberMonitorSubjectIdsInDetails || (memberMonitorSubjectIdsInDetails.length <= 0)) { continue; }

                    const memberIndex = findIndex(memberMonitorSubjectIdsInDetails, (memberMonitorIdInDetails: string) => {
                        return (memberMonitorIdInDetails === memberMonitorSubjectId); });

                    if (memberIndex >= 0) {
                        isFoundInDetails = true;
                        break;
                    }
                }

                if (!isFoundInDetails) {
                    const error = `Parent monitor ${parentMonitorSubjectId} does not reference member monitor ${memberMonitorSubjectId} `
                                + `in its details`;
                    errors.push(error);

                    console.warn(`HEALTH_MODEL consistency error: ${error}`);
                }
            }

            // get list of monitors having certain state as stored in details of the parent
            for (const status in memberMonitorStateMap) {
                if (!memberMonitorStateMap.hasOwnProperty(status)) { continue; }

                const memberMonitorStateInDetails = HealthDataProvider.getMonitorState(status);

                const memberMonitorSubjectIds = memberMonitorStateMap[status];
                if (!memberMonitorSubjectIds || (memberMonitorSubjectIds.length <= 0)) { continue; }

                // for each monitor in this state as per details check actual monitor state matches
                for (const memberMonitorSubjectId of memberMonitorSubjectIds) {
                    const memberMonitor = this._monitors[memberMonitorSubjectId];
                    if (!memberMonitor) {
                        const error = `Parent monitor ${parentMonitorSubjectId} references member monitor ${memberMonitorSubjectId} `
                                    + `in details of state transition but no state transition is present for the member monitor`;
                        errors.push(error);

                        console.warn(`HEALTH_MODEL consistency error: ${error}`);
                        continue;
                    }

                    const memberMonitorState = memberMonitor.state;

                    if (memberMonitorState !== memberMonitorStateInDetails) {
                        const error = `Parent monitor ${parentMonitorSubjectId} member monitor ${memberMonitorSubjectId} ` 
                                    + `state mismatch. State in parent details '${HealthState[memberMonitorStateInDetails]}', `
                                    + `actual member state '${HealthState[memberMonitorState]}'`;
                        errors.push(error);

                        console.warn(`HEALTH_MODEL consistency error: ${error}`);
                    }
                }
            }
        }

        return errors;
    }

    /**
     * merges 'pending' member monitors into their parent monitors
     */
    private mergePendingMemberMonitors(): void {
        if (this._pendingMembers) {
            let pendingMembers: string[] = [];

            for (const monitorSubjectId in this._pendingMembers) {
                if (this._pendingMembers.hasOwnProperty(monitorSubjectId)) {
                    pendingMembers = pendingMembers.concat(this._pendingMembers[monitorSubjectId]);
                }
            }
        }
    }

    /**
     * drops monitors in state "none" if all child monitors all levels down are also in "none" state
     */
    private eliminateNoneStateMonitors(): void {
        // start with top level monitor
        let monitorSubjectIdList: string[] = [this._topLevelMonitorSubjectId];

        while (monitorSubjectIdList.length > 0) {
            const monitorSubjectId = monitorSubjectIdList.shift();
            const monitor = this._monitors[monitorSubjectId];

            // do not eliminate unit monitors
            if (!monitor.memberSubjectIds || (monitor.memberSubjectIds.length === 0)) { continue; }

            const canEliminate = this.canEliminateNoneStateSubtree(monitorSubjectId);

            if (canEliminate) {
                console.warn(`Eliminating health subtree staring with ${monitorSubjectId} due to 'none' state`);
                this.removeFromModel(monitorSubjectId);
            } else {
                monitorSubjectIdList = monitorSubjectIdList.concat(monitor.memberSubjectIds);
            }
        }
    }

    /**
     * Checks to see if given monitor can be dropped from model because
     * entire subtree starting with it is in "none" state
     * @param monitorSubjectId monitor subject id
     */
    private canEliminateNoneStateSubtree(monitorSubjectId: string): boolean {
        const monitor = this._monitors[monitorSubjectId];

        if (monitor.state !== HealthState.None) { return false; }

        if (!monitor.memberSubjectIds || (monitor.memberSubjectIds.length === 0)) {
            return monitor.state === HealthState.None ? true : false;
        }

        for (const monitorSubjectId of monitor.memberSubjectIds) {
            if (!this.canEliminateNoneStateSubtree(monitorSubjectId)) {
                return false;
            }
        }

        return true;
    }

    /**
     * removes monitor from model
     * @param monitorSubjectId monitor subject id
     */
    private removeFromModel(monitorSubjectId: string): void {
        const monitorSubject: IHealthMonitorSubject = {
            monitorTypeId: this._monitors[monitorSubjectId].typeId,
            labels: this._monitors[monitorSubjectId].labels
        };

        const parentSubjectId = this._parentMonitorIdProvider.getParentSubjectId(monitorSubject);

        // eliminate mention of the monitor being deleted from its parent agg monitor
        // TODO: Revise this logic when moving to on-agent generated details for agg monitor
        if (parentSubjectId) {
            this._monitors[parentSubjectId].memberSubjectIds = 
                this._monitors[parentSubjectId].memberSubjectIds.filter((memberSubjectId) => {
                    return memberSubjectId !== monitorSubjectId;
                });
        }

        // eliminate children
        const childSubjectIds = this._monitors[monitorSubjectId].memberSubjectIds;
        if (childSubjectIds && (childSubjectIds.length > 0)) {
            for (const childMonitorSubjectId of childSubjectIds) {
                this.removeFromModel(childMonitorSubjectId);
            }
        }

        delete this._monitors[monitorSubjectId];
    }

    /**
     * creates monitor object
     * @param stateTransition monitor state transition
     * @returns health monitor built using provided state transition event
     */
    private createMonitor(stateTransition: IMonitorStateTransition): IHealthMonitor {
        if (!stateTransition) {
            throw new Error(`@stateTransition may not be null or empty at HealthModelBuilder.createMonitor()`);
        }

        return {
            typeId: stateTransition.monitorTypeId,
            subjectId: stateTransition.monitorSubjectId,
            lastUpdatedDateTimeUtc: stateTransition.agentDateTimeUtc,
            firstObservedDateTimeUtc: stateTransition.transitionDateTimeUtc,
            state: stateTransition.newState,
            labels: stateTransition.labels,
            config: stateTransition.config,
            details: stateTransition.details,
            memberSubjectIds: []
        };
    }

    /**
     * adds member monitor to parent
     * @param parentSubjectId parent health monitor subject (instance) id
     * @param childSubjectId child (member) health monitor subject (instance) id
     */
    private addMember(parentSubjectId: string, childSubjectId: string): void {
        if (!parentSubjectId) {
            throw new Error(`@parentSubjectId may not be null or empty at HealthModelBuilder.addMember()`);
        }

        if (!childSubjectId) {
            throw new Error(`@childSubjectId may not be null or empty at HealthModelBuilder.addMember()`);
        }

        if (this._monitors.hasOwnProperty(parentSubjectId)) {
            if (!this._monitors[parentSubjectId].memberSubjectIds) {
                this._monitors[parentSubjectId].memberSubjectIds = [];
            }

            this._monitors[parentSubjectId].memberSubjectIds.push(childSubjectId);
        } else {
            // parent does not [yet] exist (no state transition was read for it) - store the link in pending
            if (!this._pendingMembers[parentSubjectId]) {
                this._pendingMembers[parentSubjectId] = [];
            }

            this._pendingMembers[parentSubjectId].push(childSubjectId);
        }
    }

    /**
     * merges pending child (member) monitors (if any) into 
     * newly constructed health monitor
     * @param monitor parent health monitor
     */
    private mergePendingMembers(monitor: IHealthMonitor): void {
        if (!monitor) {
            throw new Error(`@monitor may not be null or empty at HealthModelBuilder.mergePendingMembers()`);
        }

        if (!this._pendingMembers.hasOwnProperty(monitor.subjectId)) { return; }

        monitor.memberSubjectIds = monitor.memberSubjectIds.concat(this._pendingMembers[monitor.subjectId]);

        delete this._pendingMembers[monitor.subjectId];
    }
}
