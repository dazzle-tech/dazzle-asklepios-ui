import React, { useEffect, useState } from 'react';
import { initialListRequest, ListRequest } from '@/types/types';
import { useAppDispatch } from '@/hooks';
import { Checkbox } from 'rsuite';
import { useSaveFunctionalAssessmentMutation, useGetFunctionalAssessmentsQuery } from '@/services/encounterService';
import PlusIcon from '@rsuite/icons/Plus';
import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import { newApFunctionalAssessment } from '@/types/model-types-constructor';
import { ApFunctionalAssessment } from '@/types/model-types';
import { notify } from '@/utils/uiReducerActions';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import CancellationModal from '@/components/CancellationModal';
import { MdModeEdit } from 'react-icons/md';
import MyTable from '@/components/MyTable';
import { formatDateWithoutSeconds } from '@/utils';
import { Tabs } from 'rsuite';


const DoctorRound = ({ patient, encounter, edit }) => {
  

    return (
<Tabs  appearance="subtle" className="doctor-round-tabs">
                                <Tabs.Tab eventKey="1" title="New Round">
                                    
                                </Tabs.Tab>
                                <Tabs.Tab eventKey="2" title="Allergies">
                                   
                                </Tabs.Tab>
                                <Tabs.Tab eventKey="3" title="Medical Warnings">
                                   
                                </Tabs.Tab>
                                

                            </Tabs>
    );
};
export default DoctorRound;


