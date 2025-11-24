import EMRCard from '@/components/EMRCard';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import PatientSide from '@/pages/lab-module/PatienSide';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { setEncounter, setPatient } from '@/reducers/patientSlice';
import { useGetEncountersQuery } from '@/services/encounterService';
import { ApPatient } from '@/types/model-types';
import { newApEncounter, newApPatient } from '@/types/model-types-constructor';
import { initialListRequest, ListRequest } from '@/types/types';
import {
  faBarsProgress,
  faBed,
  faBedPulse,
  faCalendar,
  faConciergeBell,
  faFileInvoice,
  faHouseChimneyMedical,
  faMicroscope,
  faMoneyBillTransfer,
  faPaperclip,
  faPersonShelter,
  faPills,
  faSyringe,
  faTooth,
  faTriangleExclamation,
  faUserDoctor,
  faUserInjured,
  faUserLock,
  faUserNurse,
  faVial,
  faXRay
} from '@fortawesome/free-solid-svg-icons';
import React, { useEffect, useState } from 'react';
import ReactDOMServer from 'react-dom/server';
import { useLocation, useNavigate } from 'react-router-dom';
import 'react-tabs/style/react-tabs.css';
import { DOMHelper } from 'rsuite';
import ProfileSidebar from '../patient-profile/ProfileSidebar';
import AppliedServicesTable from './emr-tables/AppliedServicesTable';
import AppointmentsTable from './emr-tables/AppointmentsTable';
import AttachmentsTable from './emr-tables/AttachmentsTable';
import ClinicalReportsTable from './emr-tables/ClinicalReportsTable';
import ClinicVisitsTable from './emr-tables/ClinicVisitsTable';
import ConsultationsTable from './emr-tables/ConsultationsTable';
import CurrentMedicationsTable from './emr-tables/CurrentMedicationsTable';
import DayCaseTable from './emr-tables/DayCaseTable';
import DentalChartsTable from './emr-tables/DentalChartsTable';
import EmergencyTable from './emr-tables/EmergencyTable';
import InpatientTable from './emr-tables/InpatientTable';
import LaboratoryTable from './emr-tables/LaboratoryTable';
import LedgerAccountTable from './emr-tables/LedgerAccountTable';
import NurseAssessmentsTable from './emr-tables/NurseAssessmentsTable';
import OperationsTable from './emr-tables/OperationsTable';
import PastMedicalHistoryTable from './emr-tables/PastMedicalHistoryTable';
import PathologyTable from './emr-tables/PathologyTable';
import ProceduresTable from './emr-tables/ProceduresTable';
import RadiologyTable from './emr-tables/RadiologyTable';
import VaccinationTable from './emr-tables/VaccinationTable';
import './styles.less';

const { getHeight } = DOMHelper;

type PatientEMRProps = {
  inModal?: boolean;
  patient?: ApPatient;
  encounter?: any;
};

const PatientEMRModal: React.FC<PatientEMRProps> = ({ inModal = false, patient, encounter: enc }) => {
  const [expand, setExpand] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const location = useLocation();
  const propsData = patient || enc ? undefined : (location.state as any);

  const [encounter, setLocalEncounter] = useState<any>(
    enc ?? { ...newApEncounter, discharge: false }
  );

  const [localPatient, setLocalPatient] = useState<ApPatient>(
    patient
      ? patient
      : propsData?.fromPage === 'clinicalVisit'
      ? propsData?.localPatient
      : { ...newApPatient }
  );

  const [refetchData, setRefetchData] = useState(false);

  // Initialize Patient Encounters list request with default filters
  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'patient_key',
        operator: 'match',
        value: localPatient?.key || undefined
      }
    ]
  });

  // Fetch patient Encounters List
  const { data: encounterListResponse, isFetching } = useGetEncountersQuery(listRequest);

  const [windowHeight, setWindowHeight] = useState(getHeight(window));

  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [activeSectionCard, setActiveSectionCard] = useState<string | null>(null);

  useEffect(() => {
    if (!inModal) {
      const divContent = (
         "Patients EMR"
      );
      dispatch(setPageCode('Patients_EMR'));
      dispatch(setDivContent(divContent));
    }
    return () => {
      if (!inModal) {
        dispatch(setPageCode(''));
        dispatch(setDivContent('  '));
      }
    };
  }, [inModal, dispatch]);

  const columns = [
    {
      key: 'visitId',
      flexGrow: 4,
      align: 'center' as const,
      title: <Translate>VISIT ID</Translate>,
      render: (rowData: any) => (
        <span
          style={{ color: 'blue', cursor: 'pointer', textDecoration: 'underline' }}
          onClick={() => {
            goToVisit(rowData);
          }}
        >
          {rowData.visitId}
        </span>
      )
    },
    {
      key: 'plannedStartDate',
      flexGrow: 4,
      sortable: true,
      title: <Translate>DATE</Translate>,
      dataKey: 'plannedStartDate'
    },
    {
      key: 'diagnosis',
      flexGrow: 4,
      fullText: true,
      sortable: true,
      title: <Translate>DIAGNOSIS</Translate>,
      render: (rowData: any) => rowData.diagnosis
    },
    {
      key: 'status',
      flexGrow: 4,
      fullText: true,
      sortable: true,
      title: <Translate>STATUS</Translate>,
      render: (rowData: any) =>
        rowData.encounterStatusLvalue
          ? rowData.encounterStatusLvalue.lovDisplayVale
          : rowData.encounterStatusLkey
    }
  ];

  const pageIndex = listRequest.pageNumber - 1;
  const rowsPerPage = listRequest.pageSize;
  const totalCount = encounterListResponse?.extraNumeric ?? 0;

  const handlePageChange = (_: unknown, newPage: number) => {
    setListRequest({ ...listRequest, pageNumber: newPage + 1 });
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setListRequest({
      ...listRequest,
      pageSize: parseInt(event.target.value, 10),
      pageNumber: 1
    });
  };

  // Function to check if the current row is the selected one
  const isSelected = (rowData: any) => {
    if (rowData && encounter && rowData.key === encounter.key) {
      return 'selected-row';
    } else return '';
  };

  // Handle Go to Visit Function
  const goToVisit = async (rowData: any) => {
    setLocalEncounter(rowData);
    dispatch(setEncounter(rowData));
    dispatch(setPatient(rowData['patientObject']));

    const privatePatientPath = '/user-access-patient-private';
    const encounterPath = '/encounter';
    const targetPath = rowData.patientObject?.privatePatient ? privatePatientPath : encounterPath;

    const stateData = {
      info: 'toEncounter',
      fromPage: inModal ? 'PatientEMRModal' : 'PatientEMR',
      patient: rowData.patientObject,
      encounter: rowData
    };

    sessionStorage.setItem('encounterPageSource', inModal ? 'PatientEMRModal' : 'PatientEMR');

    navigate(targetPath, { state: stateData });
  };

  // Effects
  useEffect(() => {
    if (!localPatient) {
      dispatch(setPatient({ ...newApPatient }));
    } else {
      const updatedFilters = [
        {
          fieldName: 'deleted_at',
          operator: 'isNull' as const,
          value: undefined
        },
        {
          fieldName: 'patient_key',
          operator: 'match' as const,
          value: localPatient?.key || undefined
        }
      ];
      setListRequest(prevRequest => ({
        ...prevRequest,
        filters: updatedFilters
      }));
    }
  }, [localPatient, dispatch]);

  useEffect(() => {
    return () => {
      if (!inModal) {
        dispatch(setPageCode(''));
        dispatch(setDivContent('  '));
      }
    };
  }, [inModal, dispatch]);

  return (
    <div className={`emr-container ${inModal ? 'emr-in-modal' : ''}`}>
      <div className="emr-content">
        <div className="emr-main-row-handle">
          <div className="animation-emr-card-patient-emr">
            <EMRCard
              number={3}
              footerText="History"
              icon={faHouseChimneyMedical}
              backgroundColor="var(--card-purple)"
              width={170}
              height={100}
              onClick={() =>
                setActiveSectionCard(activeSectionCard === 'history' ? null : 'history')
              }
            />
          </div>

          <div className="animation-emr-card-patient-emr">
            <EMRCard
              number={3}
              footerText="Visits"
              icon={faBed}
              backgroundColor="var(--card-blue)"
              width={170}
              height={100}
              onClick={() => setActiveSectionCard(activeSectionCard === 'visits' ? null : 'visits')}
            />
          </div>

          <div className="animation-emr-card-patient-emr">
            <EMRCard
              number={3}
              footerText="Clinical"
              icon={faTriangleExclamation}
              backgroundColor="var(--card-green)"
              width={170}
              height={100}
              onClick={() =>
                setActiveSectionCard(activeSectionCard === 'clinical' ? null : 'clinical')
              }
            />
          </div>

          <div className="animation-emr-card-patient-emr">
            <EMRCard
              number={3}
              footerText="Diagnostics"
              icon={faPersonShelter}
              backgroundColor="var(--card-light-blue)"
              width={170}
              height={100}
              onClick={() =>
                setActiveSectionCard(activeSectionCard === 'diagnostics' ? null : 'diagnostics')
              }
            />
          </div>

          <div className="animation-emr-card-patient-emr">
            <EMRCard
              number={3}
              footerText="Treatment"
              icon={faUserNurse}
              backgroundColor="var(--card-dark-blue)"
              width={170}
              height={100}
              onClick={() =>
                setActiveSectionCard(activeSectionCard === 'treatment' ? null : 'treatment')
              }
            />
          </div>

          <div className="animation-emr-card-patient-emr">
            <EMRCard
              number={3}
              footerText="Documentation"
              icon={faUserInjured}
              backgroundColor="var(--card-dark-pink)"
              width={170}
              height={100}
              onClick={() =>
                setActiveSectionCard(activeSectionCard === 'documents' ? null : 'documents')
              }
            />
          </div>

          <div className="animation-emr-card-patient-emr">
            <EMRCard
              number={3}
              footerText="Services"
              icon={faBedPulse}
              backgroundColor="var(--card-gray)"
              width={170}
              height={100}
              onClick={() =>
                setActiveSectionCard(activeSectionCard === 'services' ? null : 'services')
              }
            />
          </div>
        </div>

        <div className="emr-main-row-handle">
          {activeSectionCard === 'history' && (
            <div className="emr-main-row-handle">
              <div className="animation-emr-card-patient-emr">
                <EMRCard
                  number={10}
                  footerText="60s"
                  icon={faBarsProgress}
                  backgroundColor="var(--card-purple)"
                  width={150}
                  height={100}
                  onClick={() => alert('Clicked')}
                />
              </div>
              <div className="animation-emr-card-patient-emr">
                <EMRCard
                  number={4}
                  footerText="P.M.H"
                  icon={faUserLock}
                  backgroundColor="var(--card-purple)"
                  width={150}
                  height={100}
                  onClick={() =>
                    setActiveCard(activeCard === 'pastmedicalhistory' ? null : 'pastmedicalhistory')
                  }
                />
              </div>
            </div>
          )}

          {activeSectionCard === 'visits' && (
            <div className="emr-main-row-handle">
              <div className="animation-emr-card-patient-emr">
                <EMRCard
                  number={4}
                  footerText="Appointments"
                  icon={faCalendar}
                  backgroundColor="var(--card-blue)"
                  width={150}
                  height={100}
                  onClick={() =>
                    setActiveCard(activeCard === 'appointments' ? null : 'appointments')
                  }
                />
              </div>

              <div className="animation-emr-card-patient-emr">
                <EMRCard
                  number={3}
                  footerText="Clinic Visits"
                  icon={faHouseChimneyMedical}
                  backgroundColor="var(--card-blue)"
                  width={150}
                  height={100}
                  onClick={() =>
                    setActiveCard(activeCard === 'clinicvisits' ? null : 'clinicvisits')
                  }
                />
              </div>

              <div className="animation-emr-card-patient-emr">
                <EMRCard
                  number={3}
                  footerText="Inpatient"
                  icon={faBed}
                  backgroundColor="var(--card-blue)"
                  width={150}
                  height={100}
                  onClick={() => setActiveCard(activeCard === 'inpatient' ? null : 'inpatient')}
                />
              </div>

              <div className="animation-emr-card-patient-emr">
                <EMRCard
                  number={3}
                  footerText="Emergency"
                  icon={faTriangleExclamation}
                  backgroundColor="var(--card-blue)"
                  width={150}
                  height={100}
                  onClick={() => setActiveCard(activeCard === 'emergency' ? null : 'emergency')}
                />
              </div>

              <div className="animation-emr-card-patient-emr">
                <EMRCard
                  number={3}
                  footerText="Day Case"
                  icon={faPersonShelter}
                  backgroundColor="var(--card-blue)"
                  width={150}
                  height={100}
                  onClick={() => setActiveCard(activeCard === 'daycase' ? null : 'daycase')}
                />
              </div>
            </div>
          )}

          {activeSectionCard === 'clinical' && (
            <div className="emr-main-row-handle">
              <div className="animation-emr-card-patient-emr">
                <EMRCard
                  number={3}
                  footerText="Consultations"
                  icon={faUserDoctor}
                  backgroundColor="var(--card-green)"
                  width={150}
                  height={100}
                  onClick={() =>
                    setActiveCard(activeCard === 'consultations' ? null : 'consultations')
                  }
                />
              </div>

              <div className="animation-emr-card-patient-emr">
                <EMRCard
                  number={3}
                  footerText="Nurse Assessments"
                  icon={faUserNurse}
                  backgroundColor="var(--card-green)"
                  width={150}
                  height={100}
                  onClick={() =>
                    setActiveCard(activeCard === 'nurseassessments' ? null : 'nurseassessments')
                  }
                />
              </div>

              <div className="animation-emr-card-patient-emr">
                <EMRCard
                  number={3}
                  footerText="Procedures"
                  icon={faUserInjured}
                  backgroundColor="var(--card-green)"
                  width={150}
                  height={100}
                  onClick={() => setActiveCard(activeCard === 'procedures' ? null : 'procedures')}
                />
              </div>

              <div className="animation-emr-card-patient-emr">
                <EMRCard
                  number={3}
                  footerText="Operations"
                  icon={faBedPulse}
                  backgroundColor="var(--card-green)"
                  width={150}
                  height={100}
                  onClick={() => setActiveCard(activeCard === 'operations' ? null : 'operations')}
                />
              </div>
            </div>
          )}

          {activeSectionCard === 'diagnostics' && (
            <div className="emr-main-row-handle">
              <div className="animation-emr-card-patient-emr">
                <EMRCard
                  number={5}
                  footerText="Laboratory"
                  icon={faVial}
                  backgroundColor="var(--card-light-blue)"
                  width={150}
                  height={100}
                  onClick={() => setActiveCard(activeCard === 'laboratory' ? null : 'laboratory')}
                />
              </div>

              <div className="animation-emr-card-patient-emr">
                <EMRCard
                  number={3}
                  footerText="Radiology"
                  icon={faXRay}
                  backgroundColor="var(--card-light-blue)"
                  width={150}
                  height={100}
                  onClick={() => setActiveCard(activeCard === 'radiology' ? null : 'radiology')}
                />
              </div>

              <div className="animation-emr-card-patient-emr">
                <EMRCard
                  number={3}
                  footerText="Pathology"
                  icon={faMicroscope}
                  backgroundColor="var(--card-light-blue)"
                  width={150}
                  height={100}
                  onClick={() => setActiveCard(activeCard === 'pathology' ? null : 'pathology')}
                />
              </div>
            </div>
          )}

          {activeSectionCard === 'treatment' && (
            <div className="emr-main-row-handle">
              <div className="animation-emr-card-patient-emr">
                <EMRCard
                  number={3}
                  footerText="Medications"
                  icon={faPills}
                  backgroundColor="var(--card-dark-blue)"
                  width={150}
                  height={100}
                  onClick={() => setActiveCard(activeCard === 'medications' ? null : 'medications')}
                />
              </div>

              <div className="animation-emr-card-patient-emr">
                <EMRCard
                  number={4}
                  footerText="Vaccines"
                  icon={faSyringe}
                  backgroundColor="var(--card-dark-blue)"
                  width={150}
                  height={100}
                  onClick={() => setActiveCard(activeCard === 'vaccines' ? null : 'vaccines')}
                />
              </div>
            </div>
          )}

          {activeSectionCard === 'documents' && (
            <div className="emr-main-row-handle">
              <div className="animation-emr-card-patient-emr">
                <EMRCard
                  number={4}
                  footerText="Reports"
                  icon={faFileInvoice}
                  backgroundColor="var(--card-dark-pink)"
                  width={150}
                  height={100}
                  onClick={() => setActiveCard(activeCard === 'reports' ? null : 'reports')}
                />
              </div>

              <div className="animation-emr-card-patient-emr">
                <EMRCard
                  number={4}
                  footerText="Attachments"
                  icon={faPaperclip}
                  backgroundColor="var(--card-dark-pink)"
                  width={150}
                  height={100}
                  onClick={() => setActiveCard(activeCard === 'attachments' ? null : 'attachments')}
                />
              </div>
            </div>
          )}

          {activeSectionCard === 'services' && (
            <div className="emr-main-row-handle">
              <div className="animation-emr-card-patient-emr">
                <EMRCard
                  number={4}
                  footerText="Applied Services"
                  icon={faConciergeBell}
                  backgroundColor="var(--card-gray)"
                  width={150}
                  height={100}
                  onClick={() =>
                    setActiveCard(activeCard === 'appliedservices' ? null : 'appliedservices')
                  }
                />
              </div>

              <div className="animation-emr-card-patient-emr">
                <EMRCard
                  number={5}
                  footerText="Dental Charts"
                  icon={faTooth}
                  backgroundColor="var(--card-gray)"
                  width={150}
                  height={100}
                  onClick={() =>
                    setActiveCard(activeCard === 'dentalcharts' ? null : 'dentalcharts')
                  }
                />
              </div>

              <div className="animation-emr-card-patient-emr">
                <EMRCard
                  number={5}
                  footerText="Ledger Account"
                  icon={faMoneyBillTransfer}
                  backgroundColor="var(--card-gray)"
                  width={150}
                  height={100}
                  onClick={() =>
                    setActiveCard(activeCard === 'ledgeraccount' ? null : 'ledgeraccount')
                  }
                />
              </div>
            </div>
          )}
        </div>

        {/* Active Tables */}
        {activeCard === 'appointments' && <AppointmentsTable />}
        {activeCard === 'clinicvisits' && <ClinicVisitsTable />}
        {activeCard === 'inpatient' && <InpatientTable />}
        {activeCard === 'daycase' && <DayCaseTable />}
        {activeCard === 'emergency' && <EmergencyTable />}
        {activeCard === 'nurseassessments' && <NurseAssessmentsTable />}
        {activeCard === 'procedures' && <ProceduresTable />}
        {activeCard === 'operations' && <OperationsTable />}
        {activeCard === 'consultations' && <ConsultationsTable />}
        {activeCard === 'laboratory' && <LaboratoryTable />}
        {activeCard === 'radiology' && <RadiologyTable />}
        {activeCard === 'pathology' && <PathologyTable />}
        {activeCard === 'medications' && <CurrentMedicationsTable />}
        {activeCard === 'vaccines' && <VaccinationTable />}
        {activeCard === 'reports' && <ClinicalReportsTable />}
        {activeCard === 'attachments' && <AttachmentsTable />}
        {activeCard === 'appliedservices' && <AppliedServicesTable />}
        {activeCard === 'dentalcharts' && <DentalChartsTable />}
        {activeCard === 'ledgeraccount' && <LedgerAccountTable />}
        {activeCard === 'pastmedicalhistory' && <PastMedicalHistoryTable />}

        {/* 
        <MyTable
          data={encounterListResponse?.object ?? []}
          columns={columns}
          height={580}
          loading={isFetching}
          onRowClick={rowData => {
            setLocalPatient(rowData.patientObject);
          }}
          rowClassName={isSelected}
          page={pageIndex}
          rowsPerPage={rowsPerPage}
          totalCount={totalCount}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        /> 
        */}
      </div>

      <div className="emr-right">
        <div className="patient-side-main-container-handle">
          <PatientSide patient={localPatient} encounter={encounter} />
        </div>
        <div className="profile-sidebar-main-container-handle">
          <ProfileSidebar
            expand={expand}
            setExpand={setExpand}
            windowHeight={windowHeight}
            setLocalPatient={setLocalPatient}
            setRefetchData={setRefetchData}
            refetchData={refetchData}
          />
        </div>
      </div>
    </div>
  );
};

export default PatientEMRModal;
