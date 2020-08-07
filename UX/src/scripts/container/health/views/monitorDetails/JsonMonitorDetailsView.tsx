/** styles */
import '../../../../../styles/container/HealthPane.less';

/** tpl */
import * as React from 'react';

/** local */
import { JsonMonitorDetailsViewModel } from '../../viewmodels/monitorDetails/JsonMonitorDetailsViewModel';
import { IHealthMonitorDetailsViewProps, HealthMonitorDetailsViewBase } from './HealthMonitorDetailsViewBase';
import { HealthMonitorDetailsContainerViewModel } from '../../viewmodels/monitorDetails/HealthMonitorDetailsContainerViewModel';
import { IHealthMonitorDetailsViewModel } from '../../viewmodels/monitorDetails/IHealthMonitorDetailsViewModel';
import { HealthMonitorJsonInfo } from '../HealthMonitorJsonInfo';
import { HealthServicesFactory } from '../../factories/HealthServicesFactory';

/**
 * Node status monitor details view component
 */
export class JsonMonitorDetailsView extends HealthMonitorDetailsViewBase {
    /**
     * initializes an instance of the class
     * @param props component properties
     */
    public constructor(props: IHealthMonitorDetailsViewProps) {
        super(props);
    }

    /**
     * renders visualization of monitor details
     */
    protected renderMonitorDetails(): JSX.Element {
        const context = this.state.context as JsonMonitorDetailsViewModel;
        return <HealthMonitorJsonInfo info={context.details} />;
    }

    /**
     * creates component view model
     * @param parentContext parent component view model
     */
    protected createViewModel(parentContext: HealthMonitorDetailsContainerViewModel): IHealthMonitorDetailsViewModel {
        return new JsonMonitorDetailsViewModel(
            HealthServicesFactory.instance,
            parentContext, 
            this.forceUpdate.bind(this));
    }
}
