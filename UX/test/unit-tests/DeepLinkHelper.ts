import { BasePortalUri } from '../../src/scripts/shared/GlobalConstants';
import { StringHelpers } from '../../src/scripts/shared/Utilities/StringHelpers';
import { IClipboardProvider } from '../../src/scripts/shared/Utilities/ClipboardProvider';

/**
 * mock out clipboardprovider 
 */
class ClipboardMock implements IClipboardProvider {
    enact(inputText: string): boolean {
        throw new Error('Method not implemented.');
    }  
}

export const MockClipboardProvider: IClipboardProvider = new ClipboardMock();

export class DeepLinkHelper {
    public static getUrl(): string {
        const baseUri = BasePortalUri;
        return StringHelpers.replaceAll(baseUri, '${ACTION}', 'computemaps');
    }

    public static getExpected(complete: string, obj: any): string {
        const expectedEncoding = StringHelpers.encode(JSON.stringify(obj));
        return StringHelpers.replaceAll(complete, '${CONTENT_FILL}', expectedEncoding);
    }
}
