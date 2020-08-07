/** local */
import { IHealthMonitor } from '../../IHealthMonitor';
import { HealthMonitorDetailsViewModelBase } from './HealthMonitorDetailsViewModelBase';
import { IHealthServicesFactory } from '../../factories/HealthServicesFactory';
import { HealthMonitorDetailsContainerViewModel } from './HealthMonitorDetailsContainerViewModel';
import {
    IContainerCpuUtilizationDetails,
    IContainerCpuUtilizationDetailsObject,
    IContainerCpuUtilizationCpuUsageInstancesObject
} from './MonitorDetailsTypings';
import { KubeToCIHealthStateMap, HealthState } from '../../HealthState';
import { ContainerCpuUtilizationMonitorDetailsModel } from '../../models/monitorDetails/ContainerCpuUtilizationMonitorDetailsModel';
import { MetricValueFormatter } from '../../../../shared/MetricValueFormatter';
import moment = require('moment');

export interface IContainerCpuDetailsMonitorAccordionItemData {
    timestamp: string;
    state: HealthState;
    instances: IContainerCpuDetailsMonitorInstanceData[]
}

export interface IContainerCpuDetailsMonitorInstanceData {
    instanceName: string;
    usage: string; // 'req / limit (req / limit %)'
    state: HealthState;
}

/** View model for container CPU monitor details component */
export class ContainerCpuUtilizationMonitorDetailsViewModel extends HealthMonitorDetailsViewModelBase {
    private _model: ContainerCpuUtilizationMonitorDetailsModel;

    /** 
     * initializes an instance of the class
     * @param healthServicesFactory 
     * @param parentContext 
     * @param forceUpdate 
    */
    public constructor(
        healthServicesFactory: IHealthServicesFactory,
        parentContext: HealthMonitorDetailsContainerViewModel,
        forceUpdate: reactForceUpdateHandler
    ) {
        super(healthServicesFactory, parentContext, forceUpdate);
    }

    public getAccordionItemsData(): IContainerCpuDetailsMonitorAccordionItemData[] {
        const accordionItemsData: IContainerCpuDetailsMonitorAccordionItemData[] = [];

        this._model.details.forEach((detail: IContainerCpuUtilizationDetails, key: number) => {
            let details2: IContainerCpuUtilizationDetailsObject = detail.details;
            if (!details2) {
                throw new Error(
                    '@details2 may not not be null at ContainerCpuUtilizationMonitorDetailsViewModel.getAccordionItemsData()'
                );
            }

            // create the content undeneath each individual accordion
            const instancesData: IContainerCpuDetailsMonitorInstanceData[] = this.getInstancesData(details2);

            const accordionItemData: IContainerCpuDetailsMonitorAccordionItemData = {
                timestamp: moment(detail.timestamp).format('MM/DD/YY, h:mm:ss a') + ' (' + moment(detail.timestamp).fromNow() + ')',
                state: KubeToCIHealthStateMap(detail.state.toLocaleLowerCase()),
                instances: instancesData
            }

            accordionItemsData.push(accordionItemData);
        });

        return accordionItemsData;
    }

    /** 
     * gets timestamp current monitor state was last recalculated on the agent
     * @param fromUtcDateTime timestamp to calculate difference from
     */
    public getRelativeStateLastRecalculatedDateTime(): string {
        const healthMonitorService = this.healthServicesFactory.healthMonitorService;

        return this.getFormattedRelativeDateTime(
            this._model.lastRecalculatedDateTimeUtc,
            healthMonitorService.healthDataLoadedTimestamp);
    }

    /** 
     * gets timestamp current monitor state was first observed in relative terms to current time
     * @param fromUtcDateTime timestamp to calculate difference from
     */
    public getRelativeLastStateChangeDateTime(): string {
        const healthMonitorService = this.healthServicesFactory.healthMonitorService;

        return this.getFormattedRelativeDateTime(
            this._model.firstObservedDateTimeUtc,
            healthMonitorService.healthDataLoadedTimestamp);
    }

    /** 
    * gets monitor state display name
    */
    public get stateDisplayName(): string {
        return this._model.stateDisplayName;
    }

    /** 
     * gets monitor state
     */
    public get state(): HealthState {
        return this._model.state;
    }

    /** 
     * gets timestamp current cluster state was first observed
     */
    public get absoluteLastStateChangeDateTime(): string {
        return this.getFormattedDateTime(this._model.firstObservedDateTimeUtc);
    }

    /** 
     * gets timestamp current monitor state was last recalculated on the agent
     */
    public get absoluteStateLastRecalculatedDateTime(): string {
        return this.getFormattedDateTime(this._model.lastRecalculatedDateTimeUtc);
    }

    /**
     * Creates the model for this monitor details pane
     * @param monitorIdentifier monitor instance id
     */
    protected createDetailsModel(monitorIdentifier: string): void {
        if (!monitorIdentifier) {
            throw new Error(`@monitorIdentifier may not be null at ContainerCpuUtilizationMonitorDetailsViewModel.createDetailsModel()`);
        }

        const healthMonitorService = this.healthServicesFactory.healthMonitorService;
        const displayStringService = this.healthServicesFactory.displayStringService;
        const monitor = healthMonitorService.getMonitor(monitorIdentifier); // get data
        const rootMonitor = healthMonitorService.getMonitor(healthMonitorService.rootMonitorIdentifier);

        const details: IContainerCpuUtilizationDetails[] = this.getDetails(monitor); // extract details

        this._model = new ContainerCpuUtilizationMonitorDetailsModel(
            details,
            displayStringService.getHealthStateDisplayName(monitor.state),
            rootMonitor.lastUpdatedDateTimeUtc,
            monitor.state,
            monitor.firstObservedDateTimeUtc
        );
    }

    /**
     * gets the details property from the health monitor
     * @param monitor
     */
    private getDetails(monitor: IHealthMonitor): IContainerCpuUtilizationDetails[] {
        if (!monitor) {
            throw new Error(
                '@monitor may not be null in ContainerCpuUtilizationMonitorDetailsViewModel.getContainerCpuUtilizationDetails()'
            );
        }

        let details: IContainerCpuUtilizationDetails[] = monitor.details;

        if (!details) {
            throw new Error(
                '@monitor.details may not be null in ContainerCpuUtilizationMonitorDetailsViewModel.getContainerCpuUtilizationDetails()'
            );
        }

        return details;
    }

    private getInstancesData(details: IContainerCpuUtilizationDetailsObject): IContainerCpuDetailsMonitorInstanceData[] {
        const instanceDataArr: IContainerCpuDetailsMonitorInstanceData[] = [];
        //const containerName: string = details.container;
        const cpuLimit = details.cpu_limit_millicores;

        details.cpu_usage_instances.forEach((obj: IContainerCpuUtilizationCpuUsageInstancesObject, index: number) => {
            // let containerId = containerName ? `${obj.pod_name}-${containerName}` : String(index);
            const percentUtilization: string = MetricValueFormatter.formatPercentageValue(obj.counter_value / cpuLimit * 100);
            const usageRatio: string =
                `${MetricValueFormatter.formatMillicoreValue(obj.counter_value)} / ${MetricValueFormatter.formatMillicoreValue(cpuLimit)}`;
            const instanceData: IContainerCpuDetailsMonitorInstanceData = {
                instanceName: obj.pod_name,
                usage: usageRatio + ` (${percentUtilization})`,
                state: KubeToCIHealthStateMap(obj.state.toLocaleLowerCase())
            }

            instanceDataArr.push(instanceData);
        });

        return instanceDataArr;
    };

    /** 
 * gets difference between timestamps as display string
 * @param dateTime timestamp to calculate distance to
 * @param fromUtcDateTime timestamp to calculate difference from
 */
    private getFormattedRelativeDateTime(dateTime: Date, fromLocalDateTime: Date): string {
        if (!dateTime) { return null; }

        const fromMoment = moment(fromLocalDateTime).utc();

        // TODO-LOC: how is this loc'ed?
        return moment.utc(dateTime).from(fromMoment);
    }

    /**
     * converts date time value to display string
     * @param dateTime date time to format
     */
    private getFormattedDateTime(dateTime: Date): string {
        if (!dateTime) { return null; }

        const transitionTimeLocal = moment.utc(dateTime).local();

        return transitionTimeLocal.format('LLL');
    }
}
