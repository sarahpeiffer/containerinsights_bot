import { AzureCloudType } from '../../shared/EnvironmentConfig';
import { INavigationProps } from '../ContainerMainPageTypings';

/**
 * Defines set of properties for "init" event received from hosting blade
 */
export interface IInitEventProps {
    /** ARM auth token */
    armAuthorizationHeaderValue: string;
    /** Log Analytics auth token */
    logAnalyticsAuthorizationHeaderValue: string;
    /** event sequence number */
    sequenceNumber: number;
    /** Portal blade initiating iframe load */
    initiatorBlade?: string;
    /** feature flags set on the blade */
    featureFlags: StringMap<boolean>;
    /** true if we're in "in-blade" experience */
    isInBlade: boolean;
    /** auth redirect url required for aad token passback */
    authorizationUrl: string;
    /** feature flag set if we are loading in mpac mode */
    isMpac: boolean;
    /** 
     * workspace resource id
     * [in-blade only]
     */
    workspaceResourceId: string;
    /** 
     * cluster resource id
     * [in-blade only]??
     */
    containerClusterResourceId: string;
    /** 
     * cluster name
     * [in-blade only]??
     */
    containerClusterName: string;
    /** 
     * Set of workspaces in customer's subscription(s) queried by hosting blade
     * [not in in-blade]
     * NOTE: this may be a partial set - workspaces are enumerated in chunks
     * TODO: Beter typing?
     */
    workspacesCacheList: any[];
    /** 
     * True if set of workspaces in customer's subscription(s) finished loading
     * [not in in-blade]
     */
    isLoaded: boolean;
    /** 
     * List of errors encountered while enumerating workspaces
     * [not in in-blade]
     * NOTE: this may be a partial set - workspaces are enumerated in chunks
     * TODO: Beter typing?
     */
    errorsOnLoadList: any[];
    /** 
     * Workspace to select by default 
     * (in the UX; generally speaking the last one customer had selected previously)
     * [not in in-blade]
     * TODO: Beter typing?
     */
    selectedWorkspace: any;
    /** 
     * cluster location
     * [in-blade only] For eg: 'eastus','southcentralus', 'westcentralus'
     */
    containerClusterLocation: string;
    /** Azure cloud type, i.e. Nonpublic, Public, Mooncake, Fairfax, Blackforest */
    azureCloudType?: AzureCloudType;
    /** Instructions for specifying what the state of the UI should be when navigating into our in-blade experience */
    navigationProps: INavigationProps;
}
