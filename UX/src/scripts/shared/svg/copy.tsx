import * as React from 'react';

import './svg.css';

export const CopySvg: React.StatelessComponent<{}> = ({}) => {
    return <svg viewBox='0 -500 500 500'>
      <g transform='translate(-250 -1500) scale(3)'>
        <g>
          <path d='m134.94 354c-3.324 0-6 2.676-6 6v96c0 3.324 2.676 6 6 6h82c3.324 0 6-2.676 6-6v-62h-40c-3.324 0-6-2.676-6-6v-34h-42z'
            fill='#333333' />
          <path
              d='m113.66 374.22c-3.324 0-6 2.676-6 6v96c0 3.324 2.676 6 6 6h82c3.324 0 6-2.676 6-6v-7h-73c-3.324 0-6-2.676-6-6v-89h-9z'
              fill='#333333' />
          <path
              d='m180.94 354v30c0 3.324 2.676 6 6 6h36z'
              fill='#333333' />
        </g>
      </g>
    </svg>;
};
