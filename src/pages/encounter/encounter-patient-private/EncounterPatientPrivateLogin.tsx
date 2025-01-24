import React, { useEffect, useRef, useState } from 'react';
import {
  InputGroup,
  ButtonToolbar,
  Form,
  IconButton,
  Input,
  Panel,
  Stack,
  Divider,
  Drawer,
  Table,
  Pagination,
  Button,
  Modal,
  Tooltip,
  SelectPicker,
} from 'rsuite';
import MyLabel from '@/components/MyLabel';
import RemindOutlineIcon from '@rsuite/icons/RemindOutline';
import { useNavigate } from 'react-router-dom';
import DetailIcon from '@rsuite/icons/Detail';
import TrashIcon from '@rsuite/icons/Trash';
import FileDownloadIcon from '@rsuite/icons/FileDownload';
import { FaPlus } from 'react-icons/fa6';
const { Column, HeaderCell, Cell } = Table;
import { useAppDispatch, useAppSelector } from '@/hooks';
import 'react-tabs/style/react-tabs.css';
import Translate from '@/components/Translate';
import { Block, Check, DocPass, Edit, History, Icon, PlusRound, Detail } from '@rsuite/icons';
import { notify } from '@/utils/uiReducerActions';
import { initialListRequest, ListRequest } from '@/types/types';
import MyInput from '@/components/MyInput';
import { ApUser, ApUserAccessPrivatePatient } from '@/types/model-types';
import { newApUser, newApUserAccessPrivatePatient } from '@/types/model-types-constructor';
import { useSaveUserAccessLoginPrivatePatientMutation } from '@/services/patientService';
import { setEncounter, setPatient } from '@/reducers/patientSlice';

const EncounterPatientPrivateLogin = () => {
  const [localUser, setLocalUser] = useState<ApUser>({ ...newApUser });
  const [localLoginUser, setLocalLoginUser] = useState<ApUserAccessPrivatePatient>({ ...newApUserAccessPrivatePatient });
  const [reason, setReason] = useState(localLoginUser.reason);
  const [saveUserAccessLoginPrivatePatient, saveUserAccessLoginPrivatePatientMutation] = useSaveUserAccessLoginPrivatePatientMutation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const patientSlice = useAppSelector(state => state.patient);

  useEffect(() => {
    setReason(localLoginUser.reason)
  }, [localLoginUser])



  const handleSave = async() => {
    try {
      const response = await saveUserAccessLoginPrivatePatient({
        user: localUser,
        reason: reason
      })
        .unwrap()
        if (response?.msg=== "success") {
          dispatch(notify(`Welcome ${localUser.username}`));
          dispatch(setEncounter(patientSlice.encounter));
          dispatch(setPatient(patientSlice.patient));
          navigate('/encounter-pre-observations');
        } else {
          dispatch(notify("No matching record found"));
        }
      } catch (error) {
        dispatch(notify("No matching record found"));
      }
  };
  

  return (
    <>
      <Panel
        header={
          <h3 className="title">
            <Translate>This Patient is a Private Patient</Translate>
          </h3>
        }
      >

        <br />
        <Panel
          bordered
          style={{ padding: "16px" }}
          header={
            <h5 className="title">
              <Translate>Only Authorized Users can Access this Page !</Translate>
              <br />
            </h5>

          }
        >
          <br />
          <Stack>
            <Stack.Item grow={1}>
              <div
                style={{
                  borderRadius: '5px',
                  border: '1px solid #e1e1e1',
                  margin: '2px',
                  position: 'relative',
                  bottom: 0,
                  width: 130
                }}
              >
                <img
                  width={130}
                  height={130}

                  src={
                    'https://img.icons8.com/?size=100&id=64203&format=png&color=000000'
                  }
                />
              </div>

            </Stack.Item>
            <Stack.Item grow={15}>
              <Form layout="inline" fluid style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>

                <MyInput
                  required
                  width={165}
                  column
                  fieldName="username"
                  record={localUser}
                  setRecord={setLocalUser}

                />
                <MyInput
                  required
                  width={165}
                  column
                  fieldName="password"
                  record={localUser}
                  setRecord={setLocalUser}

                />

                <MyInput
                  required
                  width={165}
                  column
                  fieldName="reason"
                  record={localLoginUser}
                  setRecord={setLocalLoginUser}

                />


                <ButtonToolbar>
                  <IconButton
                    appearance="primary"
                    color="violet"
                    icon={<Check />}
                    onClick={handleSave}
                    style={{ marginTop: '26px' }}
                   disabled={localUser.password === "" || localUser.username === "" || localLoginUser.reason ===""}
                  >
                    <Translate>Confirm</Translate>
                  </IconButton>

                </ButtonToolbar>

              </Form>





            </Stack.Item>
          </Stack>

        </Panel>
        <br />



      </Panel>
    </>
  );
};

export default EncounterPatientPrivateLogin;