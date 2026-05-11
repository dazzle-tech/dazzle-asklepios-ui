import React from 'react';
import { Col, Panel, Row } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCodeMerge } from '@fortawesome/free-solid-svg-icons';
import * as icons from '@rsuite/icons';
import MyButton from '@/components/MyButton/MyButton';
import PatientInfoCard from '@/components/PatientInfoCard';
import ProfileSidebar from '../patient-profile/ProfileSidebar-new';
import { Patient } from '@/types/model-types-new';
import './styles.less';

interface MergePatientsTabProps {
  fromPatient: Patient;
  toPatient: Patient;
  setFromPatient: React.Dispatch<React.SetStateAction<Patient>>;
  setToPatient: React.Dispatch<React.SetStateAction<Patient>>;
  refetchData: boolean;
  setRefetchData: React.Dispatch<React.SetStateAction<boolean>>;
  previewLoading: boolean;
  previewFetching: boolean;
  handleMergeClick: () => void;
  handleClear: () => void;
  setExpand: React.Dispatch<React.SetStateAction<boolean>>;
  windowHeight: number;
}

const MergePatientsTab: React.FC<MergePatientsTabProps> = ({
  fromPatient,
  toPatient,
  setFromPatient,
  setToPatient,
  refetchData,
  setRefetchData,
  previewLoading,
  previewFetching,
  handleMergeClick,
  handleClear,
  setExpand,
  windowHeight
}) => {
  return (
    <Row gutter={24} className="merge-patients-tab-row">
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

          <div className="merge-controls">
            <div className="merge-icon-card">
              <FontAwesomeIcon
                icon={faCodeMerge}
                className="merge-icon"
              />
              <div className="merge-icon-title">Merge</div>
            </div>
          </div>

          <h6>Merge To</h6>
          <PatientInfoCard patient={toPatient} />

          <div className="merge-action-row">
            <MyButton
              size="large"
              prefixIcon={() => <FontAwesomeIcon icon={faCodeMerge} />}
              appearance="primary"
              onClick={handleMergeClick}
              loading={previewLoading || previewFetching}
              className="merge-action-button merge-action-button-primary"
            >
              Start Merge Process
            </MyButton>
            <MyButton
              size="large"
              prefixIcon={() => <icons.Reload />}
              appearance="ghost"
              className="merge-action-button merge-action-button-ghost"
            >
              Undo Last Merge
            </MyButton>
            <MyButton
              size="large"
              prefixIcon={() => <icons.Close />}
              appearance="subtle"
              onClick={handleClear}
              className="merge-action-button merge-action-button-clear"
            >
              Clear Selection
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
          title="Primary Patient (Target)"
          showButton={false}
        />
      </Col>
    </Row>
  );
};

export default MergePatientsTab;
