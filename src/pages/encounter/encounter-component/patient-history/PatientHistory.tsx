import React, { useEffect, useState } from 'react';
import {
    InputGroup,
    Form,
    Input,
    Panel,
    DatePicker,
    Text,
    Checkbox,
    Dropdown,
    Button,
    IconButton,
    SelectPicker,
    Table,
    Modal,
    Stack,
    Divider,
    Toggle,

} from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
const PatientHistory =({patient,encounter})=>{
    return(<>
    <Panel header="Medical History" collapsible bordered >1</Panel>
    <Panel header="Surgical History" collapsible bordered >2</Panel>
    <Panel header="Family History" collapsible bordered >3</Panel>
    </>);
};
export default PatientHistory;