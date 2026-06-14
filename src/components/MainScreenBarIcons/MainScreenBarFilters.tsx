import React, { useEffect, useState } from 'react';
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
import { useNavigate } from 'react-router-dom';
import { setScreenKey } from '@/utils/uiReducerActions';
type MainScreenBarFiltersProps = {
  displaySearch: boolean;
  setDisplaySearch: React.Dispatch<React.SetStateAction<boolean>>;
  childrenNavs: any[]
};

const MainScreenBarFilters: React.FC<MainScreenBarFiltersProps> = ({
  displaySearch,
  setDisplaySearch,
  childrenNavs
}) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [record, setRecord] = useState<Record<string, any>>({eventKey: ""});
   const direction = localStorage.getItem('direction');


  const [width, setWidth] = useState<number>(window.innerWidth);

  const mode = useSelector((state: RootState) => state.ui.mode);
  const divElement = useSelector((state: RootState) => state.div?.divElement);
  const isLightMode = mode === 'light';

useEffect(() => {
  const handleResize = () => setWidth(window.innerWidth);
  window.addEventListener('resize', handleResize);
  handleResize();
  return () => window.removeEventListener('resize', handleResize);
}, []);

useEffect(() => {
  const nextValue = width > 800;
  if (displaySearch !== nextValue) {
    setDisplaySearch(nextValue);
  }
}, [width, displaySearch, setDisplaySearch]);

  useEffect(() => {
  if (!record.eventKey) return;
  dispatch(setScreenKey(record.eventKey));
  const item = childrenNavs.find(c => c.eventKey === record.eventKey);
  if (item?.to) navigate(item?.to);

}, [record.eventKey]);


  const handleThemeToggle = (newRecord: { state: boolean }) => {
    const nextMode = newRecord.state ? 'light' : 'dark';
    if (nextMode !== mode) {
      dispatch(setMode(nextMode));
    }
  };

  return (
    <div
      className="main-screen-bar-filters-header-main-container"
      style={{ flexDirection: direction === 'LTR' ? 'row' : 'row-reverse' }}
    >
      <div className="header-title">
        <h5>
          <Translate>{divElement}</Translate>
        </h5>
      </div>

      <div className="main-screen-bar-filters-header">
        <Form fluid>
          <div
            className="main-screen-bar-buttons-main-container"
            style={{ flexDirection: direction === 'LTR' ? 'row' : 'row-reverse' }}
          >
            {/* 🔥 Search */}
            <div className={`search-container ${displaySearch ? 'open' : ''}`}>
              <MyInput
                fieldName="eventKey"
                selectData={childrenNavs}
                selectDataLabel="title"
                selectDataValue="eventKey"
                fieldType="select"
                placeholder="Search"
                width="15vw"
                record={record}
                setRecord={setRecord}
                showLabel={false}
                searchable
              />

              {/* <IoMdClose
                className="close-btn"
                size={20}
                                  style={{
                    background: 'var(--rs-border-primary)',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease, transform 0.2s ease',
                  }}
                onClick={() => setDisplaySearch(false)}
              /> */}
            </div>

            {!displaySearch && (
              <SearchIcon
                className="search-icon"
                style={{ margin: '10px', fontWeight: 'bold' }}
                onClick={() => setDisplaySearch(true)}
              />
            )}

            <div className="theme-container">
              <MyInput
                fieldType="checkbox"
                checkedLabel="Light"
                unCheckedLabel="Dark"
                fieldName="state"
                record={{ state: isLightMode }}
                setRecord={handleThemeToggle}
                showLabel={false}
              />
            </div>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default MainScreenBarFilters;
