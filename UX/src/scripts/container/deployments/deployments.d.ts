declare interface IServiceFactory {
    generateDeploymentsService();
}


declare type PropertyChangedHandler = () => void;
declare type reactForceUpdateHandler = () => void;
declare type onCommandHandler = (commandData) => void;
declare type onPropertyChangedHandler = (propertyName) => void;

declare interface IDeploymentsPaneViewProps {
    serviceFactory: IServiceFactory;

    parentContext: any;

    telemetry: any;
}

declare class ServiceFactory implements IServiceFactory {
    static Instance();
    generateDeploymentsService();
}

declare class DeploymentsPaneView extends React.Component<IDeploymentsPaneViewProps, any> { }

declare class DeploymentsControlPanelView extends React.Component<any> { }