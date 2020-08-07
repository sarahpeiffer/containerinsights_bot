/** tpl  */
import * as React from 'react';
import { SGCellProps } from 'appinsights-iframe-shared';

/** shared */
import { DisplayStrings } from '../../MulticlusterDisplayStrings';
import { hyperlinkSVG } from '../../../shared/svg/hyperlink';
import { IMessagingProvider, MessagingProvider, ISingleAksClusterNavigationMessage } from '../../../shared/MessagingProvider';
import { TelemetryFactory } from '../../../shared/TelemetryFactory';
import { TelemetryMainArea } from '../../../shared/Telemetry';
import { MulticlusterGridBase } from '../MulticlusterGridBase';

/** styles */
import '../../../../styles/multicluster/GridPaneMulticluster.less';


/**
 * A cell definition for a trend chart
 * @param gridState the state of the grid in which this cell definition will be used
 */
export const EnableMonitoringLink: (messagingProvider: IMessagingProvider) => React.StatelessComponent<SGCellProps> =
    (messagingProvider) =>
        ({ value }) => {

            //render empty div if metadata not valids
            if (!value || !value.metaData.clusterId || !value.metaData.name) {
                return <div></div>;
            }

            const clusterResourceId = value.metaData.clusterId;
            const msgData: ISingleAksClusterNavigationMessage = {
                clusterResourceId: clusterResourceId,
                clusterName: value.metaData.name
            };

            const isOnboardingSupportedCluster: boolean = clusterResourceId &&
                (clusterResourceId.toLocaleLowerCase().indexOf('microsoft.containerservice/managedclusters') >= 0 ||
                    clusterResourceId.toLocaleLowerCase().indexOf('microsoft.containerservice/openshiftmanagedclusters') >= 0)
                ? true : false;

            let link;
            if (isOnboardingSupportedCluster) {

                link = <a href='#' className='enable-monitoring-link' onClick={() => {
                    const telemetry = TelemetryFactory.get(TelemetryMainArea.Containers);
                    telemetry.logNavigationEvent('monitored-cluster-insights', 'single-cluster-onboarding-context-pane');
                    (messagingProvider as MessagingProvider).sendNavigateToSingleAksClusterOnboarding(msgData)
                }
                }>
                    {DisplayStrings.MulticlusterUnmonitoredGridEnableMonitoringLink}
                    <span className='hyperlink-svg'>{hyperlinkSVG}</span>
                </a>
            } else {
                const monitoringOnboardingLink: string = MulticlusterGridBase.getMonitoringOnboardingLink(clusterResourceId);
                link = <a href={monitoringOnboardingLink}
                    target='_blank' className='enable-monitoring-link'
                    onClick={() => {
                        const telemetry = TelemetryFactory.get(TelemetryMainArea.Containers);
                        telemetry.logNavigationEvent('monitored-cluster-insights', 'single-cluster-onboarding-context-pane');
                    }}>
                    {DisplayStrings.MulticlusterUnmonitoredGridEnableMonitoringLink}
                    <span className='hyperlink-svg'>{hyperlinkSVG}</span>
                </a>
            }

            return link;
        }


