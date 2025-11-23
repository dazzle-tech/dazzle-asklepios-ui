import { newApPatient } from '@/types/model-types-constructor';
import React, { useEffect, useState } from 'react';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAppDispatch } from '@/hooks';
import MyTab from '@/components/MyTab';
import SectionContainer from '@/components/SectionsoContainer';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faBroom } from '@fortawesome/free-solid-svg-icons';
import MyButton from '@/components/MyButton/MyButton';
import Billing from './Billing';
import Invoices from './Invoices';
import Receipt from './Receipt';
import ProfileSidebar from '../patient/patient-profile/ProfileSidebar-new';
import { getHeight } from 'rsuite/esm/DOMHelper';
const Accounting = () => {
  const dispatch = useAppDispatch();
  const [expand, setExpand] = useState<boolean>(false);
  const [patient, setPatient] = useState({ ...newApPatient });
  useEffect(() => {
    console.log('patient');
    console.log(patient);
  }, [patient]);
  const [windowHeight] = useState(getHeight(window));
  const [refetchData, setRefetchData] = useState(false);
  const [dateFilter, setDateFilter] = useState({
    fromDate: new Date(),
    toDate: new Date()
  });

  const divContent = 'Accounting';

  const tabData = [
    {
      title: 'Billing',
      content: <Billing />
    },
    {
      title: 'Invoices',
      content: <Invoices />
    },
    {
      title: 'Print Receipt(s)',
      content: <Receipt />
    }
  ];

  useEffect(() => {
    dispatch(setPageCode('Operation_Module'));
    dispatch(setDivContent(divContent));
  }, []);

  const handleClearFilters = () => {
    setDateFilter({
      fromDate: null,
      toDate: null
    });
  };

  const contentOfSearchSection = () => {
    return (
      <>
        <Form layout="inline" fluid className="date-filter-form">
          <MyInput
            column
            width={180}
            fieldType="date"
            fieldLabel="From Date"
            fieldName="fromDate"
            record={dateFilter}
            setRecord={setDateFilter}
            disabled={!patient?.key}
          />
          <MyInput
            width={180}
            column
            fieldType="date"
            fieldLabel="To Date"
            fieldName="toDate"
            record={dateFilter}
            setRecord={setDateFilter}
            disabled={!patient?.key}
          />
        </Form>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'end' }}>
          <MyButton
            prefixIcon={() => <FontAwesomeIcon icon={faMagnifyingGlass} />}
            disabled={!patient?.key}
          >
            Search
          </MyButton>

          <MyButton
            prefixIcon={() => <FontAwesomeIcon icon={faBroom} />}
            onClick={handleClearFilters}
            disabled={!patient?.key}
          >
            Clear
          </MyButton>
        </div>
      </>
    );
  };

  return (
    <div className="container">
      <div className="left-box" style={{ width: '100%' }}>
        <SectionContainer title="Search Patient" content={contentOfSearchSection()} />
        <MyTab data={tabData} />
      </div>
      <br />
      <div>
        <ProfileSidebar
          expand={expand}
          setExpand={setExpand}
          windowHeight={windowHeight}
          setLocalPatient={setPatient}
          refetchData={refetchData}
          setRefetchData={setRefetchData}
        />
      </div>
    </div>
  );
};
export default Accounting;
