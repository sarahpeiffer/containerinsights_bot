/**
 * Blade Parameters for the blades which are to be exported.
 */
declare namespace BladeParameters {

    export interface OnboardingStatusesParams {
        caller?: string;
        // TODO: Pass selected Navigation - Sub/RG/Resource
    }

    export interface InstanceDetailBladeParams {
        solutionType?: string;
        vmId: string;
    }

    export interface OverviewBladeParams {
        /**
         * Set to "baseos"
         *
         * @deprecated
         */
        solutionType: any;
        /**
         * Resource group to use as filter in the group dropdown
         *
         * @deprecated
         */
        resourceGroup?: string;
    }

    export interface AtScaleVmInsightsBladeParams {
        /**
         * When called externally, used as initial settings when opening AtScale blade.
         * Otherwise, this is used as a contract within Ibiza's blade configuration to
         * store user settings. Also used as a contract between Ibiza blade and iframe.
         */
        scopeSelections?: ScopeSelections;

        /**
         * Initial subscription ID, used in lieu of `scopeSelections` subscription object. When passed
         * into the blade, the blade will be responsible for filling out the `scopeSelections` subscription.
         * Else, if both `scopeSelections.subscription` and `subscriptionId` is provided, then `subscriptionId`
         * will be ignored.
         *
         * @type {string}
         * @memberof AtScaleVmInsightsBladeParams
         */
        subscriptionId?: string;

        /**
         * Used when calling from Single VM to go to AtScale mode. In this case, we do not want to save the
         * scope selection.
         *
         * @type {boolean}
         * @memberof AtScaleVmInsightsBladeParams
         */
        doNotSaveScope?: boolean;

        // Identification of the caller used in telemetry
        sourceType?: string;

        // Default select tab
        selectedTab?: VmInsightsAtScaleTabs;

        // Choose sub-Tab under Performance tab, only affect when selectedTab = VmInsightsAtScaleTabs.Performance
        perfViewSelectedTab?: AtScalePerformanceTabViewType;

        /**
         * @deprecated
         */
        appWorkspaces?: AppWorkspaces;

        /**
         * @deprecated
         */
        onlyShowSelected?: boolean;

        /**
         * Selections initially displayed in the UI
         *
         * @deprecated
         */
        initialSelections?: InitialSelections;
    }

    /**
     * The main type that is shared between the iframe and blade, also can be passed in as blade parameters
     * and saved as blade configuration. Not all scopes are persisted since the information is stored in
     * other managers or are temporary placeholders.
     *
     * @export
     * @interface ScopeSelections
     */
    export interface ScopeSelections {
        /**
         * TODO ak: type properly once portal sdk supports it
         *
         * @type {string}
         * @memberof ScopeSelections
         */
        solutionType?: string;
        scopes?: Scopes;
        timeRange?: TabTimeData;
    }

    /**
     * Placeholder to store the scopes for each mode.
     *
     * @export
     * @interface Scopes
     */
    export interface Scopes {
        azure?: AzureScopes;
        hybrid?: HybridScopes;
    }

    export interface AzureScopes {
        /**
         * Directly fed from PortalFx Subscription, note the `subscriptionId` is the subscription GUID
         *
         * @type {ISubscriptionInfo}
         * @memberof AzureScopes
         */
        subscription?: ISubscriptionInfo;
        resourceGroup?: IResourceInfo;
        /**
         * Enum `VmInsightsResourceType`
         *
         * TODO ak: type this properly once portalSDK supports it
         *
         * @type {string}
         * @memberof AzureScopes
         */
        resourceType?: string;
        resource?: IResourceInfo;
    }

    /**
     * This will the response type when scopes get updated
     *
     * @export
     * @interface IAzureScopesUpdateResponse
     */
    export interface IScopesUpdateResponse {
        /**
         * This signifies whether there was any changes in scope
         *
         * @type {boolean} true: if scope was changed, false: if scope was not changed
         * @memberof IAzureScopesUpdateResponse
         */
        isChanged: boolean;
        /**
         * Updated scope
         *
         * @type {BladeParameters.AzureScopes}
         * @memberof IAzureScopesUpdateResponse
         */
        newScopes: AzureScopes | HybridScopes;
    }

    export interface HybridScopes {
        workspace?: IWorkspaceInfo;
        /**
         * TODO ak: consolidate or simplify type
         *
         * @type {SerializedComputerGroup}
         * @memberof HybridScopes
         */
        computerGroup?: SerializedComputerGroup;
        /**
         * Service map computer
         *
         * TODO ak: consolidate type with `IResourceInfo`
         *
         * @type {SelectedEntity}
         * @memberof ScopeSelections
         */
        computer?: SelectedEntity;
    }

    /**
     * Performance and map tabs have different ranges and for better user experience
     * each tab should store time ranges separately.
     *
     * @export
     * @interface TabTimeData
     */
    export interface TabTimeData {
        performanceTab?: TimeData;
        mapTab?: TimeData;
    }

    export interface IWorkspaceInfo {
        id: string;
        location?: string;
        name?: string;
        properties?: any;
        type?: string;
    }

    export interface VmScaleSetInsightsBladeParams extends AtScaleVmInsightsBladeParams {
        vmScaleSetResourceId: string;
        // Refer 4563861, LaResourceId, get resource Id from heartbeat table, can be azure resourceId or old LA resource Id.
        laResourceId?: string;
    }

    export interface VirtualMachineScaleSetParameter {
        vmScaleSetResourceId: string;
        extensions: any;
        instanceView: any;
        osType: string;
        virtualMachineImageReference: any;
        location: string;
        upgradePolicy: string;
        displayName: string;
    }

    export interface IResourceInfo {
        id: string;
        displayName?: string;
        fqdn?: string;
        location?: string;
        type?: string;
    }

    /**
     * Copied directly from Portal FX library to ensure typing in iframe.
     *
     * @export
     * @interface ISubscriptionInfo
     */
    export interface ISubscriptionInfo {
        authorizationSource: string;
        displayName: string;
        state: string;
        /**
         * This is the subscription GUID, you will need to add the `/subscriptions/` prefix
         * to get the ARM ID
         *
         * @type {string}
         * @memberof ISubscriptionInfo
         */
        subscriptionId: string;
        uniqueDisplayName: string;
        subscriptionPolicies: SubscriptionPolicies;
    }

    /**
     * Data contract for Azure subscription policies.
     */
    export interface SubscriptionPolicies {
        /**
         * The subscription location placement id.
         */
        locationPlacementId: string;
        /**
         * The subscription quota id.
         */
        quotaId: string;
        /**
         * The subscription spending limit Values "On", "Off", "CurrentPeriodOff"
         */
        spendingLimit?: string;
    }

    /**
     * @deprecated
     */
    export interface IDefaultAzureScopeSelection {
        selectedResourceGroup?: IResourceInfo;
        selectedSubscription?: ISubscriptionInfo;
        selectedResourceType?: string;
        selectedResource?: IResourceInfo;
        selectedResourceWorkspaceList?: IWorkspaceInfo[];
    }

    /**
     * @deprecated
     */
    export interface InitialSelections {
        // selected computer
        computer?: SelectedEntity;

        // selected group
        group?: SerializedComputerGroup;

        // selected workspace id. We can retrieve the name out of the id.
        workspaceId?: string;

        // selected time range
        timeData?: TimeData;

        // Default azure scope selection if the solution is running in Azure mode.
        azureScopeSelection?: IDefaultAzureScopeSelection;

        // TODO ak: type this properly once portalsdk supports it
        // Solution type: Azure or Hybrid
        solutionType?: string;
    }

    /**
     * Consolidate this with another interface
     *
     * @deprecated
     * @export
     * @interface SelectedEntity
     */
    export interface SelectedEntity {
        name: string;
        id: string;
        resourceId?: string;
    }

    export interface InstanceVmInsightsBladeParams extends InstanceDetailBladeParams {
        navigationContext?: string;
    }

    export interface AppWorkspaces {
        workspaceIds: string[];
        workspaceGuids: string[];
    }

    export const enum VmInsightsAtScaleTabs {
        Health = 0,
        Performance = 1,
        Map = 2,
        GettingStarted = 3
    }

    export const enum AtScalePerformanceTabViewType {
        TopNChart = 0,
        AggregateChart = 1,
        TopNList = 2
    }

    export const enum VmInsightsSingleResourceTabs {
        Health = 0,
        Performance = 1,
        Map = 2,
        ConvergedMap = 3
    }

    export interface AlertsQueryTimeRange {
        startDateTimeInUtc: string;
        endDateTimeInUtc: string;
    }

    export interface LaAlertsFilter {
        serviceMapGroupMembers?: string[];
        computerName?: string;
        azureResourceId?: string;
        savedSearchGroupName?: string;
    }

    export interface AlertListBladeParams {
        workspaceId: string;
        azureResourceId?: string;
        alertsFilterByResource: LaAlertsFilter;
        timeRange: AlertsQueryTimeRange;
        errorMessageBanner?: string;
    }
}
