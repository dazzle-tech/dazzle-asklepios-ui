import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
const DiagnosticsResult =()=>{
     const location = useLocation();
       const { patient, encounter, edit } = location.state || {};
    return(<>3</>);
};
export default DiagnosticsResult;