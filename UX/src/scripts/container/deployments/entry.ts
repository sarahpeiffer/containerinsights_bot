import '../../../styles/container/Deployments.less';

import { DeploymentsPaneView } from './views/DeploymentsPaneView';
import { DeploymentsControlPanelView } from './views/DeploymentsControlPanelView';
import { ServiceFactory } from './factories/ServiceFactory';

(window as any).DeploymentsPaneView = DeploymentsPaneView;
(window as any).DeploymentsControlPanelView = DeploymentsControlPanelView;
(window as any).ServiceFactory = ServiceFactory;
