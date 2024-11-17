import MyInput from '@/components/MyInput';
import React from 'react';
import { Form } from 'rsuite';
import 'react-tabs/style/react-tabs.css';

const EmployeeMainInfoScreen = () => {

    return (
        <Form disabled style={{ zoom: 0.85 }} layout="inline" fluid>
            <MyInput width={200} column fieldLabel="Person ID" fieldName={'employeetHmi'} record={""} />
            <MyInput width={200} column fieldLabel="Employee Name" fieldName={'employeeFullName'} record={""} />
            <MyInput width={200} column fieldLabel="Date of Birth"fieldName={'dob'} record={""} />
            <MyInput width={200} column fieldLabel="Employee Age" fieldName={'employeeAge'} record={""} />
            <MyInput width={200} column  fieldLabel="Sex at Birth" fieldName={''} record={""} />
            <MyInput width={200} column fieldLabel="Seafarer’s Registration No." fieldName={''} record={""} />

        </Form>
    );
};

export default EmployeeMainInfoScreen;