import React from 'react';
import "./styles.less";
const Section = ({title, content}) => {
  return(
    <div className='main-content-section'>
    <div className='title-section'>
       {title}
    </div>
    <div className='content-section'>
        {content}
    </div>
    </div>
  );
};

export default Section;