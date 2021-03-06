/// <referencepath="./ext/defs/d3.d.ts"/>

import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { PageStartup } from './shared/PageStartup';
import { ComputeMainPage } from './compute/ComputeMainPage';

PageStartup.startupOnceDomLoaded(
    () => { 
        return document.getElementById('root') as HTMLElement; 
    },
    (rootElement) => {
        ReactDOM.render(
            <ComputeMainPage />,
            rootElement);
    }
);
