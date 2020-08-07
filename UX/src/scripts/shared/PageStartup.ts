import * as $ from 'jquery';

export const AuthorizationTokenReceivedEventName: string = 'authTokenReceived';

export class PageStartup {
    public static startupOnceDomLoaded(
        getRootElement: () => HTMLElement, 
        pageStart: (rootElement: HTMLElement) => void)
    : void {
        const loadedStates = ['complete', 'loaded', 'interactive'];

        if ((loadedStates.indexOf(document.readyState) !== -1) && document.body) {
            const rootElement = getRootElement();
            this.start(rootElement, pageStart);
        } else {
            window.addEventListener(
                'DOMContentLoaded', 
                () => { 
                    const rootElement = getRootElement();
                    this.start(rootElement, pageStart); 
                }, 
                false);
        }
    }

    public static hackForAutoResizerScrollbarIssue() {
        PageStartup.updateStylesForElement(
            '.selectable-grid .sg-body > div:first-child', 
            'overflow: visible !important; height: 0px !important; width: 0px !important;');

        PageStartup.updateStylesForElement('.selectable-grid .sg-body', 'overflow: hidden !important;');
    }

    private static updateStylesForElement(elementSelector: string, style: string) {
        const elementArray = $(elementSelector);
        if (!elementArray || !elementArray.length || !elementArray[0]) {
            return;
        }

        elementArray[0].style.cssText = style;
    }

    private static start(rootElement: HTMLElement, pageStart: (rootElement: HTMLElement) => void): void {
        pageStart(rootElement);
    }
}
