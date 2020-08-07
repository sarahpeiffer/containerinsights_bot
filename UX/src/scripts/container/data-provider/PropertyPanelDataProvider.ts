/**
 * tpl
 */
import { Promise } from 'es6-promise'

/**
 * local
 */
import { Placeholder } from './QueryTemplates/CommonQueryTemplate';
import { PropertyPanelQueryTemplates } from './QueryTemplates/PropertyPanelQueryTemplates';
import { PropertyPanelType } from './KustoPropertyPanelResponseInterpreter';

/**
 * shared
 */
import { ITimeInterval } from '../../shared/data-provider/TimeInterval';
import { IWorkspaceInfo } from '../../shared/IWorkspaceInfo';
import { IKustoDataProvider, IKustoQueryOptions } from '../../shared/data-provider/KustoDataProvider';
import { StringHelpers } from '../../shared/Utilities/StringHelpers';
import { Prefer } from '../../shared/data-provider/v2/KustoDataProvider';

/**
 * Describes cluster object we're dealing with
 */
export interface IClusterObjectInfo {
    resourceType: PropertyPanelType;
    containerName: string;
    clusterResourceId: string;
    podName: string;
    controllerName: string;
    nodeName: string;
    timeGenerated: string;
}

/**
 * Property panel data provider public surface interface
 */
export interface IPropertyPanelDataProvider {
    /**
     * Gets the data for the property panel corresponding to row
     * @param row the row that was selected and whose property panel will be generated
     * @param timeInterval the time interval that the user has selected for examining his AKS resources
     * @param workspace the user's currently selected workspace
     * @param requestId optional request id
     * @returns {Promise<any>} promise for async operation
     */
    getData(
        clusterObject: IClusterObjectInfo,
        timeInterval: ITimeInterval,
        workspace: IWorkspaceInfo,
        requestId?: string
    ): Promise<any>;
}

/**
 * The data provider for retireving the data necessary to generate the property panel in container insights
 */
export class PropertyPanelDataProvider implements IPropertyPanelDataProvider {
    private kustoDataProvider: IKustoDataProvider;

    constructor(kustoDataProvider: IKustoDataProvider) {
        this.kustoDataProvider = kustoDataProvider; // We need this to actually make the call to Kusto
    }

    /**
     * Gets the data for the property panel corresponding to row
     * @param clusterObject object for which property panel is generated
     * @param timeInterval the time interval that the user has selected for examining his AKS resources
     * @param workspace the user's currently selected workspace
     */
    public getData(
        clusterObject: IClusterObjectInfo,
        timeInterval: ITimeInterval,
        workspace: IWorkspaceInfo,
        requestId?: string
    ): Promise<any> {
        if (clusterObject.resourceType === PropertyPanelType.Unsupported) {
            return new Promise((resolve, reject) => resolve(PropertyPanelType.Unsupported));
        }
        const queryTemplate = this.getQueryTemplate(clusterObject.resourceType);
        if (!queryTemplate) {
            return new Promise((resolve, reject) => reject(new Error('The query was empty')));
        }
        let query = this.replaceParamPlaceholders(
            queryTemplate,
            timeInterval,
            clusterObject.containerName,
            clusterObject.podName,
            clusterObject.controllerName,
            clusterObject.nodeName,
            clusterObject.timeGenerated,
            clusterObject.clusterResourceId
        );

        const queryOptions = this.getQueryOptions(timeInterval, clusterObject, requestId);

        return this.kustoDataProvider.executeDraftQuery({workspace, query, queryOptions});
    }

    /**
     * Constructs Kusto query options set
     * @param timeInterval time interval of the query
     * @param clusterObject property panel object information
     * @param requestId request id
     * @returns {IKustoQueryOptions} query options for Kusto query
     */
    private getQueryOptions(
        timeInterval: ITimeInterval,
        clusterObject: IClusterObjectInfo,
        requestId?: string,
    ): IKustoQueryOptions {
        let queryOptions: IKustoQueryOptions = {
            timeInterval: timeInterval
        };

        queryOptions.requestInfo = 'PropPanelType=' + PropertyPanelType[clusterObject.resourceType];

        // node props panel still using _CL table - do not set 'no custom logs/fields' preferences for node query
        if (clusterObject.resourceType === PropertyPanelType.Node) {
            queryOptions.preferences = Prefer.ExcludeFunctions;
        } else {
            queryOptions.preferences = [Prefer.ExcludeFunctions, Prefer.ExcludeCustomFields, Prefer.ExcludeCustomLogs].join(',');
        }

        if (requestId) { queryOptions.requestId = requestId; }

        return queryOptions;
    }

    /**
     * Replaces the time parameters in the query that will be asked of Kusto
     * @param queryTemplate the query template with param placeholders still in it
     * @param timeInterval the time interval that will be used to replace its placeholder in the query template
     */
    private fillInTimeParameters(
        queryTemplate: string,
        timeInterval: ITimeInterval
    ): string {
        // bbax: dont ask Kusto for the future... Vitaly said this is a bad idea
        // since some things can happen in the future
        const targetStartDate = timeInterval.getBestGranularStartDate();
        const targetEndDate = timeInterval.getBestGranularEndDate(true);

        return queryTemplate
            .replace(Placeholder.StartDateTime, targetStartDate.toISOString())
            .replace(Placeholder.EndDateTime, targetEndDate.toISOString())
            .replace(Placeholder.Granularity, timeInterval.getGrainKusto());
    }

    /**
     * Replaces all the param placeholders in our query template
     * @param queryTemplate the query template with param placeholders still in it
     * @param timeInterval the time interval that will be used to replace its placeholder in the query template
     * @param containerName the container name that will be used to replace its placeholder in the query template
     * @param podName the pod name that will be used to replace its placeholder in the query template
     * @param controllerName the controller name that will be used to replace its placeholder in the query template
     * @param computerName the computer name that will be used to replace its placeholder in the query template
     * @param clusterResourceId full arm path to this cluster
     */
    private replaceParamPlaceholders(
        queryTemplate: string,
        timeInterval: ITimeInterval,
        containerName: string,
        podName: string,
        controllerName: string,
        computerName: string,
        timeGenerated: string,
        clusterResourceId: string
    ): string {
        let queryWithTimeValue = this.fillInTimeParameters(queryTemplate, timeInterval);

        if (timeGenerated !== '') {
            queryWithTimeValue = StringHelpers.replaceAll(
                queryWithTimeValue,
                Placeholder.TimeGeneratedFilter,
                timeGenerated
            )
        } else {
            queryWithTimeValue = StringHelpers.replaceAll(
                queryWithTimeValue,
                Placeholder.TimeGeneratedFilter,
                ''
            );
        }

        if (containerName !== '') {
            queryWithTimeValue = StringHelpers.replaceAll(
                queryWithTimeValue,
                Placeholder.ContainerNameFilter,
                `| where ContainerName =~ '${containerName}'`
            );
        } else {
            queryWithTimeValue = StringHelpers.replaceAll(
                queryWithTimeValue,
                Placeholder.ContainerNameFilter,
                ''
            );
        }

        if (clusterResourceId !== '') {
            queryWithTimeValue = StringHelpers.replaceAll(
                queryWithTimeValue,
                Placeholder.ClusterIdFilter,
                `| where ClusterId =~ '${clusterResourceId}'`
            );
        } else {
            queryWithTimeValue = StringHelpers.replaceAll(
                queryWithTimeValue,
                Placeholder.ClusterIdFilter,
                ''
            );
        }

        if (podName !== '') {
            queryWithTimeValue = StringHelpers.replaceAll(
                queryWithTimeValue,
                Placeholder.PodNameFilter,
                `| where PodName =~ '${podName}'`
            );
        } else {
            queryWithTimeValue = StringHelpers.replaceAll(
                queryWithTimeValue,
                Placeholder.PodNameFilter,
                ''
            );
        }

        if (controllerName !== '') {
            queryWithTimeValue = StringHelpers.replaceAll(
                queryWithTimeValue,
                Placeholder.ControllerNameFilter,
                `| where ControllerName =~ '${controllerName}'`
            );
        } else {
            queryWithTimeValue = StringHelpers.replaceAll(
                queryWithTimeValue,
                Placeholder.ControllerNameFilter,
                ''
            );
        }

        if (computerName !== '') {
            queryWithTimeValue = StringHelpers.replaceAll(
                queryWithTimeValue,
                Placeholder.ComputerNameFilter,
                `| where Computer =~ '${computerName}'`
            );
        } else {
            queryWithTimeValue = StringHelpers.replaceAll(
                queryWithTimeValue,
                Placeholder.ComputerNameFilter,
                ''
            );
        }

        return queryWithTimeValue;
    }

    /**
     * returns the query template corresponding to the provided resource type
     * @param resourceType container, pod, controller, or node
     */
    private getQueryTemplate(resourceType: PropertyPanelType): string {
        let query: string;

        switch (resourceType) {
            case PropertyPanelType.Container:
                query = PropertyPanelQueryTemplates.Container;
                break;
            case PropertyPanelType.Pod:
                query = PropertyPanelQueryTemplates.Pod;
                break;
            case PropertyPanelType.Controller:
                query = PropertyPanelQueryTemplates.Controller;
                break;
            case PropertyPanelType.Node:
                query = PropertyPanelQueryTemplates.Node;
                break;
            default:
                return '';
        }

        return query;
    }
}
