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
import { ApUser } from '@/types/model-types';
import { newApUser } from '@/types/model-types-constructor';



const EncounterPatientPrivateLogin = () => {
const[localUser,setLocalUser] = useState<ApUser>({ ...newApUser });
 //const [saveEmployee, saveEmployeeMutation] = useConfirmEmployeeLoginMutation();
  // const navigate = useNavigate();
  // const dispatch = useAppDispatch();
  // const [localEmployee, setLocalEmployee] = useState<ApEmployee>({ ...newApEmployee });

  // const [principalListRequest, setPrincipalListRequest] = useState<ListRequest>({
  //   ...initialListRequest,
  //   filters: [
  //     {
  //       fieldName: 'deleted_at',
  //       operator: 'isNull',
  //       value: undefined
  //     }
  //   ]
  // });
  // const principalResponse = useGetPrincipalQuery({ ...principalListRequest });
  // const data = (principalResponse?.data?.object ?? []).map(item => ({
  //   label: item.name,
  //   value: item.key
  // }));

  // const handleChangePrincipal = (value) => {
  //   setLocalEmployee({
  //     ...localEmployee,
  //     principalKey: value,
  //   });

  // };

  // const handleSave = () => {

  //   saveEmployee({ ...localEmployee }).unwrap().then(() => {
  //     dispatch(notify(`Welcom ${localEmployee.firstName} ${localEmployee.lastName} `));

  //   });

  // };
  // useEffect(() => {
  //   if (saveEmployeeMutation && saveEmployeeMutation.status === 'fulfilled' && saveEmployeeMutation.data.msg === "success") {
  //     setLocalEmployee(saveEmployeeMutation?.data?.object);

  //     navigate('/seafarer-registerd-visits', {
  //       state: { employee: saveEmployeeMutation?.data?.object }
  //     });
  //   } else if (saveEmployeeMutation && saveEmployeeMutation.status === 'rejected') {
  //     // setValidationResult(saveEmployeeMutation.error.data.validationResult);
  //   }
  // }, [saveEmployeeMutation]);
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
              <Form layout="inline" fluid>

                <MyInput
                  required
                  width={165}

                  column
                  fieldName="firstName"
                  record={localUser}
                  setRecord={setLocalUser}

                />
                <MyInput
                  required
                  width={165}
                  column
                  fieldName="secondName"
                  record={localUser}
                  setRecord={setLocalUser}

                />

                <MyInput
                  required
                  width={165}

                  column
                  fieldName="lastName"
                  record={localUser}
                  setRecord={setLocalUser}

                />
              
                <Form layout="inline" fluid style={{ display: 'flex', alignItems: 'center' }}   >
             

                <ButtonToolbar>
                    <IconButton
                      appearance="primary"
                      color="violet"
                      icon={<Check />}
                      //onClick={handleSave}
                      style={{ marginTop: '26px' }}
                      //disabled={localEmployee.firstName === "" || localEmployee.secondName === "" || localEmployee.lastName === "" || localEmployee.personId === '' || localEmployee.sfRegNo === ''}
                    >
                      <Translate>Confirm</Translate>
                    </IconButton>

                  </ButtonToolbar>

                </Form>




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