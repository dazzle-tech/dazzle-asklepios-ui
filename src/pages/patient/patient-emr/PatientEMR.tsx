import EMRCard from '@/components/EMRCard';
import SectionContainer from '@/components/SectionsoContainer';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import PatientHistory from '@/pages/encounter/encounter-component/patient-history';
import PatientSide from '@/pages/encounter/encounter-main-info-section/PatienSide';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { setEncounter, setPatient } from '@/reducers/patientSlice';
import { newApEncounter } from '@/types/model-types-constructor';
import { newPatient } from '@/types/model-types-constructor-new';
import { Patient } from '@/types/model-types-new';
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
import { useLocation, useNavigate } from 'react-router-dom';
import 'react-tabs/style/react-tabs.css';
import { DOMHelper } from 'rsuite';
import ProfileSidebar from '../patient-profile/ProfileSidebar-new';
import AppliedServicesTable from './emr-tables/AppliedServicesTable';
import AppointmentsTable from './emr-tables/AppointmentsTable';
import AttachmentsTable from './emr-tables/AttachmentsTable';
import ClinicalFormsTable from './emr-tables/ClinicalFormsTable';
import ConsultationsTable from './emr-tables/ConsultationsTable';
import CurrentMedicationsTable from './emr-tables/CurrentMedicationsTable';
import DentalChartsTable from './emr-tables/DentalChartsTable';
import LaboratoryTable from './emr-tables/LaboratoryTable';
import LedgerAccountTable from './emr-tables/LedgerAccountTable';
import NurseAssessmentsTable from './emr-tables/NurseAssessmentsTable';
import OperationsTable from './emr-tables/OperationsTable';
import ProceduresTable from './emr-tables/ProceduresTable';
import RadiologyTable from './emr-tables/RadiologyTable';
import VaccinationTable from './emr-tables/VaccinationTable';
import VisitHistoryTable from './emr-tables/VisitHistoryTable';
import './styles.less';
import { set } from 'lodash';

const { getHeight } = DOMHelper;

type PatientEMRProps = {
  inModal?: boolean;
  patient?: Patient;
  encounter?: any;
  hideProfileSidebar?: boolean;
};

const PatientEMR: React.FC<PatientEMRProps> = ({
  inModal = false,
  patient,
  encounter: enc,
  hideProfileSidebar
}) => {
  const [expand, setExpand] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const location = useLocation();
  const propsData = patient || enc ? undefined : (location.state as any);
  console.log('PatientEMR propsData', propsData?.patient, propsData?.encounter);
  const [encounter, setLocalEncounter] = useState<any>(
    enc ?? propsData?.encounter ?? { ...newApEncounter, discharge: false }
  );
  const [quickAppointmentModel, setQuickAppointmentModel] = useState(false);

  const [localPatient, setLocalPatient] = useState<Patient>(
    patient
      ? patient
      : propsData?.patient
        ? propsData.patient
        : propsData?.fromPage === 'clinicalVisit'
          ? propsData?.localPatient
          : { ...newPatient }
  );

  const [refetchData, setRefetchData] = useState(false);

  const [windowHeight, setWindowHeight] = useState(getHeight(window));

  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [activeSectionCard, setActiveSectionCard] = useState<string | null>(null);

  useEffect(() => {
    if (localPatient) {
      dispatch(setPatient(localPatient));
    }
    if (encounter) {
      dispatch(setEncounter(encounter));
    }
  }, [localPatient, encounter, dispatch]);

  useEffect(() => {
    if (patient || enc) {
      if (patient) setLocalPatient(patient);
      if (enc) setLocalEncounter(enc);
      return;
    }

    const stateData = location.state as any;
    if (stateData?.patient) {
      setLocalPatient(stateData.patient);
    } else if (stateData?.fromPage === 'clinicalVisit' && stateData?.localPatient) {
      setLocalPatient(stateData.localPatient);
    }

    if (stateData?.encounter) {
      setLocalEncounter(stateData.encounter);
    }
  }, [patient, enc, location.state]);



  useEffect(() => {
    return () => {
      if (!inModal) {
        dispatch(setPageCode(''));
        dispatch(setDivContent('  '));
      }
    };
  }, [inModal, dispatch]);


  useEffect(() => {
    if (activeSectionCard) {
      setActiveCard(null);
    }
  }, [activeSectionCard]);

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
              active={activeSectionCard === 'history'}
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
              active={activeSectionCard === 'visits'}
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
              active={activeSectionCard === 'clinical'}
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
              active={activeSectionCard === 'diagnostics'}
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
              active={activeSectionCard === 'treatment'}
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
              active={activeSectionCard === 'documents'}
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
              active={activeSectionCard === 'services'}
            />
          </div>

          <div className="animation-emr-card-patient-emr">
            <EMRCard
              number={0}
              footerText="All"
              icon={faBarsProgress}
              backgroundColor="black"
              width={170}
              height={100}
              onClick={() => setActiveCard(activeCard === 'all' ? null : 'all')}
            />
          </div>

        </div>

        <div className="emr-main-row-handle">
          {activeSectionCard === 'history' && (
            <div className="emr-main-row-handle">
              {/* <div className="animation-emr-card-patient-emr">
                <EMRCard
                  number={10}
                  footerText="60s"
                  icon={faBarsProgress}
                  backgroundColor="var(--card-purple)"
                  width={150}
                  height={100}
                  onClick={() => alert('Clicked')}
                />
              </div> */}
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
                  active={activeCard === 'pastmedicalhistory'}
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
                  active={activeCard === 'appointments'}
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
                  active={activeCard === 'clinicvisits'}
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
                  active={activeCard === 'inpatient'}
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
                  active={activeCard === 'emergency'}
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
                  active={activeCard === 'daycase'}
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
                  active={activeCard === 'consultations'}
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
                  active={activeCard === 'nurseassessments'}
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
                  active={activeCard === 'procedures'}
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
                  active={activeCard === 'operations'}
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
                  active={activeCard === 'laboratory'}
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
                  active={activeCard === 'radiology'}
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
                  active={activeCard === 'pathology'}
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
                  active={activeCard === 'medications'}
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
                  active={activeCard === 'vaccines'}
                />
              </div>
            </div>
          )}

          {activeSectionCard === 'documents' && (
            <div className="emr-main-row-handle">
              <div className="animation-emr-card-patient-emr">
                <EMRCard
                  number={4}
                  footerText="Forms"
                  icon={faFileInvoice}
                  backgroundColor="var(--card-dark-pink)"
                  width={150}
                  height={100}
                  onClick={() => setActiveCard(activeCard === 'forms' ? null : 'forms')}
                  active={activeCard === 'forms'}
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
                  active={activeCard === 'attachments'}
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
                  active={activeCard === 'appliedservices'}
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
                  active={activeCard === 'dentalcharts'}
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
                  active={activeCard === 'ledgeraccount'}
                />
              </div>
            </div>
          )}
        </div>


        {activeCard === 'all' && (
          <div className="emr-all-scroll-wrapper">
            <div className="emr-all-sections">

              {/* ================= HISTORY ================= */}
              <SectionContainer
                title={<Translate>Patient History</Translate>}
                content={<PatientHistory toShowData={true} patient={localPatient} />}
              />

              {/* ================= VISITS ================= */}
              <SectionContainer
                title={<Translate>Appointments</Translate>}
                content={<AppointmentsTable />}
              />

              <SectionContainer
                title={<Translate>Clinic Visits</Translate>}
                content={
                  <VisitHistoryTable
                    localPatient={localPatient}
                    quickAppointmentModel={quickAppointmentModel}
                    setQuickAppointmentModel={setQuickAppointmentModel}
                    departmentType="OUTPATIENT_CLINIC"
                  />
                }
              />

              <SectionContainer
                title={<Translate>Emergency Visits</Translate>}
                content={<VisitHistoryTable
                  localPatient={localPatient}
                  quickAppointmentModel={quickAppointmentModel}
                  setQuickAppointmentModel={setQuickAppointmentModel}
                  departmentType="EMERGENCY_ROOM"
                />}
              />

              {/* ================= CLINICAL ================= */}
              <SectionContainer
                title={<Translate>Consultations</Translate>}
                content={<ConsultationsTable patient={localPatient} />}
              />

              <SectionContainer
                title={<Translate>Procedures</Translate>}
                content={<ProceduresTable patient={localPatient} />}
              />

              <SectionContainer
                title={<Translate>Operations</Translate>}
                content={<OperationsTable />}
              />

              {/* ================= DIAGNOSTICS ================= */}
              <SectionContainer
                title={<Translate>Laboratory</Translate>}
                content={<LaboratoryTable patient={localPatient} />}
              />

              <SectionContainer
                title={<Translate>Radiology</Translate>}
                content={<RadiologyTable patient={localPatient} />}
              />

              {/* ================= TREATMENT ================= */}
              <SectionContainer
                title={<Translate>Current Medications</Translate>}
                content={<CurrentMedicationsTable patient={localPatient} />}
              />

              <SectionContainer
                title={<Translate>Vaccinations</Translate>}
                content={<VaccinationTable patient={localPatient} />}
              />

              {/* ================= DOCUMENTATION ================= */}
              <SectionContainer
                title={<Translate>Clinical Forms</Translate>}
                content={<ClinicalFormsTable />}
              />

              <SectionContainer
                title={<Translate>Attachments</Translate>}
                content={<AttachmentsTable localPatient={localPatient} />}
              />

              {/* ================= SERVICES ================= */}
              <SectionContainer
                title={<Translate>Applied Services</Translate>}
                content={<AppliedServicesTable patient={localPatient} />}
              />

              <SectionContainer
                title={<Translate>Dental Charts</Translate>}
                content={<DentalChartsTable />}
              />

              <SectionContainer
                title={<Translate>Ledger Account</Translate>}
                content={<LedgerAccountTable />}
              />

            </div>
          </div>
        )}





        {/* Active Tables */}
        {activeCard === 'appointments' && <AppointmentsTable />}

        {activeCard === 'clinicvisits' && (
          <VisitHistoryTable
            localPatient={localPatient}
            departmentType="OUTPATIENT_CLINIC"
          />
        )}
        {/* {activeCard === 'inpatient' && <InpatientTable />} */}
        {/* {activeCard === 'daycase' && <DayCaseTable />} */}
        {activeCard === 'emergency' && (
          <VisitHistoryTable
            localPatient={localPatient}
            departmentType="EMERGENCY_ROOM"
          />
        )}
        {activeCard === 'nurseassessments' && (<NurseAssessmentsTable patient={localPatient} />)}
        {activeCard === 'procedures' && <ProceduresTable patient={localPatient} />}
        {activeCard === 'operations' && <OperationsTable />}
        {activeCard === 'consultations' && <ConsultationsTable patient={localPatient} />}
        {activeCard === 'laboratory' && <LaboratoryTable patient={localPatient} />}
        {activeCard === 'radiology' && <RadiologyTable patient={localPatient} />}
        {/* {activeCard === 'pathology' && <PathologyTable />} */}
        {activeCard === 'medications' && <CurrentMedicationsTable patient={localPatient} />}
        {activeCard === 'vaccines' && <VaccinationTable patient={localPatient} />}
        {activeCard === 'forms' && <ClinicalFormsTable />}
        {activeCard === 'attachments' && <AttachmentsTable localPatient={localPatient} />}
        {activeCard === 'appliedservices' && <AppliedServicesTable patient={localPatient} />}
        {activeCard === 'dentalcharts' && <DentalChartsTable />}
        {activeCard === 'ledgeraccount' && <LedgerAccountTable />}
        {activeCard === 'pastmedicalhistory' && (
          <PatientHistory toShowData={true} patient={localPatient} />
        )}
      </div>

      <div className="emr-right">
        <div className="patient-side-main-container-handle">
          
              <PatientSide
                patient={patient}
                setPatient={setPatient}
                encounter={encounter}
                showDiagnosis={false}
                showVisitDetails={false}
                showBalance={false}
              />
        </div>
        {!hideProfileSidebar && (
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
        )}
      </div>
    </div>
  );
};

export default PatientEMR;
