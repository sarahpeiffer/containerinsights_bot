import * as React from 'react';
import { DirectLine } from 'botframework-directlinejs';
/** shared */
import { TelemetrySubArea, ITelemetry, TelemetryMainArea } from '../../../shared/Telemetry';
import { EnvironmentConfig } from '../../../shared/EnvironmentConfig';
import { TelemetryFactory } from '../../../shared/TelemetryFactory';
import { ErrorSeverity } from '../../../shared/data-provider/TelemetryErrorSeverity';
import { BlueLoadingDots, BlueLoadingDotsSize } from '../../../shared/blue-loading-dots';
import { InitializationInfo, AuthorizationTokenType } from '../../../shared/InitializationInfo';
import { BladeContext } from '../../BladeContext';
import { KubeConfigMonextHelper } from '../../../shared/data-provider/kube-config/KubeConfigMonextHelper';
import '../../../../styles/container/NewsPane.less';
import { NewsPaneViewModel } from '../viewmodels/NewsPaneViewModel';
import { BaseViewModel } from '../../../shared/BaseViewModel';
import { BotKubeProxyDataProvider } from './BotKubeProxyDataProvider';
import { MessageList } from '../models/MessageList';

/** prop type */
export interface INewsPaneViewProps {
    /** telemetry used for recording the news Tab */
    telemetry: ITelemetry;
    parentContext: BaseViewModel;
}

/**
 * Defines state set in the NewsPaneView
 */
export interface INewsPaneViewState {
    /** context (view model) */
    newsPaneViewModel: NewsPaneViewModel;
    question: string;
    messages: string[];
    typing: boolean;
    userId: string;
}

/**
 * News Pane View component
 */
export class NewsPaneView extends React.Component<INewsPaneViewProps, INewsPaneViewState> {
         /** data provider for kubernetes config file */
         private dataProvider: BotKubeProxyDataProvider;
        /** telemetry provider */
        private telemetry: ITelemetry;
        private directLine: DirectLine;
    /**
     * initializes a new instance of the component
     * @param props component properties
     */
    constructor(props) {
        super(props);        
        this.state = {
            newsPaneViewModel: this.createViewModel(props), 
            question: '', 
            messages: [],
            userId: '',
            typing: false
        };

        this.handleChange = this.handleChange.bind(this);
        this.sendBotMessage = this.sendBotMessage.bind(this);

        //Getting cluster id and token information to send to bot
        const bladeContext = BladeContext.instance();
        const clusterID = bladeContext.cluster.resourceId;
        const initInfo = InitializationInfo.getInstance();
        const token = initInfo.getAuthorizationHeaderValue(AuthorizationTokenType.Arm);
        this.setState({userId: token});
        this.dataProvider = new BotKubeProxyDataProvider(KubeConfigMonextHelper.Instance());

        //Get directline token to use in conversation.  Passing user token in now as that is what is being used as user id 
        this.dataProvider.getDirectLinetoken(token).then((directLineToken) => {
            //creating the directline connection
            this.directLine = new DirectLine({
                token: directLineToken,
                webSocket: false,
                timeout: 30000,
            });
            //subscribe to any incoming or outgoing messages sent to the bot and log them (so they show up in UI)
            this.directLine.activity$
            .filter(activity => activity.type === 'message')
            .subscribe(
            message => this.logBotMessages(message)
            );

            //check for typing event
            this.directLine.activity$
            .filter(activity => activity.type !== 'message')
            .subscribe((message) => {
                if (message['value'] === 'typing') {
                    this.setState({typing: true});
                    document.getElementById('chatScroll').scrollTop = document.getElementById('chatScroll').scrollHeight;
                }
            });
            //get kube config data needed to send to bot
            this.dataProvider.getKubeConfigAndClusterProperties().then((kubeData) => {
                let userInfoJson = {'token' : token, 'clusterID' : clusterID, 
                    'kubeAPIToken': kubeData.token, 'apiServer': kubeData.apiServer, 'cert': kubeData.certificate
                };
                //post initial activity event to bot that contains user information.  this starts the conversation
                this.directLine.postActivity({
                    from: { id: this.state.userId, name: 'userName' },
                    name: 'sendUserInfo',
                    type: 'event',
                    value: userInfoJson
                })
                .subscribe(function (id) {
                    console.log(kubeData);
                });  
            })
                .catch((error) => {
                //if we can't get the kube config info send token and cluster anyway
                let userInfoJson = {'token' : token, 'clusterID' : clusterID, 
                'kubeAPIToken' : null, 'apiServer' : null, 'cert' : null};
                this.directLine.postActivity({
                    from: { id: this.state.userId, name: 'userName' },
                    name: 'sendUserInfo',
                    type: 'event',
                    value: userInfoJson
                })
                .subscribe(function (id) {
                    console.log('sent null kube api info');
                }); 
            });
        });
    }

    /**
     * react callback invoked just before mounting occurs
     * 
     * TODO: replace with static getDerivedStateFromProps(props, state) when switching react v17+
     */
    public componentWillMount() {
        this.state.newsPaneViewModel.onLoad();
    }

    public logBotMessages(message) {
        if (message['text'] !== undefined) {
            this.setState({ messages: [...this.state.messages, message] });
            let chatArea = document.getElementById('chatScroll');
            chatArea.scrollTop = chatArea.scrollHeight;
            this.setState({typing: false})
        }
    }

    public renderMessages() {
            return (
                <div className='chatArea'>
                <div className='innerChatArea' id='chatScroll'>
                <MessageList messages={this.state.messages} sendBotMessage={this.sendBotMessage}>
                </MessageList>
                {this.state.typing && <div className='container' key='loading'>
                <BlueLoadingDots size={BlueLoadingDotsSize.medium}/>
                </div>}
                </div>
                </div>
            );
    }

    public renderSearch() {
        let searchBoxCss = 'bot-search';
        return ( 
            <form onSubmit={this.sendBotMessage(this.state.question)}>
            <label>
                <input type='text' className={searchBoxCss}
                placeholder='Type your message'
                value={this.state.question} onChange={this.handleChange} />
            </label>
            <input type='submit' value='Send' className='search-button'/>
            </form>
        );
    }

    public renderShortcuts() {
        let diagnosticsString = 'Diagnostics {Troubleshooting & Errors}';
        return(
            <div className='shortcuts'>
                <span className='shortcut'><label>Shortcuts: </label></span>
                <span className='shortcut'><a onClick={this.sendBotMessage('Diagnostics')} 
                className='container-click'>{diagnosticsString}</a></span>
                <span className='shortcut'><a onClick={this.sendBotMessage('Agent troubleshooting')} 
                className='container-click'>Agent Troubleshooting</a></span>
                <span className='shortcut'><a onClick={this.sendBotMessage('Kusto')} 
                className='container-click'>KQL Queries</a></span>
                <span className='shortcut'><a onClick={this.sendBotMessage('Documentation')} 
                className='container-click'>Documentation</a></span>
                <span className='shortcut'><a onClick={this.sendBotMessage('Time')}
                className='container-click'>Time Range for Diagnostics</a></span>
            </div>
        )
    }
    public handleChange(event) {
        this.setState({question: event.target.value});
    }

    //sends message to bot 
    public sendBotMessage = value => (e: React.FormEvent) => {
        e.preventDefault();
        this.directLine.postActivity({
            from: { id: this.state.userId, name: 'userName' },
            type: 'message',
            text: value
        }).subscribe(
            id => console.log('Posted activity, assigned ID ', id),
            error => console.log('Error posting activity', error)
        );
        this.setState({question: ''});
    }

    /**
     * renders component
     * @returns component visualization
     */
    public render(): JSX.Element {
        if (EnvironmentConfig.Instance().isConfigured()) {
            if (!this.telemetry) {
                this.telemetry = TelemetryFactory.get(TelemetryMainArea.Containers);
                this.telemetry.setContext({ subArea: TelemetrySubArea.NewsTab }, false);
                this.telemetry.logPageView(TelemetrySubArea.NewsTab.toString());
            }
        }
        try {
            return (<div className='getting-started-blog-postItem-panel'>
                { this.renderMessages() }
                { this.renderShortcuts()}
                { this.renderSearch() }
                </div>);
        } catch (exc) {
            this.telemetry.logException(exc, 'news Tab', ErrorSeverity.Error, null, null);
            return (<div className='deployments-load-msg-container'></div>);
        }
    }

    /**
     * creates view model for component based on properties received 
     * @param props component properties
     */
    private createViewModel(props: INewsPaneViewProps) {
        if (!props) { throw new Error(`@props may not be null at NewsPaneView.createViewModel()`); }
        return new NewsPaneViewModel(this.props.telemetry, this.props.parentContext as any, this.forceUpdate.bind(this));
    }
}
