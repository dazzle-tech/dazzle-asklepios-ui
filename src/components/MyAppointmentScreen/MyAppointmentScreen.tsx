import React, { useState } from 'react';
import './MyAppointmentScreen.less';
import AllAppointmentModal from './AppointmentCalender/AllAppointmentModal';
import MyModal from '../MyModal/MyModal';
import MyButton from '../MyButton/MyButton';
import DetailsCard from '../DetailsCard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendar,
  faPerson,
  faClock,
  faFileWaveform,
  faCircleInfo
} from '@fortawesome/free-solid-svg-icons';
import SectionContainer from '../SectionsoContainer';
import TodayAppointmentCard from './TodayAppointmentCard';
import UpcomingAppointmentCard from './UpcomingAppointmentCard';
import MyPatientAppointmentCard from './MyPatientAppointmentCard';
import EmergencyContactAppointmentModal from './EmergencyContactAppointmentModal';
import PatientEMR from '@/pages/patient/patient-emr';

const MyAppointmentScreen = () => {
  const [showAllAppointmentsModal, setShowAllAppointmentsModal] = useState(false);
  const [showPatientRecordsModal, setShowPatientRecordsModal] = useState(false);
  const [showEmergencyContactsModal, setShowEmergencyContactsModal] = useState(false);

  return (
    <>
      <div className="count-div-on-top-of-page">
        <DetailsCard
          title="Today's Appointments"
          number={8}
          icon={faCalendar}
          color="--gray-dark"
          backgroundClassName="result-ready-section"
          width={'16vw'}
        />
        <DetailsCard
          title="Total Patients"
          number={200}
          icon={faPerson}
          color="--primary-blue"
          backgroundClassName="sample-collected-section"
          width={'16vw'}
        />
        <DetailsCard
          title="Next Appointment"
          number={'2:00 PM'}
          icon={faClock}
          color="--primary-purple"
          backgroundClassName="new-section"
          width={'16vw'}
        />
        <DetailsCard
          title="Pending Reviews"
          number={3}
          icon={faFileWaveform}
          color="--green-600"
          backgroundClassName="total-test-section"
          width={'16vw'}
        />
      </div>
      <div className="main-appointment-screen-handle-container">
        <SectionContainer
          title={
            <h6 className="h3-appointment-screen-handle">
              <FontAwesomeIcon icon={faCircleInfo} style={{ color: 'var(--primary-blue)' }} />
              Quick Actions
            </h6>
          }
          content={
            <div className="appointments-quick-actions-buttons">
              <MyButton appearance="ghost" onClick={() => setShowAllAppointmentsModal(true)}>
                View All Appointments
              </MyButton>
              <MyButton appearance="ghost" onClick={() => setShowPatientRecordsModal(true)}>
                Patient Records
              </MyButton>
              <MyButton appearance="ghost" onClick={() => setShowEmergencyContactsModal(true)}>
                Emergenct Contacts
              </MyButton>
            </div>
          }
        />

        <div className="middle-part-appointment-screen-handle">
          <SectionContainer
            title={
              <>
                <h6 className="h3-appointment-screen-handle">
                  <FontAwesomeIcon style={{ color: 'var(--primary-blue)' }} icon={faCalendar} />
                  Today's Appointments
                </h6>
              </>
            }
            content={
              <div>
                <TodayAppointmentCard />
              </div>
            }
          />
          <div className="upcoming-appointment-screen-handle">
            <SectionContainer
              title={
                <>
                  <h6 className="h3-appointment-screen-handle">
                    <FontAwesomeIcon style={{ color: 'var(--primary-blue)' }} icon={faClock} />
                    Upcoming
                  </h6>
                </>
              }
              content={
                <div>
                  <UpcomingAppointmentCard />
                </div>
              }
            />
          </div>
        </div>

        <SectionContainer
          title={
            <>
              <h6 className="h3-appointment-screen-handle">
                <FontAwesomeIcon style={{ color: 'var(--primary-blue)' }} icon={faPerson} />
                My Patients
              </h6>
            </>
          }
          content={
            <div>
              <MyPatientAppointmentCard />
            </div>
          }
        />
      </div>

      <MyModal
        open={showAllAppointmentsModal}
        setOpen={setShowAllAppointmentsModal}
        title="All Appointments"
        size="70vw"
        bodyheight="83vh"
        content={<AllAppointmentModal />}
        hideBack={true}
        actionButtonLabel="Save"
      />

      <MyModal
        open={showPatientRecordsModal}
        setOpen={setShowPatientRecordsModal}
        title="Patient Records"
        size="70vw"
        bodyheight="83vh"
        content={<PatientEMR />}
        hideBack={true}
        actionButtonLabel="Save"
      />

      <MyModal
        open={showEmergencyContactsModal}
        setOpen={setShowEmergencyContactsModal}
        title="Emergenct Contacts"
        size="70vw"
        bodyheight="83vh"
        content={<div className='emergency-contact-appontment-modal-container'>
        <EmergencyContactAppointmentModal />
      </div>}
        hideBack={true}
        actionButtonLabel="Save"
      />
    </>
  );
};

export default MyAppointmentScreen;
