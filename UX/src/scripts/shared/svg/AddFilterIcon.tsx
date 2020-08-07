import * as React from 'react';

import '../../../styles/shared/AddFilterIcon.less';

export const AddFilterIcon: React.SFC = (props) => {
  return <svg className='aim-svg' viewBox='0 0 25 25'>
    <g>
      <path d='M10,10h13.3v1l-5,5l-1,7H16l-1-7l-5-5V10z' />
    </g>
    <polygon points='10,5 7,5 7,2 5,2 5,5 2,5 2,7 5,7 5,10 7,10 7,7 10,7 ' />
  </svg>;
};
