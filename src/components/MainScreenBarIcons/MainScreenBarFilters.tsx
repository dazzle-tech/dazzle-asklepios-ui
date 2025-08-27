import React from 'react';
import { useState } from 'react';
import MyButton from '../MyButton/MyButton';
import MyInput from '../MyInput';
import { Form} from 'rsuite';
import './style.less';
import { faSun, faMoon } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {Whisper,Tooltip,IconButton} from 'rsuite';


const MainScreenBarFilters = () => {

  const [record, setRecord] = useState({});
  const [isDarkMode, setIsDarkMode] = useState(false);

const toggleMode = () => {
    setIsDarkMode(prev => !prev);
  };
  return (
    <Form fluid>
  <div className="main-screen-bar-buttons-main-container">
    <Whisper
      placement="bottom"
      trigger="hover"
      speaker={<Tooltip>{isDarkMode ? 'Dark Mode' : 'Light Mode'}</Tooltip>}>
      <IconButton
        className="theme-toggle-button"
        icon={<FontAwesomeIcon className='icons-size-main-screen-bar-filters' icon={isDarkMode ? faMoon : faSun} />}
        onClick={toggleMode}
        appearance="subtle"
        circle
      />
    </Whisper>

            <MyInput
          fieldName=""
          fieldType="text"
          placeholder="Search"
          width="10vw"
          record={record}
          setRecord={setRecord}
            />
    </div></Form>
  );
};

export default MainScreenBarFilters;
