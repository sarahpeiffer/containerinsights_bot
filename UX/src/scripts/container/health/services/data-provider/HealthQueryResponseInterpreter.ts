/** local */
import { IHealthModel } from '../../IHealthModel';
import { IMonitorStateTransition } from '../IMonitorStateTransition';

import { IHealthModelBuilder } from '../healthModel/HealthModelBuilder';
import { HealthDataProvider } from './HealthDataProvider';

/**
 * Specifies the index of the Health Monitor Query Result
 * index should match the index of respective kusto query projection column
 */
export enum HealthMonitorQueryResponseColumn {
    TimeGenerated = 0,
    MonitorTypeId = 1,
    MonitorSubjectId = 2,
    LastTransitionTime = 3, 
    OldState = 4, 
    NewState = 5, 
    Labels = 6, 
    Config = 7, 
    Details = 8
}

/**
 * provides functionality to convert Kusto query response to health model
 */
export interface IHealthQueryResponseInterpreter {
    /**
     * converts store query results for the latest health states of all cluster monitors
     * to health model representation
     * @param result results for the latest health states of all cluster monitors
     */
    processLatestHealthMonitorStatesQueryResult(result: any): IHealthModel;
}

/**
 * provides functionality to convert Kusto query response to health model
 */
export class HealthQueryResponseInterpreter implements IHealthQueryResponseInterpreter {
    /** health model builder */
    private modelBuilder: IHealthModelBuilder;

    /**
     * initializes a new instance of the class
     * @param modelBuilder health model builder
     */
    constructor(modelBuilder: IHealthModelBuilder) {
        if (!modelBuilder) { throw new Error('@modelBuilder may not be null at HealthQueryResponseInterpreter.ctor()')}
        this.modelBuilder = modelBuilder;
    }

    /**
     * converts store query results for the latest health states of all cluster monitors
     * to health model representation
     * @param result results for the latest health states of all cluster monitors
     */
    public processLatestHealthMonitorStatesQueryResult(result: any): IHealthModel {
        // result must have an array of tables
        const resultRows = this.getValidBaseResponse(result);

        if (!resultRows) {
            return null;
        }

        const objectList: IMonitorStateTransition[] = [];

        for (let i = 0; i < resultRows.length; i++) {
            // each row is an array of values for columns
            const resultRow = resultRows[i];
            const stateTransition: IMonitorStateTransition = {
                agentDateTimeUtc: resultRow[HealthMonitorQueryResponseColumn.TimeGenerated],
                monitorTypeId: resultRow[HealthMonitorQueryResponseColumn.MonitorTypeId],
                monitorSubjectId: resultRow[HealthMonitorQueryResponseColumn.MonitorSubjectId],
                oldState: HealthDataProvider.getMonitorState(resultRow[HealthMonitorQueryResponseColumn.OldState]),
                newState: HealthDataProvider.getMonitorState(resultRow[HealthMonitorQueryResponseColumn.NewState]),
                transitionDateTimeUtc: new Date(resultRow[HealthMonitorQueryResponseColumn.LastTransitionTime]),
                labels: resultRow[HealthMonitorQueryResponseColumn.Labels] 
                            ? JSON.parse(resultRow[HealthMonitorQueryResponseColumn.Labels])
                            : null,
                config: resultRow[HealthMonitorQueryResponseColumn.Config]
                            ? JSON.parse(resultRow[HealthMonitorQueryResponseColumn.Config])
                            : null,
                details: resultRow[HealthMonitorQueryResponseColumn.Details]
                            ? JSON.parse(resultRow[HealthMonitorQueryResponseColumn.Details])
                            : null
            }
            objectList.push(stateTransition);
        }

        return this.constructHealthModel(objectList);
    }

    /**
     * constructs the health model from the set of state transitions
     * @param stateTransitions set of health monitor signals
     */
    private constructHealthModel(stateTransitions: IMonitorStateTransition[]): IHealthModel {
        if (!stateTransitions) { return null; }

        this.modelBuilder.initialize();

        for (const stateTransition of stateTransitions) {
            this.modelBuilder.processStateTransition(stateTransition);
        }

        return this.modelBuilder.finalize();
    }

    /**
     * gets the health monitor data from the HTTP Response
     * @param result JSON response from Kusto Health Query
     */
    private getValidBaseResponse(result: any): any[] {
        if (!result || !result.tables || (result.tables.length === 0)) {
            return null;
        }

        // first table contains results in array of rows
        const resultRows = result.tables[0].rows;

        if (!resultRows || resultRows.length === 0) {
            return null;
        }

        return resultRows;
    }
}
