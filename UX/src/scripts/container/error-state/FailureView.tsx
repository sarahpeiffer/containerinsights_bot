/** tpl */
import * as React from 'react';

// TODO: remokve this
// tslint:disable:max-line-length
import { FailureViewModel } from './FailureViewModel';
import { ErrorCodes } from '../../shared/ErrorCodes';
import { IFailureViewParentContext } from './IFailureViewParentContext';
import { Utility } from '../../shared/Utilities/Utility';
import { TelemetryFactory } from '../../shared/TelemetryFactory';
import { TelemetryMainArea } from '../../shared/Telemetry';
import { DisplayStrings } from '../../shared/DisplayStrings';

/** prop type */
export interface IFailureViewProps {
    parentContext: IFailureViewParentContext;
}

/** state type */
interface IFailureViewState {
    /** context (view model) */
    context: FailureViewModel;
}

/**
 * Deployments central UI component.
 */
export class FailureView extends React.Component<IFailureViewProps, IFailureViewState> {
    /**
     * initializes a new instance of the class
     * @param props component properties
     */
    constructor(props: IFailureViewProps) {
        super(props);

        this.state = {
            context: new FailureViewModel(props.parentContext, this.forceUpdate.bind(this))
        };
    }

    public render() {
        let diagnosticsAdvancedBodyClass = 'deployments-advanced-diagnostics-pane-body';
        let advancedTitleCollapseWord = '(' + DisplayStrings.ContainerFailureErrorAdvancedTitleCollapseWord + ')';
        if (this.state.context.advancedBodyHidden) {
            diagnosticsAdvancedBodyClass += ' hidden';
            advancedTitleCollapseWord = '(' + DisplayStrings.ContainerFailureErrorAdvancedTitleExpandWord + ')';
        }

        const titleTranslated = this.getErrorTitle();
        const centerBody = this.getSubTitleText();

        return <div className='deployments-load-failed-wrapper'>


            <div className='deployments-load-failed-pane'>
                <h1>{titleTranslated}</h1>

                {centerBody}

                {this.renderAdditionalHelp()}

                <p>{DisplayStrings.ContainerFailureErrorAdditionalHelpText}</p>

                <div className='deployments-advanced-diagnostics-pane'>
                    <div className='deployments-advanced-diagnostics-pane-title'>
                        <span className='deployments-title-main'>{DisplayStrings.ContainerFailureErrorAdvancedText}</span>
                        <span className='deployments-advanced-diagnostics-pane-title-toggle'
                            onClick={() => {
                                const telemetry = TelemetryFactory.get(TelemetryMainArea.Containers);
                                telemetry.logEvent('ToggleAdvancedBodyCollapse', null, null);
                                this.state.context.toggleAdvancedBodyCollapse();
                            }}
                            onKeyDown={(e) => {
                                Utility.AffirmativeKeyDown(e, () => {
                                    const telemetry = TelemetryFactory.get(TelemetryMainArea.Containers);
                                    telemetry.logEvent('ToggleAdvancedBodyCollapse', null, null);
                                    this.state.context.toggleAdvancedBodyCollapse();
                                })
                            }}>{advancedTitleCollapseWord}</span></div>
                    <div className={diagnosticsAdvancedBodyClass}>{String(this.state.context.loadFailedReason)}</div>
                </div>
            </div>
        </div>;
    }

    private getErrorTitle() {
        switch (this.state.context.errorCodeRaw) {
            case 403:
                return DisplayStrings.ContainerFailureUnauthorizedErrorTitle;
            case ErrorCodes.HealthFailed:
                return DisplayStrings.HealthErrorTitle;
            default:
                return DisplayStrings.ContainerFailureUnexpectedError;
        }
    }

    private getSubTitleText() {
        switch (this.state.context.errorCodeRaw) {
            case 403:
                return <><div className='deployments-sub-title'>It appears we could not authenticate your identity.  This may be caused by permissions required for the Live Data feature which are not properly configured on your AKS cluster.</div><div className='deployments-sub-title-second'>If this is an Azure Active Directory-enabled cluster, you can try {this.renderSignOut()} to start a new session.  If the issue persists, review the following {this.renderDocumentation()} for troubleshooting steps to help resolve this issue.</div></>;
            case ErrorCodes.HealthFailed:
                return DisplayStrings.HealthErrorSubtitle;
            default:
                return this.renderOopsMessage();
        }
    }

    private renderDocumentation() {
        return <a href='http://aka.ms/livelogRBAC' target='_blank'>documentation</a>
    }

    private renderSignOut() {
        return <span className='deployments-advanced-diagnostics-pane-title-toggle'
            onClick={() => {
                const telemetry = TelemetryFactory.get(TelemetryMainArea.Containers);
                telemetry.logEvent('Logout', null, null); this.state.context.forceLogoutAd();
            }
            }
            onKeyDown={(e) => {
                Utility.AffirmativeKeyDown(e, () => {
                    const telemetry = TelemetryFactory.get(TelemetryMainArea.Containers);
                    telemetry.logEvent('Logout', null, null);
                    this.state.context.forceLogoutAd();
                })
            }}
        >signing-out</span>;
    }

    private renderOopsMessage(): JSX.Element {
        const translatedStringFromMonExtArray: string[] = DisplayStrings.ContainerFailureErrorMessage.split('${0}');
        const translatedAADErrorArray: string[] = DisplayStrings.ContainerFailureAADErrorMessage.split('${0}');

        let translatedStringFromMonExt_0: string = DisplayStrings.ContainerStatusUnknownTitle;
        let translatedStringFromMonExt_1: string = DisplayStrings.ContainerStatusUnknownTitle;
        let translatedStringFromMonExt_2: string = DisplayStrings.ContainerStatusUnknownTitle;

        if (translatedStringFromMonExtArray && translatedStringFromMonExtArray.length && translatedStringFromMonExtArray.length === 3) {
            translatedStringFromMonExt_0 = translatedStringFromMonExtArray[0];
            translatedStringFromMonExt_1 = translatedStringFromMonExtArray[1];
            translatedStringFromMonExt_2 = translatedStringFromMonExtArray[2];
        }

        let translatedAADErrorArray_0: string = DisplayStrings.ContainerStatusUnknownTitle;
        let translatedAADErrorArray_1: string = DisplayStrings.ContainerStatusUnknownTitle;
        let translatedAADErrorArray_2: string = DisplayStrings.ContainerStatusUnknownTitle;
        let translatedAADErrorArray_3: string = DisplayStrings.ContainerStatusUnknownTitle;
        let translatedAADErrorArray_4: string = DisplayStrings.ContainerStatusUnknownTitle;

        if (translatedAADErrorArray && translatedAADErrorArray.length && translatedAADErrorArray.length === 5) {
            translatedAADErrorArray_0 = translatedAADErrorArray[0];
            translatedAADErrorArray_1 = translatedAADErrorArray[1];
            translatedAADErrorArray_2 = translatedAADErrorArray[2];
            translatedAADErrorArray_3 = translatedAADErrorArray[3];
            translatedAADErrorArray_4 = translatedAADErrorArray[4];
        }

        return <>{translatedStringFromMonExt_0}
            <span className='deployments-advanced-diagnostics-pane-title-toggle'
                onClick={() => {
                    const telemetry = TelemetryFactory.get(TelemetryMainArea.Containers);
                    telemetry.logEvent('RefreshPage', null, null); this.state.context.refreshPage();
                }}
                onKeyDown={(e) => {
                    Utility.AffirmativeKeyDown(e, () => {
                        const telemetry = TelemetryFactory.get(TelemetryMainArea.Containers);
                        telemetry.logEvent('RefreshPage', null, null);
                        this.state.context.refreshPage();
                    })
                }}
            >
                {translatedStringFromMonExt_1}
            </span> &nbsp;
        {translatedStringFromMonExt_2}
            {' ' + translatedAADErrorArray_0}
            <span className='deployments-advanced-diagnostics-pane-title-toggle'
                onClick={() => {
                    const telemetry = TelemetryFactory.get(TelemetryMainArea.Containers);
                    telemetry.logEvent('Logout', null, null); this.state.context.forceLogoutAd();
                }
                }
                onKeyDown={(e) => {
                    Utility.AffirmativeKeyDown(e, () => {
                        const telemetry = TelemetryFactory.get(TelemetryMainArea.Containers);
                        telemetry.logEvent('Logout', null, null);
                        this.state.context.forceLogoutAd();
                    })
                }}
            >
                {' ' + translatedAADErrorArray_1 + ' '}
            </span>
            {' ' + translatedAADErrorArray_2 + ' '}
            <a href='http://aka.ms/livelogRBAC' target='_blank'>
                {' ' + translatedAADErrorArray_3 + ' '}
            </a>
            {translatedAADErrorArray_4}</>;
    }

    private renderAdditionalHelp(): JSX.Element[] {

        let additionalHelpMessage = null;

        let additionalHelpClass = '';

        switch (this.state.context.errorCodeRaw) {
            case 401:
                additionalHelpMessage = this.errorCode401HelpMessage();
                break;
            case 403:
                additionalHelpMessage = this.errorCode403HelpMessage();
                break;
            case ErrorCodes.PopupFailedLogin:
                additionalHelpMessage = this.errorCodePopupClosed();
                break;
            case ErrorCodes.HealthFailed:
                additionalHelpMessage = this.errorCodeHealthLoadFailed();
                additionalHelpClass = ' extra-top-margin';
                break;
            default:
                additionalHelpMessage = DisplayStrings.ContainerFailureAdditionalHelpText;
        }

        if (!this.state.context.canOfferHelp) { return [] };

        const helpItems = [];

        if (this.state.context.errorCodeRaw === 403 || this.state.context.errorCodeRaw === 401) {
            helpItems.push(<div className='deployments-failure-error-code-pane'>
                <div className='deployments-title-main'>{DisplayStrings.ContainerFailureErrorCode}</div>
                <div className='deployments-failure-error-code'>{this.state.context.errorCode}</div>
            </div>);
        }

        if (this.state.context.errorCodeRaw !== ErrorCodes.HealthFailed) {
            helpItems.push(
                <div className='deployments-failure-error-code-pane'>
                    <div className='deployments-title-main'>{DisplayStrings.ContainerFailureErrorKubeApiPath}</div>
                    <div className='deployments-failure-error-code'>{this.state.context.k8sErrorPath}</div>
                </div>);
        }

        helpItems.push(
            <div className={additionalHelpClass}>
                <div className='deployments-title-main'>{DisplayStrings.ContainerFailureErrorAdditionalHelp}</div>
                <div className='deployments-additional-help-body'>
                    {additionalHelpMessage}
                </div>
            </div>);

        return helpItems;
    }

    private errorCodeHealthLoadFailed() {
        const translatedCheckAgentTroubleShootingStepArray: string[] = DisplayStrings.CheckAgentTroubleShootingStep.split('${0}');

        let translatedCheckAgentTroubleShootingStepArray_0: string = DisplayStrings.ContainerStatusUnknownTitle;
        let translatedCheckAgentTroubleShootingStepArray_1: string = DisplayStrings.ContainerStatusUnknownTitle;
        let translatedCheckAgentTroubleShootingStepArray_2: string = DisplayStrings.ContainerStatusUnknownTitle;
        let translatedCheckAgentTroubleShootingStepArray_3: string = DisplayStrings.ContainerStatusUnknownTitle;
        let translatedCheckAgentTroubleShootingStepArray_4: string = DisplayStrings.ContainerStatusUnknownTitle;

        if (translatedCheckAgentTroubleShootingStepArray && translatedCheckAgentTroubleShootingStepArray.length && translatedCheckAgentTroubleShootingStepArray.length === 5) {
            translatedCheckAgentTroubleShootingStepArray_0 = translatedCheckAgentTroubleShootingStepArray[0];
            translatedCheckAgentTroubleShootingStepArray_1 = translatedCheckAgentTroubleShootingStepArray[1];
            translatedCheckAgentTroubleShootingStepArray_2 = translatedCheckAgentTroubleShootingStepArray[2];
            translatedCheckAgentTroubleShootingStepArray_3 = translatedCheckAgentTroubleShootingStepArray[3];
            translatedCheckAgentTroubleShootingStepArray_4 = translatedCheckAgentTroubleShootingStepArray[4];
        }

        const translatedSeeCITroubleshootingGuide: string[] = DisplayStrings.SeeCITroubleshootingGuide.split('${0}');

        let translatedSeeCITroubleshootingGuide_0: string = DisplayStrings.ContainerStatusUnknownTitle;
        let translatedSeeCITroubleshootingGuide_1: string = DisplayStrings.ContainerStatusUnknownTitle;

        if (translatedSeeCITroubleshootingGuide && translatedSeeCITroubleshootingGuide.length && translatedSeeCITroubleshootingGuide.length === 2) {
            translatedSeeCITroubleshootingGuide_0 = translatedSeeCITroubleshootingGuide[0];
            translatedSeeCITroubleshootingGuide_1 = translatedSeeCITroubleshootingGuide[1];
        }

        return (
            <div className='troubleshooting-steps-list'>
                <div className='troubleshooting-step-list-item'>
                    {translatedCheckAgentTroubleShootingStepArray_0 + ' '}
                    <a target='_blank' href='https://docs.microsoft.com/en-us/azure/azure-monitor/insights/container-insights-health'>{translatedCheckAgentTroubleShootingStepArray_1}</a>
                    {translatedCheckAgentTroubleShootingStepArray_2 + ' '}
                    <a target='_blank' href='https://docs.microsoft.com/en-us/azure/azure-monitor/insights/container-insights-manage-agent'>{translatedCheckAgentTroubleShootingStepArray_3}</a>
                    {translatedCheckAgentTroubleShootingStepArray_4}
                </div>
                <div className='troubleshooting-step-list-item'>
                    {translatedSeeCITroubleshootingGuide_0}
                    <a target='_blank' href='https://github.com/microsoft/OMS-docker/tree/ci_feature/Troubleshoot'>{translatedSeeCITroubleshootingGuide_1}</a>
                </div>
            </div>
        );
    }

    private errorCodePopupClosed() {
        return <div>{DisplayStrings.ContainerFailureErrorPopupClosed}</div>
    }

    private errorCode401HelpMessage() {
        return <div>
            <span>{DisplayStrings.ContainerFailureErrorUnauthorized}</span>
        </div>;
    }

    private errorCode403HelpMessage() {
        return <div>
            <div>{DisplayStrings.ContainerFailureErrorForbiddenLastLine}
                <a href='https://kubernetes.io/docs/reference/access-authn-authz/rbac/' target='_blank'>
                    {' ' + DisplayStrings.ContainerFailureErrorForbiddenKubDoc + ' '}</a>
                {DisplayStrings.ContainerFailureErrorForbiddenExtra} </div>

            <div className='deployments-yaml-help'>
                <div className='deployments-help-code-area-title'>{DisplayStrings.ContainerFailureErrorYAML}</div>

                <pre className='deployments-help-code-area'>

                    {`apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
    name: containerHealth-log-reader
rules:
    - apiGroups: ["", "metrics.k8s.io", "extensions", "apps"]
      resources:
         - "pods/log"
         - "events"
         - "nodes"
         - "pods"
         - "deployments"
         - "replicasets"
      verbs: ["get", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
    name: containerHealth-read-logs-global
roleRef:
    kind: ClusterRole
    name: containerHealth-log-reader
    apiGroup: rbac.authorization.k8s.io
subjects:
- kind: User
  name: clusterUser
  apiGroup: rbac.authorization.k8s.io`}
                </pre>

                <div className='deployments-yaml-final-note'>{DisplayStrings.ContainerFailureErrorNote}</div>
            </div>
        </div>;
    }
}
