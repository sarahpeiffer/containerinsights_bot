import * as React from 'react';
import { DisplayStrings } from '../DisplayStrings';
import { IComputerGroupTypeSvg } from './ComputerGroupType';

export const SubscriptionGroupSvg: React.StatelessComponent<IComputerGroupTypeSvg> = (props) => {
    const title: string = props.hasOwnProperty('title') ? props.title : DisplayStrings.ServiceMapGroupTypeAzureSubscrptionName;

    // tslint:disable:max-line-length
    return (
        <span title={title}>
            <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 18 18'><defs><radialGradient id='a445c717-9d75-44c7-ba6b-0d8f2383e560' cx='-36.63' cy='17.12' r='11.18' gradientTransform='translate(41.88 -7.4) scale(0.94 0.94)' gradientUnits='userSpaceOnUse'><stop offset='0.27' stopColor='#ffd70f'/><stop offset='0.49' stopColor='#ffcb12'/><stop offset='0.88' stopColor='#feac19'/><stop offset='1' stopColor='#fea11b'/></radialGradient></defs><path id='e3d1e58c-f78e-4fb5-9857-0c9331da9979' data-name='Path 1427' d='M13.56,7.19a2.07,2.07,0,0,0,0-2.93h0L10,.69a2.06,2.06,0,0,0-2.92,0h0L3.52,4.26a2.09,2.09,0,0,0,0,2.93l3,3a.61.61,0,0,1,.17.41v5.52a.7.7,0,0,0,.2.5l1.35,1.35a.45.45,0,0,0,.66,0l1.31-1.31h0l.77-.77a.26.26,0,0,0,0-.38l-.55-.56a.29.29,0,0,1,0-.42l.55-.56a.26.26,0,0,0,0-.38L10.4,13a.28.28,0,0,1,0-.41L11,12a.26.26,0,0,0,0-.38l-.77-.78v-.28Zm-5-5.64A1.18,1.18,0,1,1,7.37,2.73,1.17,1.17,0,0,1,8.54,1.55Z' fill='url(#a445c717-9d75-44c7-ba6b-0d8f2383e560)'/><path id='a21a8f7a-61cc-4035-8449-e5c8fe4d4d5e' data-name='Path 1428' d='M7.62,16.21h0A.25.25,0,0,0,8,16V11.55a.27.27,0,0,0-.11-.22h0a.25.25,0,0,0-.39.22V16A.27.27,0,0,0,7.62,16.21Z' fill='#ff9300' opacity='0.75'/><rect id='ecd3189c-fb1e-4a0e-a2b6-ba2f11dda484' data-name='Rectangle 2071' x='5.69' y='5.45' width='5.86' height='0.69' rx='0.32' fill='#ff9300' opacity='0.75'/><rect id='a1949a3c-4818-4bd1-b236-0d970b92fc62' data-name='Rectangle 2072' x='5.69' y='6.57' width='5.86' height='0.69' rx='0.32' fill='#ff9300' opacity='0.75'/></svg>
        </span>
    );
};
