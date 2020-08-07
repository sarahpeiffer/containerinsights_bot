/// <referencepath="./ext/defs/d3.d.ts"/>
import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { ContainerMainPage } from './container/ContainerMainPage';

import { PageStartup } from './shared/PageStartup';
import { ContainerGlobals } from './container/ContainerGlobals';

ContainerGlobals.performanceMeasures['reactBootstrap'] = Date.now();

PageStartup.startupOnceDomLoaded(
    () => { 
        return document.getElementById('root') as HTMLElement; 
    },
    (rootElement) => {

        ReactDOM.render(
            <ContainerMainPage />,
            rootElement);
    }
);
