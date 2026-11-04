import React, { useState } from 'react'; 

const Protocols = () => {

          // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
  <div dir={dir}>
    <h1>Hello</h1>
  </div>
  );
};

export default Protocols;
