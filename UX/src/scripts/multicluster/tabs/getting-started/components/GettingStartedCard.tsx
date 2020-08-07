import * as React from 'react';
import './GettingStartedCard.less';
import { ITelemetry } from '../../../../shared/Telemetry';

export interface IGettingStartedCardProps {
    image: JSX.Element;
    title: string;
    text: string;
    onClickHandler: any; // to allow for string (hack) or traditional (e) => void
    buttonText: string;
    telemetry: ITelemetry;
    telemetryString: string;
}

export interface IGettingStartedCardLinkProps {
    image: JSX.Element;
    title: string;
    text: string;
    href: any; // to allow for string (hack) or traditional (e) => void
    buttonText: string;
    telemetry: ITelemetry;
    telemetryString: string;
}

interface ITextProps {
    text: string;
}

const Text = (props: ITextProps) => {
    return (
        <p className='text'>
            {props.text}
        </p>
    );
}
export const GettingStartedCard = (props: IGettingStartedCardProps) => {
    const onClickHandler = () => {
        props.telemetry.logEvent('GettingStartedButtonClick', { button: props.telemetryString }, null)
        props.onClickHandler();
    }

    return (
        <div className='card'>
            <div className='card-image'>
                <div className='image-container'>
                    {props.image}
                </div>
            </div>
            <div className='card-text'>
                <div className='title'>
                    {props.title}
                </div>
                { props.text ? <Text text={props.text} /> : <></> }
            </div>
            <button className='card-button' onClick={onClickHandler}>{props.buttonText}</button>
        </div>
    );
}

export const GettingStartedCardLink = (props: IGettingStartedCardLinkProps) => {
    const onClickHandler = () => {
        props.telemetry.logEvent('GettingStartedButtonClick', { button: props.telemetryString }, null)
    }

    return (
        <div className='card'>
            <div className='card-image'>
                <div className='image-container'>
                    {props.image}
                </div>
            </div>
            <div className='card-text'>
                <div className='title'>
                    {props.title}
                </div>
                { props.text ? <Text text={props.text} /> : <></> }
            </div>
            <a className='card-button' href={props.href} target='_blank' onClick={onClickHandler}>{props.buttonText}</a>
        </div>
    );
}


