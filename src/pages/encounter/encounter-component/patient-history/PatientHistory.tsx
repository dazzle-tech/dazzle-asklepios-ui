import React, { useEffect, useState } from 'react';
import {
    Panel,
    Table,
    Tabs
   ,

} from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
const PatientHistory =({patient,encounter})=>{
    return(<>
    <Tabs defaultActiveKey="1" appearance="subtle">
     <Tabs.Tab eventKey="1" title="Medical History" >1</Tabs.Tab>
     <Tabs.Tab eventKey="2" title="Surgical History" >2</Tabs.Tab>
     <Tabs.Tab eventKey="3" title="Family History" >3</Tabs.Tab>
    </Tabs>
   
    </>);
};
export default PatientHistory;