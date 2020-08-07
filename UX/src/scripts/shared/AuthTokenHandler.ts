import { globals } from './globals/globals';
import { BannerUtilityHelper } from '../container/shared/banner-bar/BannerUtilityHelper';
import { ErrorSeverity } from './data-provider/TelemetryErrorSeverity';
import { PortalMessagingProvider } from './messaging/v2/PortalMessagingProvider';
import { StringHelpers } from './Utilities/StringHelpers';
import { ILocalStorageWrapper } from './data-provider/LocalStorageProvider';

/** Authorization token handler for microsoft.graph token */
export class AuthTokenHandler {

    public microsoftGraphAuthToken: string = '';
    public isPutOpertationRequired: boolean;
    public clusterServicePrincipalClientID: string = '';
    public tenantID: string = '';
    public containerClusterResourceId: string = '';
    public armAuthToken: string = '';
    public setIsBannerVisible: (isVisible: boolean) => void;
    public telemetry: any;
    public localStorageManager: ILocalStorageWrapper;
    public containerClusterLocation: string;

    /**
     * Establish the ctor() for the authorization token handler
     */
    constructor() {
        this.handleAuthTokenEvent = this.handleAuthTokenEvent.bind(this);
        this.handlePermissionGrantFailure = this.handlePermissionGrantFailure.bind(this);
        this.onboardServicePrincipal = this.onboardServicePrincipal.bind(this);
        this.isPutOpertationRequired = false;
    }

    /**
     * Instantiate the singleton authorization token handler for requesting a token from Monitoring extension
     * for now, and later on we can remove this when we request tokens via the extensionless method. 
     */
    public static Instance() {
        if (!globals.authTokenHandlerInstance) {
            globals.authTokenHandlerInstance = new AuthTokenHandler();
        }

        return globals.authTokenHandlerInstance;
    }

    /**
     * Handle receiving authorization token event and based on isPutOperationrequired's value we
     * set the role assignments for the microsoft.graph token
     * @param event passed from monitoring extension or extensionless soon!
     */
    public handleAuthTokenEvent(event: any) {
        try {
            if (!event.detail || !event.detail.rawData) { return; }

            this.microsoftGraphAuthToken = JSON.parse(event.detail.rawData).microsoftGraphAuthToken;
            this.tenantID = JSON.parse(event.detail.rawData).tenantID;
            if (this.isPutOpertationRequired) {
                this.onboardServicePrincipal(this.tenantID, this.clusterServicePrincipalClientID, this.containerClusterResourceId);
            }
        } catch (exc) {
            this.telemetry.logException(
                'failed in handleAuthTokenEvent',
                'BannerUtilityHelper.ts',
                ErrorSeverity.Error,
                undefined,
                undefined
            );
        }
    }

    // Adding a helper method so that it can be used by ServicePrincipal or MSI role assignment
    public onboardServicePrincipalHelper(
        servicePrincipalObjectId: string, 
        clusterServicePrincipalDisplayName: string,
        clusterResourceId: string
    ): Promise<any> {
        return BannerUtilityHelper.Instance().addRoleAssignment(
            clusterResourceId,
            servicePrincipalObjectId
        ).then(() => {
            PortalMessagingProvider.Instance().sendMessage('UpdateNotification', {
                status: 'success',
                clusterServicePrincipalDisplayName: clusterServicePrincipalDisplayName,
            });

            this.setIsBannerVisible(false);

            this.localStorageManager.setItem(`mdmEnableSuccess${clusterResourceId}DateTime`, Date.now().toString());
            
            this.telemetry.logEvent('Enable-MDM-Successfully', undefined, undefined);
        }).catch((error: any) => {
            this.handlePermissionGrantFailure(error);
        });
    }

    /**
     * Utilize the cluster and user details to onboard a service principal access levels required for the
     * agent to post data to the custom metrics
     * @param tenantId azure tenant the user is logged into and active on
     * @param servicePrincipalClientId client id for the service principal of the cluster
     * @param clusterResourceId full arm resource id from the cluster
     */
    public onboardServicePrincipal(tenantId: string, servicePrincipalClientId: string, clusterResourceId: string) {
        BannerUtilityHelper.Instance().getClusterServicePrincipalObjectIDDescriptor(
            tenantId,
            servicePrincipalClientId,
            AuthTokenHandler.Instance().microsoftGraphAuthToken
        ).then((objectIdResponse: any) => {
            objectIdResponse = objectIdResponse || {};
            const objectIdResponseValue = objectIdResponse.value || [{}];

            // bbax: service principals have an objectId and a clientId... role assignment
            // requires the objectId so we've retrieved it above and utilize it for addRoleAssignment
            const servicePrincipalObjectId = objectIdResponseValue[0].objectId;

            const clusterServicePrincipalDisplayName = objectIdResponse.value[0].appDisplayName;
            this.onboardServicePrincipalHelper(servicePrincipalObjectId, clusterServicePrincipalDisplayName, clusterResourceId);
        }).catch((error: any) => {
            this.handlePermissionGrantFailure(error);
        });
    }


    /**
     * handle failure in the ajax call by notifying mon ext to update the notification to failure
     * and log a telemetry exception
     * @param error error recieved from AJAX call
     */
    public handlePermissionGrantFailure(error: any) {
        if (error && error.status && error.responseJSON && error.responseJSON.error
            && error.responseJSON.error.code && error.responseJSON.error.message) {
            if (error.status === 409 && StringHelpers.equal(error.responseJSON.error.code, 'RoleAssignmentExists')) {
                PortalMessagingProvider.Instance().sendMessage('UpdateNotification', {
                    status: 'success_with_conflict',
                    message: error.responseJSON.error.message
                });
                this.telemetry.logEvent('Enable-MDM-AlreadyExists', undefined, undefined);
                this.localStorageManager.setItem(`mdmQuery${this.containerClusterResourceId}DateTime`, Date.now().toString());
                this.setIsBannerVisible(false);
                return;
            }
        }

        PortalMessagingProvider.Instance().sendMessage('UpdateNotification', {
            status: 'failed',
            errorMessage: error.responseText
        });
        this.telemetry.logException(
            error.responseText,
            'BannerUtilityHelper.ts',
            ErrorSeverity.Error,
            undefined,
            undefined
        );
    }
}
