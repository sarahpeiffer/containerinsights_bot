import * as React from 'react';

import './svg.less';

export const DescribeSvg: React.StatelessComponent<{}> = ({ }) => {
    return (
        <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 2048 2048' width='32' height='32'>
            {/* tslint:disable:max-line-length */}
            <path d='M889 1920q56 73 126 128H128V0h1115l549 549v261q-31-14-63-26t-65-22V640h-512V128H256v1792h633zm391-1701v293h293l-293-293zm768 1253q0 119-45 224t-124 183-183 123-224 46q-119 0-224-45t-183-124-123-183-46-224q0-119 45-224t124-183 183-123 224-46q119 0 224 45t183 124 123 183 46 224zm-576 448q93 0 174-35t142-96 96-142 36-175q0-93-35-174t-96-142-142-96-175-36q-93 0-174 35t-142 96-96 142-36 175q0 93 35 174t96 142 142 96 175 36zm-64-128v-384h128v384h-128zm0-512v-128h128v128h-128z' />
        </svg>
    );
};
