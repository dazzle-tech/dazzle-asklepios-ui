import React, { useEffect, useState, useRef } from 'react';
import { Panel, Divider } from 'rsuite';
import PatientSide from '../encounter-main-info-section/PatienSide';
import { useAppDispatch } from '@/hooks';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckDouble } from '@fortawesome/free-solid-svg-icons';
import Translate from '@/components/Translate';
import Allergies from './AllergiesNurse';
import { Check } from '@rsuite/icons';
import BlockIcon from '@rsuite/icons/Block';
import Warning from './warning';
import MyButton from '@/components/MyButton/MyButton';
import { useCompleteEncounterMutation } from '@/services/encounterService';
import { useLocation } from 'react-router-dom';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { Tabs } from 'rsuite';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import BackButton from '@/components/BackButton/BackButton';
import PatientHistory from '../encounter-component/patient-history';
import { notify } from '@/utils/uiReducerActions';
import PatientAttachment from '@/pages/patient/patient-profile/tabs/Attachment';
import InpatientObservations from './observations/InpatientObservations';
import PainAssessment from '../encounter-component/pain-assessment/PainAssessment';
import ReviewOfSystems from '../medical-notes-and-assessments/review-of-systems';
import ChiefComplain from '../encounter-component/chief-complain/ChiefComplain';
import GeneralAssessment from '../encounter-component/general-assessment';
import MedicationReconciliation from '../encounter-component/MedicationReconciliation/MedicationReconciliation';
import FunctionalAssessment from '../encounter-component/functional-assessment';
import Repositioning from '../encounter-component/repositioning';
import Encounter from '../encounter-screen';
import EncounterDischarge from '../encounter-component/encounter-discharge/EncounterDischarge';
import PhysicianOrderSummary from '../encounter-component/physician-order-summary';
import WoundCareDocumentation from '../encounter-component/wound-care-documentation';
import MyTable from '@/components/MyTable';
import { faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { formatDateWithoutSeconds } from '@/utils';
import WoundCareModal from './WoundCareModal';
const Tracking = ({}) => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const propsData = location.state;
  const [tracking, setTracking] = useState({});
  const [openViewModal, setOpenViewModal] = useState<boolean>(false);
  const [width, setWidth] = useState<number>(window.innerWidth);
  // class name for selected row
  const isSelected = rowData => {
    if (rowData && tracking && rowData.key === tracking.key) {
      return 'selected-row';
    } else return '';
  };

  // Effects
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const data = [
    {
      key: '0',
      createdAt: '2025-08-01',
      createdBy: 'Rawan',
      woundLocation: 'Back',
      side: 'Left',
      woundType: 'Cut',
      woundCause: 'Sharp object',
      dateOfOnset: '2025-09-09',
      initialOrFollowUp: 'initial'
    },
    {
      key: '1',
      createdAt: '2025-08-02',
      createdBy: 'Hanan',
      woundLocation: 'Hip',
      side: 'Right',
      woundType: 'Burn',
      woundCause: 'Fall',
      dateOfOnset: '2025-10-09',
      initialOrFollowUp: 'Follow-up'
    },
    {
      key: '2',
      createdAt: '2025-08-03',
      createdBy: 'Busgra',
      woundLocation: 'Neck',
      side: 'Both',
      woundType: 'Laceration',
      woundCause: 'Animal bite',
      dateOfOnset: '2025-11-09',
      initialOrFollowUp: 'initial'
    }
  ];

  //icons column (Medical sheets, Edite, Active/Deactivate)
  const iconsForActions = () => {
    return (
      <div className="container-of-icons">
        <FontAwesomeIcon
          icon={faEye}
          color="var(--primary-gray)"
          title="View"
          className="icons-style"
          onClick={() => setOpenViewModal(true)}
        />
      </div>
    );
  };

  //Table columns
  const tableColumns = [
    {
      key: 'woundLocation',
      title: <Translate>Wound Location</Translate>,
    },
     {
      key: 'side',
      title: <Translate>Side</Translate>,
    },
     {
      key: 'woundType',
      title: <Translate>Wound Type</Translate>,
    },
     {
      key: 'woundCause',
      title: <Translate>Wound Cause</Translate>,
    },
    {
      key: '',
      title: <Translate>Created At\By</Translate>,
      render: (rowData: any) =>
        rowData?.createdAt ? (
          <>
            {rowData?.createdBy}
            <br />
            <span className="date-table-style">
              {formatDateWithoutSeconds(rowData.createdAt)}
            </span>{' '}
          </>
        ) : (
          ' '
        )
    },
    {
      key: 'icons',
      title: <Translate>View</Translate>,
      render: rowData => iconsForActions(rowData)
    }
  ];

  return (
    <Panel>
      <MyTable
        height={450}
        data={data}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={rowData => {
          setTracking(rowData);
        }}
      />
      <WoundCareModal
        open={openViewModal}
        setOpen={setOpenViewModal}
        object={tracking}
        setObject={setTracking}
        width={width}
      />
    </Panel>
  );
};

export default Tracking;
