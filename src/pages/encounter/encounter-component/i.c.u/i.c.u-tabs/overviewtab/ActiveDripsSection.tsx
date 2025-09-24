import React, { useState } from "react";
import { useSelector } from "react-redux";
import SectionContainer from '@/components/SectionsoContainer';
import MyButton from '@/components/MyButton/MyButton';
import DynamicCard from '@/components/DynamicCard';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import PlusIcon from '@rsuite/icons/Plus';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWaveSquare } from '@fortawesome/free-solid-svg-icons';
import DetailsModal from "../../../drug-order/DetailsModal";
import './style.less';

const activeDrips = [
  { name: 'Norepinephrine', dose: '0.15 mcg/kg/min', status: 'stable', color: '#28a745' },
  { name: 'Propofol', dose: '25 mcg/kg/min', status: 'weaning', color: '#ffc107' },
  { name: 'Fentanyl', dose: '1.5 mcg/kg/hr', status: 'active', color: '#007bff' },
];

const ActiveDripsSection = () => {
  const [openActiveDrips, setOpenActiveDrips] = useState(false);
  const mode = useSelector((state: any) => state.ui.mode);

  const [edit, setEdit] = useState(false);
  const [orderMedication, setOrderMedication] = useState<any>({});
  const [drugKey, setDrugKey] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [patient, setPatient] = useState<any>({});
  const [encounter, setEncounter] = useState<any>({});
  const medicRefetch = () => {};
  const [openToAdd, setOpenToAdd] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  return (
    <div className={`active-drips-section ${mode === 'dark' ? 'dark' : 'light'}`}>
      <SectionContainer
        title={
          <>
            <span className="today-goals-section-title">
              <FontAwesomeIcon
                color="#3a7eeaff"
                icon={faWaveSquare}
                className="title-icon-main-title"
              />
              Active Drips
            </span>
            <div className="add-button-for-cards-over-view">
              <MyButton
                prefixIcon={() => <PlusIcon />}
                onClick={() => setOpenActiveDrips(true)}
              >
                Add
              </MyButton>
            </div>
          </>
        }
        content={
          <div className="drips-list">
            {activeDrips.map((drip, index) => (
              <DynamicCard
                key={index}
                width="100%"
                margin="0 0 15px 0"
                data={[
                  {
                    value: (
                      <div className="drip-info">
                        <div className="drip-name">{drip.name}</div>
                        <div className="drip-dose">{drip.dose}</div>
                      </div>
                    ),
                    section: 'left',
                    showLabel: false,
                  },
                  {
                    value: (
                      <MyBadgeStatus
                        contant={drip.status}
                        color={drip.color}
                      />
                    ),
                    section: 'right',
                    showLabel: false,
                  },
                ]}
              />
            ))}
          </div>
        }
      />

      <DetailsModal
        edit={edit}
        open={openActiveDrips}
        setOpen={setOpenActiveDrips}
        orderMedication={orderMedication}
        setOrderMedication={setOrderMedication}
        drugKey={drugKey}
        editing={editing}
        patient={patient}
        encounter={encounter}
        medicRefetch={medicRefetch}
        openToAdd={openToAdd}
        isFavorite={isFavorite}
      />
    </div>
  );
};

export default ActiveDripsSection;
