import MyButton from '@/components/MyButton/MyButton';
import PatientInfoCard from '@/components/PatientInfoCard';
import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { RootState } from '@/store';
import { ApPatient } from '@/types/model-types';
import { newApPatient } from '@/types/model-types-constructor';
import { faCodeMerge, faRepeat } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as icons from '@rsuite/icons';
import React, { useEffect, useState } from 'react';
import ReactDOMServer from 'react-dom/server';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { Col, Grid, Panel, Row, Table } from 'rsuite';
import { getHeight } from 'rsuite/esm/DOMHelper';
import ProfileSidebar from '../patient-profile/ProfileSidebar';
import Translate from '@/components/Translate';
const { Column, HeaderCell, Cell } = Table;

const PatientMergeFiles: React.FC = () => {
  const [expand, setExpand] = useState(false);
  const [windowHeight, setWindowHeight] = useState(getHeight(window));
  const [fromPatient, setFromPatient] = useState<ApPatient>({ ...newApPatient });
  const [fromPatientList, setFromPatientList] = useState<ApPatient[]>([{ ...newApPatient }]);
  const [toPatient, setToPatient] = useState<ApPatient>({ ...newApPatient });
  const [toPatientList, setToPatientList] = useState<ApPatient[]>([{ ...newApPatient }]);
  const [refetchData, setRefetchData] = useState(false);

  const dispatch = useAppDispatch();
  const { pathname } = useLocation();

  const handleClear = () => {
    setToPatient(newApPatient);
    setFromPatient(newApPatient);
  };

  useEffect(() => {
    if (fromPatient.key) {
      setFromPatientList([fromPatient]);
    }
  }, [fromPatient]);

  useEffect(() => {
    if (toPatient.key) {
      setToPatientList([toPatient]);
    }
  }, [toPatient]);

  useEffect(() => {
    const divContent = (
        "Files Merge"
    );

    dispatch(setPageCode('Files_Merge'));
    dispatch(setDivContent(divContent));

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch, pathname]);

  return (
    <>
      <Grid fluid>
        <Row>
          <Col xs={5}>
            <ProfileSidebar
              expand={true}
              setExpand={setExpand}
              windowHeight={windowHeight}
              setLocalPatient={setFromPatient}
              refetchData={refetchData}
              setRefetchData={setRefetchData}
              title="From Patient"
              direction="right"
              showButton={false}
            />
          </Col>

          <Col xs={14}>
            <Panel bordered>
              <h6>From Patient</h6>
              <PatientInfoCard patient={fromPatient} />

              <div className="merge-controls" style={{ textAlign: 'center', margin: '20px 0' }}>
                <FontAwesomeIcon
                  icon={faRepeat}
                  style={{ fontSize: 100, transform: 'rotate(90deg)' }}
                />
              </div>

              <h6>Merge To</h6>
              <PatientInfoCard patient={toPatient} />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <MyButton
                  size="small"
                  prefixIcon={() => <FontAwesomeIcon icon={faCodeMerge} />}
                  appearance="primary"
                >
                  Merge
                </MyButton>
                <MyButton size="small" prefixIcon={() => <icons.Reload />} appearance="ghost">
                  Undo
                </MyButton>
                <MyButton
                  size="small"
                  prefixIcon={() => <icons.Close />}
                  appearance="subtle"
                  onClick={handleClear}
                >
                  Clear
                </MyButton>
              </div>
            </Panel>
          </Col>

          <Col xs={5}>
            <ProfileSidebar
              expand={true}
              setExpand={setExpand}
              windowHeight={windowHeight}
              setLocalPatient={setToPatient}
              refetchData={refetchData}
              setRefetchData={setRefetchData}
              title="Merge To"
              showButton={false}
            />
          </Col>
        </Row>
      </Grid>
    </>
  );
};

export default PatientMergeFiles;

export const calculateAgeFormat = (dateOfBirth: string | Date) => {
  const today = new Date();
  const dob = new Date(dateOfBirth);

  if (isNaN(dob.getTime())) {
    return '';
  }

  let years = today.getFullYear() - dob.getFullYear();
  let months = today.getMonth() - dob.getMonth();
  let days = today.getDate() - dob.getDate();

  if (months < 0 || (months === 0 && days < 0)) {
    years--;
    months += 12;
  }
  if (days < 0) {
    const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += lastMonth.getDate();
    months--;
  }

  let ageString = '';
  if (years > 0) ageString += `${years}y `;
  if (months > 0) ageString += `${months}m `;
  if (days > 0) ageString += `${days}d`;

  return ageString.trim();
};
