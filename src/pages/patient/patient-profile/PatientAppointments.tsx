import Translate from '@/components/Translate';
import React, { useState } from 'react';
import { Drawer, Tooltip, Form, Whisper } from 'rsuite';
import 'react-tabs/style/react-tabs.css';
import {
  useGetEncountersQuery,
  useCancelEncounterMutation,
  useCompleteEncounterMutation
} from '@/services/encounterService';
import { initialListRequest, ListRequest } from '@/types/types';
import PatientQuickAppointment from './PatientQuickAppoinment/PatientQuickAppointment';
import MyTable from '@/components/MyTable';
import './styles.less';
import MyButton from '@/components/MyButton/MyButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRectangleXmark } from '@fortawesome/free-solid-svg-icons';
import { useDispatch } from 'react-redux';
import { notify } from '@/utils/uiReducerActions';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { faPowerOff } from '@fortawesome/free-solid-svg-icons';
import EncounterDischarge from '@/pages/encounter/encounter-component/encounter-discharge';
import PatientVisitHistoryTable from './PatientVisitHistoryTable';

const PatientVisitHistory = ({
  localPatient,

}) => {

  return(
      //  <MyTable
      //   data={visiterHistoryResponse?.object ?? []}
      //   columns={tableColumns}
      //   height={580}
      //   loading={isFetching}
      // />
      <></>
  );
};

export default PatientVisitHistory;
