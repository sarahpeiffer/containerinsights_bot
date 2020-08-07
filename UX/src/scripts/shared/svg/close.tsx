import * as React from 'react';

import './svg.less';

export const CloseSvg: React.StatelessComponent<{}> = ({ }) => {

    // tslint:disable-next-line:quotemark
    return <svg viewBox="0 0 16 16" className="theme" role="presentation" focusable="false" width="100%" height="100%">
        <g>
            <title></title>

            {/* tslint:disable-next-line:quotemark */}
            <path d="M14 3.3L12.7 2 8 6.7 3.3 2 2 3.3 6.7 8 2 12.7 3.3 14 8 9.3l4.7 4.7 1.3-1.3L9.3 8z"></path>
        </g>
    </svg>;
};
