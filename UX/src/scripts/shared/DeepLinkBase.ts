import * as d3 from 'd3';

import { IWorkspaceInfo } from './IWorkspaceInfo';
import { DisplayStrings } from './DisplayStrings';

import { StringHelpers } from './Utilities/StringHelpers';
import { IClipboardProvider } from './Utilities/ClipboardProvider';

/**
 * Some shared functionality surrounding the deep linking implementations... they all
 * require the ability to generate a deep link, copy to clipboard (using the clipboardprovider)
 * and they all serialize workspace if provided...
 */
export abstract class DeepLinkBase {
    protected dataPackage: any;
    private clipboardProvider: IClipboardProvider; 

    /**
     * .ctor() all deep links utilize workspace if provided; ensure present for all deep linking if provided
     * @param workspace workspace selected
     */
    constructor(workspace: IWorkspaceInfo, clipboardProvider: IClipboardProvider) {
        this.clipboardProvider = clipboardProvider;

        this.dataPackage = {};
        this.loadWorkspace(workspace);
    }

    /**
      * we can redesign this a little bit later to ensure unit tesability
      * @param rootUri each of the deep links has a bit of a unique url, they provide it here
      * @returns {void}
      */
    public generateDeepLink(rootUri: string): string {
        try {
            const rawLink = JSON.stringify(this.dataPackage);
            const encodedLink = StringHelpers.encode(rawLink);
            return StringHelpers.replaceAll(rootUri, '${CONTENT_FILL}', encodedLink);
        } catch { }

        return null;
    }

    /**
     * not unit testable... wraps the clipboard provider (who is also not unit testable)
     * Note: this could probably be replaced by a utility function to simplify deep link object
     * but since there is only one use for it, this felt *OK*ish
     * @param deepLink 
     */
    public copyToClipboard(deepLink: string): void {
        let result: boolean = false;

        if (deepLink) {
            try {
                result = this.clipboardProvider.enact(deepLink);
            } catch { }
        }

        if (!result) {
            this.showDisappearingPopup(DisplayStrings.DeepLinkFailed, false);
        } else {
            this.showDisappearingPopup(DisplayStrings.DeepLinkSucess, true);
        }
    }

    private showDisappearingPopup(message: string, good: boolean) {
        const copyButton = d3.select('.copyButton');

        const rootDiv = copyButton.append('div');
        rootDiv.style({
            position: 'relative',
            background: 'white',
            padding: '5px',
            border: good ? '1px solid green' : '1px solid red',
            opacity: 0,
            clear: 'both'
        }).append('span').text(message);

        rootDiv.transition().style('opacity', 1).duration(750)
            .transition().style('opacity', 0).duration(750).delay(3000).each('end', () => {
                rootDiv.remove();
            });
    }

    private loadWorkspace(selectedWorkspace: IWorkspaceInfo) {
        if (!selectedWorkspace) {
            return;
        }
        this.dataPackage.workspace = selectedWorkspace;
    }
}
