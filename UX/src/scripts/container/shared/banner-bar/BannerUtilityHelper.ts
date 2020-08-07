import * as $ from 'jquery';

import { InitializationInfo, AuthorizationTokenType } from '../../../shared/InitializationInfo';
import { RestVerb } from '../../../shared/data-provider/RestVerb';
import { EnvironmentConfig } from '../../../shared/EnvironmentConfig';
import {
    MaxArmRequestTimeoutMs,
    MicrosoftContainerServiceApiVersion,
    MicrosoftGrapApiVersion,
    MicrosoftAuthorizationApiVersion,
    monitoringMetricsPublisherRoleGUID
} from '../../../shared/GlobalConstants';
import { GUID } from '@appinsights/aichartcore';
import { globals } from '../../../shared/globals/globals';

/**
 * Utility class for the banner which contains helper functions
 */
export class BannerUtilityHelper {

    public static Instance() {
        if (!globals.BannerUtilityHelper) {
            globals.BannerUtilityHelper = new BannerUtilityHelper();
        }

        return globals.BannerUtilityHelper;
    }

    /** make a request for cluster information with ARM auth token. API link:
     * https://docs.microsoft.com/en-us/rest/api/aks/managedclusters/get
     * and return the response
     * @param containerClusterResourceId full cluster resource id
     */
    public getClusterServicePrincipalClientID(containerClusterResourceId: string): Promise<any> {
        let clusterServicePrincipalClientIDDescriptor: any = {
            timeout: MaxArmRequestTimeoutMs,
            headers: {
                Authorization: InitializationInfo.getInstance().getAuthorizationHeaderValue(AuthorizationTokenType.Arm),
            },
            type: RestVerb.Get,
            url: EnvironmentConfig.Instance().getARMEndpoint()
                + containerClusterResourceId
                + '?api-version=' + MicrosoftContainerServiceApiVersion
        };

        return $.ajax(clusterServicePrincipalClientIDDescriptor);
    }

    
    /** make a request to convert Cluster service principal client ID to 
     * cluster service prinicipal object ID and return the response
     * @param tenantID tenant ID that the cluster resides in
     * @param clusterServicePrincipalClientID cluster client service principal id
     * @param microsoftGraphAuthToken microsoft graph authorization token
     */
    public getClusterServicePrincipalObjectIDDescriptor(
        tenantID: string,
        clusterServicePrincipalClientID: string,
        microsoftGraphAuthToken: string
    ): Promise<any> {
        const uri = EnvironmentConfig.Instance().getGraphEndpoint()
            + `/${tenantID}`
            + `/servicePrincipals?$filter=servicePrincipalNames/any`
            + `(c:c eq '${clusterServicePrincipalClientID}')`
            + `&api-version=` + MicrosoftGrapApiVersion;

        let clusterServicePrincipalObjectIDDescriptor: any = {
            timeout: MaxArmRequestTimeoutMs,
            headers: {
                Authorization: microsoftGraphAuthToken,
            },
            type: RestVerb.Get,
            url: uri
        };

        return $.ajax(clusterServicePrincipalObjectIDDescriptor);
    }

    /**
     * Set role assignement for the cluster service prinicipal with the monitoring publisher role GUID
     * @param containerClusterResourceId full cluster resource id
     * @param clusterServicePrincipalObjectID cluster service principal OBJECT ID Note: This is not the client id!
     */
    public addRoleAssignment(
        containerClusterResourceId: string,
        clusterServicePrincipalObjectID: string
    ): Promise<any> {
        const roleAssignmentName: string = GUID();

        const uri = EnvironmentConfig.Instance().getARMEndpoint()
            + `${containerClusterResourceId}`
            + `/providers/Microsoft.Authorization`
            + `/roleAssignments/${roleAssignmentName}`
            + `?api-version=` + MicrosoftAuthorizationApiVersion;

        const roleDefinitionId = `/subscriptions/${containerClusterResourceId.split('/')[2]}`
            + `/providers/Microsoft.Authorization/roleDefinitions/` + monitoringMetricsPublisherRoleGUID;

        const body = {
            properties: {
                roleDefinitionId: roleDefinitionId,
                principalId: clusterServicePrincipalObjectID
            }
        };

        let servicePrincipalRoleAssignmentDescriptor: any = {
            timeout: MaxArmRequestTimeoutMs,
            headers: {
                Authorization:
                    InitializationInfo.getInstance().getAuthorizationHeaderValue(AuthorizationTokenType.Arm),
            },
            type: RestVerb.Put,
            data: JSON.stringify(body),
            contentType: 'application/json',
            url: uri
        };

        return $.ajax(servicePrincipalRoleAssignmentDescriptor);
    }
}
