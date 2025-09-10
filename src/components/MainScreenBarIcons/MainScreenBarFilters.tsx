import React, { useEffect } from 'react';
import { useState } from 'react';
import MyInput from '../MyInput';
import { Form } from 'rsuite';
import './style.less';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '@/hooks';
import { setMode } from '@/reducers/uiSlice';

const MainScreenBarFilters = () => {
  const dispatch = useAppDispatch();
  const [record, setRecord] = useState({});
  const mode = useSelector(state => state.ui.mode);
  const [isLightMode, setIsLightMode] = useState({ state: mode == 'light' ? true : false });

  useEffect(() => {
    dispatch(setMode(isLightMode['state'] ? 'light' : 'dark'));
  }, [isLightMode]);

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
