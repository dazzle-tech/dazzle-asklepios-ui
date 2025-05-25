import React, { useEffect, useState } from 'react';
import { Form, Panel, Stack } from 'rsuite';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/hooks';
import 'react-tabs/style/react-tabs.css';
import Translate from '@/components/Translate';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { notify } from '@/utils/uiReducerActions';
import MyInput from '@/components/MyInput';
import { ApUser, ApUserAccessPrivatePatient } from '@/types/model-types';
import { newApUser, newApUserAccessPrivatePatient } from '@/types/model-types-constructor';
import { useSaveUserAccessLoginPrivatePatientMutation } from '@/services/patientService';
import { useLocation } from 'react-router-dom';
import MyButton from '@/components/MyButton/MyButton';
import { faCheckDouble } from '@fortawesome/free-solid-svg-icons';
import './styles.less'
const EncounterPatientPrivateLogin = () => {
  const [localUser, setLocalUser] = useState<ApUser>({ ...newApUser });
  const [localLoginUser, setLocalLoginUser] = useState<ApUserAccessPrivatePatient>({ ...newApUserAccessPrivatePatient });
  const [reason, setReason] = useState(localLoginUser.reason);
  const [saveUserAccessLoginPrivatePatient, saveUserAccessLoginPrivatePatientMutation] = useSaveUserAccessLoginPrivatePatientMutation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const location = useLocation();
  const propsData = location.state;
  useEffect(() => {
    setReason(localLoginUser.reason)
  }, [localLoginUser])
  const handleSave = async() => {
    try {
      const response = await saveUserAccessLoginPrivatePatient({
        user: localUser,
        reason: reason,
        patientKey:propsData?.patient?.key
      })
        .unwrap()
        if (response?.msg=== "success") {
          dispatch(notify(`Welcome ${localUser.username}`));
          if(propsData.info === "toNurse"){navigate('/nurse-station',{ state: { patient:propsData.patient ,encounter:propsData.encounter } })}
          else if(propsData.info === "toEncounter"){navigate('/encounter',{ state: { info: "toEncounter", fromPage: "EncounterList" ,patient:propsData.patient ,encounter:propsData.encounter } } )}
          
        } else {
          dispatch(notify("No matching record found"));
        }
      } catch (error) {
        dispatch(notify("No matching record found"));
      }
  };
  
  return (
      <Panel header={<h3 className="title"><Translate>This Patient is a Private Patient</Translate></h3>}>
        <br />
        <Panel bordered className='custom-panel'  header={ <h5 className="title"> <Translate>Only Authorized Users can Access this Page !</Translate> <br /></h5> } >
          <br />
          <Stack>
            <Stack.Item grow={1}>
              <div className="custom-box" >
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
              <Form layout="inline" fluid className="form-content-fields" >
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
                  fieldType="password"
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
                <MyButton
                    prefixIcon={()=> <FontAwesomeIcon icon={faCheckDouble} />}
                    onClick={handleSave}                    
                    disabled={localUser.password === "" || localUser.username === "" || localLoginUser.reason ===""}
                  >
                    <Translate>Confirm</Translate>
                  </MyButton>
              </Form>
            </Stack.Item>
          </Stack>
        </Panel>
        <br />
      </Panel>
  );
};

export default EncounterPatientPrivateLogin;