/** local */
import { IHealthMonitorSubject } from '../../IHealthMonitorSubject';
import { IHealthMonitorDefinition } from './IHealthMonitorDefinition';
import { IParentHealthMonitorTypeSelector } from './IParentMonitorTypeSelector';

/** 
 * defines functionality for parent health monitor id provider 
 */
export interface IParentHealthMonitorIdProvider {
    /**
     * gets parent monitor type id
     * @param monitorSubject child monitor subject
     */
    getParentTypeId(monitorSubject: IHealthMonitorSubject);

    /**
     * gets parent monitor subject id
     * @param monitorSubject child monitor subject
     */
    getParentSubjectId(monitorSubject: IHealthMonitorSubject);
}

/** 
 * provides functionality to calculate parent monitor id and subject id
 * for a given (child) health monitor
 */
export class ParentHealthMonitorIdProvider implements IParentHealthMonitorIdProvider {
    /** health model definition */
    private _healthModelDefinition: StringMap<IHealthMonitorDefinition>;

    /**
     * initializes a new instance of the class
     * @param healthModelDefinition health model definition
     */
    constructor(healthModelDefinition: StringMap<IHealthMonitorDefinition>) {
        if (!healthModelDefinition) {
            throw new Error(`@healthModelDefinition may not be null or empty at ParentMonitorIdProvider.ctor()`);
        }

        this._healthModelDefinition = healthModelDefinition;
    }

    /**
     * gets parent monitor type id
     * @param monitorSubject child monitor subject
     */
    public getParentTypeId(monitorSubject: IHealthMonitorSubject): string {
        if (!monitorSubject) {
            throw new Error(`@monitorSubject may not be null or empty at ParentMonitorIdProvider.getParentTypeId()`);
        }

        // find definition of this monitor in the model
        const definition = this._healthModelDefinition[monitorSubject.monitorTypeId];
        if (!definition) {
            throw new Error(`Monitor type '${monitorSubject.monitorTypeId}' is not found in the model definition`);
        }

        // see if parent monitor type is defined without any selectors
        // (simply a string providing the parent id)
        if (!(definition.parentMonitorTypeId instanceof Array)) {
            return definition.parentMonitorTypeId as string;
        }

        const parentMonitorTypeSelectors = definition.parentMonitorTypeId as Array<IParentHealthMonitorTypeSelector>;

        if (!parentMonitorTypeSelectors || !parentMonitorTypeSelectors.length) {
            throw new Error(`Monitor type '${monitorSubject.monitorTypeId}' has empty parent type selectors defined in the model`);
        }

        for (const selector of parentMonitorTypeSelectors) {
            // note: only '==' is supported as operator
            if (selector.operator !== '==') {
                throw new Error(`Monitor type '${monitorSubject.monitorTypeId}' uses unsupported operator `
                    + `'${selector.operator}'in parent selectors`);
            }

            if (monitorSubject.labels[selector.labelName] === selector.operand) {
                return selector.parentMonitorTypeId;
            }
        }

        return definition.defaultParentMonitorTypeId as string;

        // throw new Error(`Monitor type '${monitorSubject.monitorTypeId}' has no parent after evaluating all parent selectors`);
    }

    /**
     * gets parent monitor subject id
     * @param monitorSubject child monitor subject
     */
    public getParentSubjectId(monitorSubject: IHealthMonitorSubject): string {
        if (!monitorSubject) {
            throw new Error(`@monitorSubject may not be null or empty at ParentMonitorIdProvider.getParentSubjectId()`);
        }

        const parentTypeId = this.getParentTypeId(monitorSubject);

        if (!parentTypeId) {
            // this is top level monitor
            return null;
        }

        const parentMonitorDefinition = this._healthModelDefinition[parentTypeId];

        if (!parentMonitorDefinition) {
            throw new Error(`Monitor has defined parent type '${parentTypeId || '<null>'}' `
                + `but such monitor is not present in the model. Child monitor id: ${monitorSubject.monitorTypeId}`);
        }

        const keyLabels = this._healthModelDefinition[parentTypeId].keyLabels;
        if (!keyLabels) { return parentTypeId; }

        let parentSubjectId = parentTypeId;

        for (const labelName of keyLabels) {
            parentSubjectId += '-' + (monitorSubject.labels[labelName] || '');
        }

        return parentSubjectId;
    }
}
