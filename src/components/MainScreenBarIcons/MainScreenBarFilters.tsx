import React from 'react';
import { useState } from 'react';
import MyInput from '../MyInput';
import { Form } from 'rsuite';
import './style.less';
const MainScreenBarFilters = () => {
  const [record, setRecord] = useState({});
  const [isLightMode, setIsLightMode] = useState({ state: true });
  return (
    <Form fluid layout="inline">
      <div className="main-screen-bar-buttons-main-container">
        <MyInput
          fieldName=""
          fieldType="text"
          placeholder="Search"
          width="10vw"
          record={record}
          setRecord={setRecord}
        />
        <MyInput
          fieldType="checkbox"
          checkedLabel="Light"
          unCheckedLabel="Dark"
          fieldName="state"
          record={isLightMode}
          setRecord={setIsLightMode}
          showLabel={false}
        />
      </div>
    </Form>
  );
};

export default MainScreenBarFilters;
