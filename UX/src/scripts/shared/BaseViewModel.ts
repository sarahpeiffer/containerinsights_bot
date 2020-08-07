
export type onPropertyChangedHandler = (propertyName: string) => void;
export type onCommandHandler = (commandData: any) => void;
export type reactForceUpdateHandler = () => void;

/**
 * MVVM primitive... all view models should extend this
 */
export abstract class BaseViewModel {

    private static triggers: StringMap<onCommandHandler[]> = {};
    
    protected forceUpdate: reactForceUpdateHandler = null;
    private propertyChangedHandlers: onPropertyChangedHandler[] = [];

    /**
     * .ctor()
     * @param forceUpdate ability to force update a react control
     * @param parentContext the parental context, defaults to ourselves if none is provided
     */
    constructor(forceUpdate: reactForceUpdateHandler, public parentContext) {
        if (parentContext === null) {
            this.parentContext = this;
        }
        this.forceUpdate = forceUpdate;
    }

    /**
     * event triggers for things like button pressed...
     * @param triggerName name of event to trigger
     * @param commandData any data we wish to provide
     */
    public invokeCommandAction(triggerName: string, commandData: any) {
        if (!BaseViewModel.triggers.hasOwnProperty(triggerName)) {
            return;
        }

        BaseViewModel.triggers[triggerName].forEach((trigger) => {
            trigger(commandData);
        });
    }

    /**
     * subscribe for event trigger notifications
     * @param triggerName name of trigger we would like to handle
     * @param commandHandler the callback to trigger
     */
    public handleEventTrigger(triggerName: string, commandHandler: onCommandHandler) {
        if (!BaseViewModel.triggers.hasOwnProperty(triggerName)) {
            BaseViewModel.triggers[triggerName] = [];
        }

        BaseViewModel.triggers[triggerName].push(commandHandler);
    }

    /**
     * subscribe for any property change notifications
     * @param onPropertyChangedHandler callback to trigger when properties change
     */
    public handlePropertyChanged(onPropertyChangedHandler: onPropertyChangedHandler) {
        this.propertyChangedHandlers.push(onPropertyChangedHandler);
    }

    public unregisterPropertyChangeHandler(onPropertyChangedHandler: onPropertyChangedHandler) {
        const indexOfTarget = this.propertyChangedHandlers.indexOf(onPropertyChangedHandler);
        if (indexOfTarget < 0) {
            return;
        }

        this.propertyChangedHandlers.splice(indexOfTarget, 1);
    }

    /**
     * use this to notify react that it needs to re-render anyone bound to this property
     * @param key property that is changing
     */
    public propertyChanged(key: string) {

        try {
            if (this.propertyChangedHandlers.length > 0) {
                this.propertyChangedHandlers.forEach((handler) => {
                    handler(key);
                });
            }
        } catch (exc) { 
            console.log('Exception: ', exc);
        }

        this.forceUpdate();
    }
}
