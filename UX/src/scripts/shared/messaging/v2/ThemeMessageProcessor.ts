/** local */
import { globals } from '../../globals/globals';

/**
 * Portal theme names
 */
enum PortalThemeName {
    Light = 'light',
    Dark = 'dark'
}

/**
 * Provides functionality for handling theme messages
 */
export class ThemeMessageProcessor implements EventListenerObject {
    /** theme style currently applied to the body html element */
    private appliedBodyThemeStyleName: string;

    /**
     * Initializes an instance of the class
     */
    private constructor() {
        this.appliedBodyThemeStyleName = null;
        this.handleEvent = this.handleEvent.bind(this);
    }

    /**
     * Gets singleton instance
     * @returns instance of the global theme message processor
     */
    public static Instance(): EventListenerObject {
        if (!globals.themeMessageProcessor) {
            globals.themeMessageProcessor = new ThemeMessageProcessor();
        }

        return globals.themeMessageProcessor;
    }

    /**
     * Processes theme change event
     * @param event theme change event
     */
    public handleEvent(event: any): void {
        const themeName = this.getThemeName(event);
        const themeStyleName = (themeName === PortalThemeName.Dark ? 'dark' : 'light');
        this.applyThemeStyle(themeStyleName);
    }

    /**
     * Returns theme style name from incoming 'theme' event
     * @param event 'theme' event received
     * @returns theme style name to apply to ux
     */
    private getThemeName(event: any): string {
        if (!event || !event.detail || !event.detail.rawData) {
            console.warn('[ThemeMessageProcessor] "Theme" event does not have detail.rawData property');
            return null;
        }

        const messageData = JSON.parse(event.detail.rawData);

        if (!messageData || !messageData.theme || !messageData.theme.name) {
            console.warn('[ThemeMessageProcessor] "Theme" event data does not have theme.name property');
            return null;
        }

        return messageData.theme.name;
    }

    /**
     * Applies theme style to ux
     * @param themeStyleName them style name
     */
    private applyThemeStyle(themeStyleName: string): void {
        if (!themeStyleName) { 
            console.warn('[ThemeMessageProcessor] Unable to apply theme style - style name is null, empty or undefined');
            return; 
        }

        const currentBodyClassName = document.body.className;
        let effectiveBodyClassName = '';

        if (!currentBodyClassName) {
            effectiveBodyClassName = themeStyleName;
        } else {
            // remove currently applied theme class name
            const classes = currentBodyClassName.split(' ');
            let currentThemeClassIndex = this.appliedBodyThemeStyleName ? classes.indexOf(this.appliedBodyThemeStyleName) : -1;

            if (currentThemeClassIndex > -1) {
                classes[currentThemeClassIndex] = themeStyleName;
            } else {
                classes.push(themeStyleName);
            }

            effectiveBodyClassName = classes.join(' ');
        }

        // apply theme class
        document.body.className = effectiveBodyClassName;
        this.appliedBodyThemeStyleName = themeStyleName;
    }
}
