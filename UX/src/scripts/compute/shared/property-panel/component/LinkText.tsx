import * as React from 'react';

export interface ILinkTextProps {
    message: string;
    links?: ILink[];
}

export interface ILink {
    label: string;
    href: string;
}

/**
 * The class takes message param in the following manner: "Hello {0} Welcome to {1}"
 * {0}...{n} is replaced by nth linkUri and linkText in the links[] param passed along with the message param.
 *
 * @export
 * @class LinkText
 * @extends {React.Component<ILinkTextProps>}
 */
export class LinkText extends React.Component<ILinkTextProps> {
    constructor(props: ILinkTextProps) {
        super(props);
    }

    public render(): JSX.Element {
        const linkText: JSX.Element[] = this.parseMessage(this.props.message)

        return (<>{linkText}</>);
    }

    // This method parse message param. It replaces {n} with <a href> tags with linkUri and linkText provided in the links param.
    // It returns JSX Element which is used to finally render the texts with links in InfoBox Component.
    private parseMessage(message: string): JSX.Element[] {
        if (!message) {
            return null;
        }
        const messages: string[] = message.split(/{[0-9]+}/);
        const elements: JSX.Element[] = messages.map((message, index) => {
            return this.getElement(message, index);
        });
        return elements;
    }

    // This function takes message param and linkIndex, which refers to index in the links param.
    // It returns JSX Element containing message as well a href tag containing linkText and linkUri, if it exists.
    private getElement(message: string, linkIndex: number): JSX.Element {
        if (this.props.links && this.props.links[linkIndex]) {
            const link: ILink = this.props.links[linkIndex];
            return (<>{message}<a href={link.href} target='_blank'>{link.label}</a></>);
        }
        return (<>{message}</>);
    }
}
