import React, { useEffect } from 'react';
import { useState } from 'react';
import MyInput from '../MyInput';
import { Form } from 'rsuite';
import './style.less';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '@/hooks';
import { setMode } from '@/reducers/uiSlice';
import SearchIcon from '@rsuite/icons/Search';
import { RootState } from '@/store';
import { IoMdClose } from 'react-icons/io';
import Translate from '../Translate';

const MainScreenBarFilters = ({displaySearch, setDisplaySearch}) => {
  const dispatch = useAppDispatch();
  const [record, setRecord] = useState({});
  const mode = useSelector(state => state.ui.mode);
  const [isLightMode, setIsLightMode] = useState({ state: mode == 'light' ? true : false });
  const [width, setWidth] = useState<number>(window.innerWidth); // window width
  const divElement = useSelector((state: RootState) => state.div?.divElement);
  // Effects
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (width > 800) {
      setDisplaySearch(true);
    } else {
      setDisplaySearch(false);
    }
  }, []);

  useEffect(() => {
    dispatch(setMode(isLightMode['state'] ? 'light' : 'dark'));
  }, [isLightMode]);

  return (
    <div className="main-screen-bar-filters-header-main-container">
      {(width > 800 || !displaySearch) && width > 600 && (
        <div>
          {/* {divElement} */}
          <div className="display-flex">
                <h5>
                  <Translate>
                  {divElement}
                  </Translate>
                  </h5>
              </div>
        </div>
      )}
      <div className="main-screen-bar-filters-header">
        <Form fluid layout="inline">
          <div className="main-screen-bar-buttons-main-container">
            {width > 800 || displaySearch ? (
              <>
                <MyInput
                  fieldName=""
                  fieldType="text"
                  placeholder="Search"
                  width={width < 800 && width > 500 && displaySearch ? '150px' : width < 500 && displaySearch ? '200px' : '10vw'}
                  record={record}
                  setRecord={setRecord}
                />
                <IoMdClose
                  size={24}
                  style={{
                    background: 'var(--rs-border-primary)',
                    padding: '6px',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease, transform 0.2s ease',
                    display: width > 800 ? 'none' : 'inline'
                  }}
                  onClick={() => setDisplaySearch(false)}
                />
              </>
            ) : (
              <SearchIcon
                title="search"
                style={{ margin: '10px', fontWeight: 'bold' }}
                onClick={() => setDisplaySearch(true)}
              />
            )}
            {(width > 800 || !displaySearch) && width > 600 && (
              <MyInput
                fieldType="checkbox"
                checkedLabel="Light"
                unCheckedLabel="Dark"
                fieldName="state"
                record={isLightMode}
                setRecord={setIsLightMode}
                showLabel={false}
              />
            )}
          </div>
        </Form>
      </div>
    </div>
  );
};

export default MainScreenBarFilters;
