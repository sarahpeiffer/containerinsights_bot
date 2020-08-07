/** styles */
import '../../../../../styles/container/HealthPane.less';

/** tpl */
import * as React from 'react';

/** local */
import { IHealthMonitorDetailsViewModel } from '../../viewmodels/monitorDetails/IHealthMonitorDetailsViewModel';
import { HealthMonitorDetailsContainerViewModel } from '../../viewmodels/monitorDetails/HealthMonitorDetailsContainerViewModel';
import { HealthServicesFactory } from '../../factories/HealthServicesFactory';
import { HealthMonitorDetailsViewBase, IHealthMonitorDetailsViewProps } from './HealthMonitorDetailsViewBase';
import { HealthMonitorIconProvider } from '../HealthMonitorIconProvider';
import { DisplayStrings } from '../../../../shared/DisplayStrings';
import { 
    ContainerCpuUtilizationMonitorDetailsViewModel, IContainerCpuDetailsMonitorAccordionItemData 
} from '../../viewmodels/monitorDetails/ContainerCpuUtilizationMonitorDetailsViewModel';
import { AccordionItem, Accordion } from 'appinsights-iframe-shared';
import { ChevronUpSvg } from '../../../../shared/svg/chevron-up';
import { ChevronDownSvg } from '../../../../shared/svg/chevron-down';
import { HealthState } from '../../HealthState';

/** Container cpu monitor details view component */
export class ContainerCpuUtilizationMonitorDetailsView extends HealthMonitorDetailsViewBase {
    /**
     * initializes an instance of the class
     * @param props component properties
     */
    public constructor(props: IHealthMonitorDetailsViewProps) {
        super(props);
    }

    /** react callback invoked to render component */
    protected renderMonitorDetails(): JSX.Element { 
        const context = this.state.context as ContainerCpuUtilizationMonitorDetailsViewModel;

        const monitorStateTextClass = 'monitor-state-text ' + HealthState[context.state].toLocaleLowerCase();

        return (
            <div className='property-panel-content'>
                <div className='describe-property-panel'>
                    <div className='monitor-property-title' role='heading' aria-level={2}>{DisplayStrings.CurrentState}</div>
                    <div className='monitor-property-value'>
                        <span className={monitorStateTextClass}>{context.stateDisplayName}</span>
                    </div>
                    <div className='monitor-property-title' role='heading' aria-level={2}>{DisplayStrings.LastRecalculated}</div>
                    <div className='monitor-property-value'>
                        {context.getRelativeStateLastRecalculatedDateTime()}
                        &nbsp;{DisplayStrings.On}&nbsp;
                        {context.absoluteStateLastRecalculatedDateTime}
                    </div>
                    <div className='monitor-property-title' role='heading' aria-level={2}>{DisplayStrings.LastStateChange}</div>
                    <div className='monitor-property-value'>
                        {context.getRelativeLastStateChangeDateTime()}
                        &nbsp;{DisplayStrings.On}&nbsp;
                        {context.absoluteLastStateChangeDateTime}
                    </div>
                </div>
                {this.renderAccordion()}
            </div>
        );
    }

    /**
     * Creates the view model
     * @param parentContext parent view model
     */
    protected createViewModel(parentContext: HealthMonitorDetailsContainerViewModel): IHealthMonitorDetailsViewModel { 
        return new ContainerCpuUtilizationMonitorDetailsViewModel(
            HealthServicesFactory.instance,
            parentContext, 
            this.forceUpdate.bind(this)
        );
    }

    private renderAccordion(): JSX.Element {
        const accordionItems: AccordionItem[] = this.generateAccordionItems();

        return <div className='accordion'><Accordion items={accordionItems}></Accordion></div>;
    }

    private generateAccordionItems(): AccordionItem[] {
        const context = this.state.context as ContainerCpuUtilizationMonitorDetailsViewModel;
 
        const accordionItemsData: IContainerCpuDetailsMonitorAccordionItemData[] = context.getAccordionItemsData();

        const accordionItems: AccordionItem[] = accordionItemsData.map(
            (accordionItemData: IContainerCpuDetailsMonitorAccordionItemData, index: number) => {
            let accordionItem: AccordionItem = {
                content: undefined,
                heading: undefined,
                headingLabel: `${DisplayStrings.HealthMonitorAccordionLabel} ${accordionItemData.timestamp}`,
                id: `ContainerMemoryMonitor@${accordionItemData.timestamp}`,
                isExpanded: false
            };

            // separate function    
            accordionItem.heading = (isExpanded: boolean): JSX.Element => (
                <div className={`accordion-header ${ isExpanded ? 'expanded' : 'collapsed' }`}>
                    <div className='wrapper'>
                        <span className='accordion-header-icon'>{isExpanded ? <ChevronUpSvg/> : <ChevronDownSvg/>}</span>
                        <span className='accordion-header-text'>
                            <span className='accordion-header-timestamp'>{accordionItemData.timestamp}</span>
                            <span className='icon-container'>{HealthMonitorIconProvider.getIcon(accordionItemData.state)}</span>
                            <span className='accordion-header-state'>{accordionItemData.state}</span>               
                        </span>
                    </div>
                </div>
            );

            // split into separate function
            const instancesData = accordionItemData.instances;
            const contentPieces: JSX.Element[] = [];
            instancesData.forEach((instance) => {
                const contentPiece: JSX.Element = (
                    <div className='container-instance'>
                        <div className='wrapper'>
                            <div className='field'>
                                <div className='field-name'>{DisplayStrings.Instance}:</div>{instance.instanceName}
                            </div>
                            <div className='field'>
                                <div className='field-name'>{DisplayStrings.State}:</div>
                                <div className='icon-container'>{HealthMonitorIconProvider.getIcon(instance.state)}</div>{instance.state}
                            </div>
                            <div className='field'>
                                <div className='field-name'>{DisplayStrings.Usage}:</div>{instance.usage}
                            </div>
                        </div>
                    </div>
                );
                
                contentPieces.push(contentPiece);
            });
            accordionItem.content = <div className='accordion-content'>{contentPieces}</div>;

            return accordionItem;
        });

        return accordionItems;
    }
}
