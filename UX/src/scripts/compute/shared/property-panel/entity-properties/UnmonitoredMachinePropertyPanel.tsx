import * as React from 'react';
/**
 * local component
 */
import { HyperLink } from '../component/HyperLink';
/**
 * shared
 */
import { MachineLogoSVG } from '../../../../shared/svg/machine-log';
import { DisplayStrings } from '../../../../shared/DisplayStrings';
import { PropertyPanelHeaderSection } from '../../../../shared/property-panel/PropertyPanelHeaderSection';
import { SimpleProperty } from '../../../../shared/property-panel/SimpleProperty';
import { ExpandableSection2 } from '../../../../shared/property-panel/ExpandableSection2';
import { ChevronRightSvg } from '../../../../shared/svg/chevron-right';
import { ChevronDownSvg } from '../../../../shared/svg/chevron-down';
import { ArmDataProvider } from '../../../../shared/data-provider/v2/ArmDataProvider';
import { HttpVerb } from '../../../../shared/data-provider/v2/HttpDataProvider';
import { EnvironmentConfig } from '../../../../shared/EnvironmentConfig';
import { InitializationInfo, AuthorizationTokenType } from '../../../../shared/InitializationInfo';
import * as Constants from '../../../../shared/GlobalConstants';
import { ITelemetry } from '../../../../shared/Telemetry';

/** 
 * Properties of the component below
*/
interface IUnmonitoredMachineProps {
    machineName: string;
    linkProperties?: JSX.Element;

    /**
     * if vmResourceId is given, let's confirmed it from the arm api
     * Then give user chance to open onboarding pane.
     */
    vmResourceId?: string;
    /**
     * callback to populate the event which button has been clicked
     */
    openOnboarding?: (resourceId: string) => void;

    telemetry?: ITelemetry;
}

interface IUnmonitoredMachineState {
    linkSection: JSX.Element;
};

const ArmApiVersion: string = '2018-06-01';
const telemetryPreFix: string = 'UnmonitoredMachinePropertyPanel';
const getVmResourceEvent: string = '.GetVmResource';

/**
 * A component to visualize the properties of a generic unmonitored machine
 * @param props Visualization properties
 */
export class UnmonitoredMachinePropertyPanel extends React.Component<IUnmonitoredMachineProps, IUnmonitoredMachineState> {
    armDataProvider: ArmDataProvider;
    apiSequencyNumber: number;
    constructor(props?: IUnmonitoredMachineProps) {
        super(props);
        this.armDataProvider = new ArmDataProvider(EnvironmentConfig.Instance().getARMEndpoint(),
            () => { return InitializationInfo.getInstance().getAuthorizationHeaderValue(AuthorizationTokenType.Arm); });
        this.apiSequencyNumber = 0;

        this.state = {
            linkSection: <div />
        };
    }

    public componentDidMount() {
        this.getLinkSection(this.props.vmResourceId);
    }

    public componentWillReceiveProps(nextProps: Readonly<IUnmonitoredMachineProps>): void {
        if (this.props.vmResourceId !== nextProps.vmResourceId) {
            this.getLinkSection(nextProps.vmResourceId);
        }
    }

    public render() {
        let linkProperties: JSX.Element = null;
        // linkProperties is from grid entity.
        if (this.props.linkProperties) {
            linkProperties = (<ExpandableSection2
                title={DisplayStrings.QuickLinks}
                content={this.props.linkProperties}
                expandIcon={<ChevronRightSvg />}
                collapseIcon={<ChevronDownSvg />}
                isExpanded={true}
            />)
        }

        return (<>
            <PropertyPanelHeaderSection
                icon={<MachineLogoSVG />}
                title={this.props.machineName || DisplayStrings.undefine}
                subTitle={DisplayStrings.MachineSubTitle} />
            {this.state.linkSection}

            {linkProperties}
        </>);
    }

    /**
     * for un-monitored machine, if azure resource id is given, we can try to present user onboarding page
     */
    private getLinkSection(resourceId: string): void {
        const installInformSection: JSX.Element = <>
            <SimpleProperty propertyName={DisplayStrings.MachineNotMonitored}
                propertyValues={[DisplayStrings.UnmonitoredMachineMessage]} />

            <HyperLink linkUrl={'https://aka.ms/vminsightsinstall'} displayString={DisplayStrings.LearnMoreInstall} />
        </>;

        if (resourceId) {
            const localSequencyNumber: number = ++this.apiSequencyNumber;
            this.armDataProvider.executeRequest(HttpVerb.Get, this.getRequestPath(resourceId),
                Constants.MaxArmRequestTimeoutMs).then(() => {
                    if (localSequencyNumber !== this.apiSequencyNumber) {
                        return;
                    }
                    this.setState({
                        linkSection: <>
                            <SimpleProperty propertyName={DisplayStrings.MachineNotMonitored}
                                propertyValues={[DisplayStrings.TryOnboardDependcyAgentMessage]} />

                            <button className='on-boarding-button' title={DisplayStrings.TryNow}
                                onClick={() => { this.props.openOnboarding(resourceId) }} >
                                {DisplayStrings.TryNow}
                            </button>
                        </>
                    });
                }).catch((err) => {
                    // TODO: heart beat file has incorrect resource id for vm scale set member machine. 
                    // the vmscaleset id has same patten with VM resource id. 
                    // In this case, we'll fail to check the resource exists. so we show install link as backup plan.
                    // After OMS agent team fix the issue, then we have ablilty to know the resource is vm scale set and 
                    // we can navigate to vm scale set onboarding page.
                    // Also we might not authenticate to modify the vm, we will get 403 here
                    if (this.props.telemetry) {
                        this.props.telemetry.logEvent(
                            telemetryPreFix + getVmResourceEvent,
                            {
                                message: 'Fail to get Vm resource: ' + resourceId,
                                err: err
                            },
                            null
                        );
                    }
                    this.setState({ linkSection: installInformSection });
                });
        } else {
            this.setState({ linkSection: installInformSection });
        }
    }

    /**
     * Constructs ARM request path and query
     * @param resourceId target VM resource id
     */
    private getRequestPath(resourceId: string): string {
        return resourceId + '?api-version=' + ArmApiVersion;
    }
}
