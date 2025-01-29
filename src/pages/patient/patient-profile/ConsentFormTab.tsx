import React, { useEffect, useState } from 'react';
import { Modal, Button, Placeholder, Form, InputGroup, Divider, Input, Toggle, RadioGroup, Radio, Table, IconButton, SelectPicker, ButtonToolbar, Drawer, Pagination } from 'rsuite';
import './styles.less';
import Translate from '@/components/Translate';
import { Block, Check, DocPass, Edit, History, Icon, PlusRound, Detail } from '@rsuite/icons';
import TrashIcon from '@rsuite/icons/Trash';
import { FaClock, FaPencil, FaPlus, FaQuestion } from 'react-icons/fa6';
import { useGetPractitionersQuery } from '@/services/setupService'
import RemindOutlineIcon from '@rsuite/icons/RemindOutline';
import { initialListRequest, ListRequest } from '@/types/types';
const { Column, HeaderCell, Cell } = Table;
import MyLabel from '@/components/MyLabel';
import MyInput from '@/components/MyInput';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { newApPractitioner, newApPatientPreferredHealthProfessional } from '@/types/model-types-constructor';
import { ApPractitioner, ApPatientPreferredHealthProfessional } from '@/types/model-types';
import {
    useGetLovValuesByCodeQuery,
    useGetFacilitiesQuery

} from '@/services/setupService';
import {
    useSavePatientPreferredHealthProfessionalMutation,
    useGetPatientPreferredHealthProfessionalQuery,
    useDeletePatientPreferredHealthProfessionalMutation

} from '@/services/patientService';
import { notify } from '@/utils/uiReducerActions';
import { disconnect } from 'process';
const ConsentFormTab = ({ patient, isClick }) => {
    

    return (
        <>
            <Form layout="inline" fluid>
                <Table
                  height={600}
                  data={[]}
                  headerHeight={40}
                  rowHeight={50}
                  bordered
                  cellBordered
                  onRowClick={rowData => {
                    
                  }}
                  
                >
                  <Column sortable flexGrow={4}>
                    <HeaderCell>
                      <Translate>Procedure Name</Translate>
                    </HeaderCell>
                    <Cell/>
                     
                  </Column>

                  <Column sortable flexGrow={4}>
                    <HeaderCell>
                      <Translate>Physician</Translate>
                    </HeaderCell>
                    <Cell/>
                      
                  
                  </Column>

                  <Column sortable flexGrow={4}>
                    <HeaderCell>
                      <Translate>Date and Time of Procedure</Translate>
                    </HeaderCell>
                    <Cell />
                  </Column>
                  <Column sortable flexGrow={4}>
                    <HeaderCell>
                      <Translate>Consent  Status </Translate>
                    </HeaderCell>
                    <Cell />
                     

                  </Column>
                  <Column sortable flexGrow={4}>
                    <HeaderCell>
                      <Translate>Sign Date and Time</Translate>
                    </HeaderCell>
                    <Cell />
                    
                  </Column>
                 
                </Table>
              </Form>
            
        </>
    );
};

export default ConsentFormTab;
