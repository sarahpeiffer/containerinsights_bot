/*
* A simple class storing Connection Panel Header title and subtitle
*/
export class ConnectionPanelHeader {
    private title: string;
    private subtitle: string;

    constructor(title: string, subtitle: string) {
        this.title = title;
        this.subtitle = subtitle;
    }

    public getTitle(): string {
        return this.title;
    }

    public getSubtitle(): string {
        return this.subtitle;
    }
};
