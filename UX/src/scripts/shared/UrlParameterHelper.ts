export class UrlParameterHelper {
    public static getEventSource(): string {
        return this.getUrlParameter('eventSource');
    }

    public static getUrlParameter(parameter: string): string {
        const href: string = window.location.href;
        let regex: RegExp = new RegExp('.*' + parameter + '=([^&#]*).*');
        const result = href.replace(regex, '$1');
        if (result && result !== href) {
            return result;
        }
        return '';
    }
}
