/// <referencepath="./ext/defs/d3.d.ts"/>

import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { PageStartup } from './shared/PageStartup';
import { SingleComputePerf } from './compute/SingleComputePerf';

PageStartup.startupOnceDomLoaded(
    () => { 
        return document.getElementById('root') as HTMLElement; 
    },
    (rootElement) => {
        ReactDOM.render(
            <SingleComputePerf />,
            rootElement);
    }
);
