/** tpl */
import * as React from 'react';

/** shared */
import { MessagingProvider } from '../MessagingProvider';
import { ISummaryPanelInfo } from './ISummaryPanelInfo';
import { DisplayStrings } from '../../multicluster/MulticlusterDisplayStrings';

/** local */
import { BigNumberIcon } from './BigNumberIcon';

/** styles */
import '../../../styles/multicluster/ControlPanel.less';

/** svg */
import { WarnSvg } from '../../shared/svg/warn';
import { GreenSvg } from '../../shared/svg/green';
import { UnknownSvg } from '../../shared/svg/unknown';
import { FailedSvg } from '../../shared/svg/failed';

/**
 * Control panel properties
 */
interface IMulticlusterControlPanelProps {
    summaryPanelInfo: ISummaryPanelInfo;
    messagingProvider: MessagingProvider;
    isLoading: boolean;
    isError: boolean;

}

interface IMulticlusterControlPanelState { }

export class MulticlusterControlPanel extends React.Component<IMulticlusterControlPanelProps, IMulticlusterControlPanelState> {

    constructor(props: any) {
        super(props);

        this.state = {};
    }

    /**
     * render the Multi cluster control panel
     * 
     */
    public render(): JSX.Element {

        return (
            <div className='multicluster-dashboard'>
                <div className='cluster-status-summary'>
                    <div className='cluster-status-summary-title'
                        title={DisplayStrings.ClusterStatusSummaryTitle}
                        aria-label={DisplayStrings.ClusterStatusSummaryTitle}>
                        {DisplayStrings.ClusterStatusSummaryTitle}
                    </div>
                    <div className='cluster-status-summaries-container' role='status' aria-live='polite'>
                        <BigNumberIcon
                            number={(this.props.isLoading || this.props.isError) ? null : this.props.summaryPanelInfo.numTotal}
                            text={DisplayStrings.SummaryPanelTileTotal}
                            label={DisplayStrings.Label + ' ' + DisplayStrings.ClusterStatusSummaryTitle}
                        />
                        <BigNumberIcon
                            number={(this.props.isLoading || this.props.isError) ? null : this.props.summaryPanelInfo.numCritical}
                            icon={<FailedSvg />}
                            text={DisplayStrings.SummaryPanelTileCritical}
                            label={DisplayStrings.Label + ' ' + DisplayStrings.ClusterStatusSummaryTitle}
                        />
                        <BigNumberIcon
                            number={(this.props.isLoading || this.props.isError) ? null : this.props.summaryPanelInfo.numWarning}
                            icon={<WarnSvg />}
                            text={DisplayStrings.SummaryPanelTileWarning}
                            label={DisplayStrings.Label + ' ' + DisplayStrings.ClusterStatusSummaryTitle}
                        />
                        <BigNumberIcon
                            number={(this.props.isLoading || this.props.isError) ? null : this.props.summaryPanelInfo.numUnknown}
                            icon={<UnknownSvg />}
                            text={DisplayStrings.SummaryPanelTileUnknown}
                            label={DisplayStrings.Label + ' ' + DisplayStrings.ClusterStatusSummaryTitle}
                        />
                        <BigNumberIcon
                            number={(this.props.isLoading || this.props.isError) ? null : this.props.summaryPanelInfo.numHealthy}
                            icon={<GreenSvg />}
                            text={DisplayStrings.SummaryPanelTileHealthy}
                            label={DisplayStrings.Label + ' ' + DisplayStrings.ClusterStatusSummaryTitle}
                        />
                        <BigNumberIcon
                            number={(this.props.isLoading || this.props.isError) ? null : this.props.summaryPanelInfo.numNonMonitored}
                            text={DisplayStrings.SummaryPanelTileUnmonitored}
                            label={DisplayStrings.Label + ' ' + DisplayStrings.ClusterStatusSummaryTitle}
                        />
                    </div>
                </div>
            </div>
        );
    }
}
