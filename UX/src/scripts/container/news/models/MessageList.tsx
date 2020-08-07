import * as React from 'react';
export interface MessageProperties {
    messages: string [];
    sendBotMessage: (value: string) => (e: React.FormEvent) => void;
}
export class MessageList extends React.Component<MessageProperties> {
    constructor(props: MessageProperties) {
        super(props);
    }
    render() {
        return (
        this.props.messages.map(message => {
            return this.generateMessageElement(message);
        }));
    }

    //determines if message is json and what color and positioning should be based off of who sent it
    public generateMessageElement(message: string) {
        if (message['from']['id'] === 'sarah-bot-dispatch2') {
            if (((message['text'] || '').indexOf('Name') > -1) && message['text'].indexOf('{') > -1) {
                let messageJson: any = null;
                try {
                    messageJson = JSON.parse(message['text']);
                } catch (e) {
                console.log('json failed to parse');
                }
                if (messageJson) {
                    let rows: JSX.Element[] = [];
                    let events: JSX.Element[] = [];
                    {Object.keys(messageJson).forEach((key) => {
                        if ((key).indexOf(':') > -1) {
                            rows.push(<tr><td>{key}</td><td>{messageJson[key]}</td></tr>);
                        } else if (!(key === 'Name')) {
                            if (Array.isArray(messageJson[key])) {
                                let arrayElements: JSX.Element[] = [];
                                for (let i = 0; i < messageJson[key].length; ++i) {
                                    arrayElements.push(this.renderClickableOptions(messageJson[key][i]));
                                }
                                events.push(<div><div className='table-title'>{key}</div><div>{arrayElements}</div></div>);
                            } else {
                            events.push(<div><div className='table-title'>{key}</div><div>{messageJson[key]}</div></div>);
                            }
                        }                                       
                    })}
                    return(<div className='container' key={message['id']}>
                    <div className='table-title'>{messageJson['Name']}</div>
                    <table><tbody>
                    {rows}
                    </tbody></table>
                    {events}
                    </div>);
                } else {
                    return (<div className='container' key={message['id']}> {message['text']} </div>); 
                }
            }
            if (message['text'].indexOf('[') > -1 && message['text'].indexOf('(') > -1) {
                return (<div className='container' key={message['id']}> {this.renderLinks(message['text'])} </div>);
            }
            return (<div className='container' key={message['id']}> {this.renderClickableOptions(message['text'])} </div>);
        }
        return (<div className='container darker' key={message['id']}> {message['text']} </div>);
    }

    //checks for hyperlinks in the message
    public renderLinks(message: string) {
        let bracketSplit = message.split('[');
        let messageElements: JSX.Element[] = [];
        for (let i = 0; i < bracketSplit.length; ++i) {
            let endOfLink = bracketSplit[i].indexOf(')');
            let nameEndIndex = bracketSplit[i].indexOf(']');
            let linkName = bracketSplit[i].substring(0, nameEndIndex);
            let link = bracketSplit[i].substring(nameEndIndex + 2, endOfLink);
            messageElements.push(<span><a href={link} target='_blank'>{linkName}</a></span>);
            let restOfMessage = bracketSplit[i].substring(endOfLink + 1, bracketSplit[i].length);
            messageElements.push(<span>{restOfMessage}</span>)
            
        }
        return messageElements;
    }

    //checks for clickable options in the message
    public renderClickableOptions(message: string) {
        let paranthesesIndex = message.indexOf('(');
        let asterikIndex = message.indexOf('*');
        if (paranthesesIndex > -1 && asterikIndex > -1 && (paranthesesIndex - asterikIndex) === 1) {
            let asterikSplit = message.split('*');
            let messageElements: JSX.Element[] = [];
            for (let i = 0; i < asterikSplit.length; ++i) {
                if (asterikSplit[i].indexOf('(') === 0) {
                    let endOfClickOption = asterikSplit[i].indexOf(')');
                    let clickOption = asterikSplit[i].substring(1, endOfClickOption);
                    messageElements.push(<span><a onClick={this.props.sendBotMessage(clickOption)} 
                    className='container-click'>{clickOption}</a></span>);
                } else {
                    messageElements.push(<span>{asterikSplit[i]}</span>)
                }
            }
        return(<div>{messageElements}</div>)
        } else {
            return(<div>{message}</div>)
        }
    }
}
