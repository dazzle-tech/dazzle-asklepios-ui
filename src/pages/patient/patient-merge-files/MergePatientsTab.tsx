import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCodeMerge,
  faArrowDown,
  faDatabase,
  faBullseye
} from '@fortawesome/free-solid-svg-icons';
import * as icons from '@rsuite/icons';

import MyButton from '@/components/MyButton/MyButton';
import ProfileSidebar from '../patient-profile/ProfileSidebar-new';
import SectionContainer from '@/components/SectionsoContainer';
import Translate from '@/components/Translate';

import { Patient } from '@/types/model-types-new';

import './styles.less';
import PatientMergeCard from './patient-merge-files-card/PatientMergeCard';
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch } from '@/hooks';

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
  const isLoading = previewLoading || previewFetching;
  const isFromMerged = fromPatient?.patientStatus === 'MERGED';
const isToMerged = toPatient?.patientStatus === 'MERGED';
const dispatch = useAppDispatch()
const isMergeDisabled =
  !fromPatient?.id ||
  !toPatient?.id;

const showMergedPatientWarning = () => {
  if (isFromMerged) {
    dispatch(notify({
      msg: 'Source patient is already merged and cannot be used in another merge.',
      sev: 'warning'
    }));
  
    return;
  }

  if (isToMerged) {
    dispatch(notify({
        msg: 'Primary patient is already merged and cannot be used in another merge.',
        sev: 'warning'
    }));

    return;
  }
};

const handleStartMerge = () => {
  if (isFromMerged || isToMerged) {
    showMergedPatientWarning();
    return;
  }

  handleMergeClick();
};
  return (
    <div className="merge-patients-layout">
      {/* Left Sidebar */}
      <div className="merge-sidebar merge-sidebar-left">
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
      </div>

      {/* Center Workspace */}
      <div className="merge-center-content">
        <div className="merge-workspace">
          {/* Source Patient */}
          <SectionContainer
            title={
              <div className="merge-section-title">
                <FontAwesomeIcon icon={faDatabase} />
                <span>
                  <Translate>Source Patient</Translate>
                </span>
              </div>
            }
            minHeight="auto"
            content={
              <div className="merge-patient-section">
                <div className="merge-patient-card">
                  <PatientMergeCard patient={fromPatient} type="source" />
                </div>
              </div>
            }
          />

          {/* Merge Process */}
          <SectionContainer
            title={
              <div className="merge-section-title">
                <FontAwesomeIcon icon={faCodeMerge} />
                <span>
                  <Translate>Merge Process</Translate>
                </span>
              </div>
            }
            minHeight="auto"
            content={
              <div className="merge-flow-container">
                <div className="merge-flow-top">
                  <div className="merge-flow-line" />
                  <div className="merge-flow-badge">
                    <FontAwesomeIcon
                      icon={faCodeMerge}
                      className="merge-flow-icon"
                    />
                  </div>
                  <div className="merge-flow-line" />
                </div>

                <div className="merge-flow-arrow">
                  <FontAwesomeIcon icon={faArrowDown} />
                </div>

                <div className="merge-flow-text">
                  <Translate>
                    All selected patient data will be consolidated into the
                    primary patient record.
                  </Translate>
                </div>
              </div>
            }
          />

          {/* Target Patient */}
          <SectionContainer
            title={
              <div className="merge-section-title">
                <FontAwesomeIcon icon={faBullseye} />
                <span>
                  <Translate>Primary Patient (Target)</Translate>
                </span>
              </div>
            }
            minHeight="auto"
            content={
              <div className="merge-patient-section">
                <div className="merge-patient-card">
                  <PatientMergeCard patient={toPatient} type="target" />
                </div>
              </div>
            }
          />

          {/* Actions */}
          <SectionContainer
            title={
              <div className="merge-section-title">
                <FontAwesomeIcon icon={faCodeMerge} />
                <span>
                  <Translate>Actions</Translate>
                </span>
              </div>
            }
            minHeight="auto"
            content={
              <div className="merge-action-panel">
                <MyButton
                  appearance="primary"
                  loading={isLoading}
                  disabled={isMergeDisabled}
                  onClick={handleStartMerge}
                  prefixIcon={() => (
                    <FontAwesomeIcon icon={faCodeMerge} />
                  )}
                >
                  <Translate>Start Merge Process</Translate>
                </MyButton>

                {/* <MyButton
                  appearance="ghost"
                  onClick={handleClear}
                  prefixIcon={() => <icons.Reload />}
                >
                  <Translate>Reset Selection</Translate>
                </MyButton> */}

                <MyButton
                  appearance="primary"
                  onClick={handleClear}
                  prefixIcon={() => <icons.Close />}
                >
                  <Translate>Clear Selection</Translate>
                </MyButton>
              </div>
            }
          />
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="merge-sidebar merge-sidebar-right">
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
      </div>
    </div>
  );
};

export default MergePatientsTab;