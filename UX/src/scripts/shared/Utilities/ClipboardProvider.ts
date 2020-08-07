/**
 * Wrapper around clipboard functionality; browser support is roughly "modern"
 * browsers, that is IE10+, versions of chrome and firefox since around 2014 or 215
 * there are hacks we could work to add this to older browsers, but we dont support
 * them in InfraInsights anyway (and other more pressing things will break anyway)
 */
export interface IClipboardProvider {
    /**
      * Temporarily adds an item to the end of the DOM which is used as a target
      * for copy operation (kind of like pressing ctrl-c / cmd-c)
      * @param inputText text to copy to the clipboard
      * @return {boolean} true if successful, false if security or browser limits prevent the copy
      */
    enact(inputText: string): boolean;
}
/**
 * Wrapper around clipboard functionality; browser support is roughly "modern"
 * browsers, that is IE10+, versions of chrome and firefox since around 2014 or 215
 * there are hacks we could work to add this to older browsers, but we dont support
 * them in InfraInsights anyway (and other more pressing things will break anyway)
 */
export class ClipboardProvider implements IClipboardProvider {

    /**
     * Temporarily adds an item to the end of the DOM which is used as a target
     * for copy operation (kind of like pressing ctrl-c / cmd-c)
     * @param inputText text to copy to the clipboard
     * @return {boolean} true if successful, false if security or browser limits prevent the copy
     */
    public enact(inputText: string): boolean {
        const textbox = document.createElement('textarea');
        textbox.value = inputText;
        document.body.appendChild(textbox);
        textbox.select();

        let result: boolean = false;
        try {
            const copyResult = document.execCommand('copy');
            if (copyResult) {
                result = true;
            }
        } catch { }

        document.body.removeChild(textbox);
        return result;
    }
}
