import MyInput from '@/components/MyInput';
import { useGetLovDefultByCodeQuery } from '@/services/setupService';

import {
  setMenu,
  setSelectedDepartment,
  setTenant,
  setToken,
  setUser
} from '@/reducers/authSlice';

import { setLang, setTranslations } from '@/reducers/uiSlice';
import { useLazyGetAccountQuery } from '@/services/accountService';
import { useLoginMutation } from '@/services/authServiceApi';
import { enumsApi } from '@/services/enumsApi';
import { useGetActiveFacilitiesQuery } from '@/services/security/facilityService';
import { useLazyGetMenuQuery } from '@/services/security/UserRoleService';
import { useLazyGetDefaultUserDepartmentByUserQuery } from '@/services/security/userDepartmentsService';
import { useGetAllLanguagesQuery } from '@/services/setup/languageService';
import { useLazyGetDictionaryQuery } from '@/services/setup/translationService';
import { store } from '@/store';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Button, Form, Panel } from 'rsuite';
import Background from '../../../images/auth-bg.png';
import Logo from '../../../images/Logo_BLUE_New.png';
import './styles.less';
import MyButton from '@/components/MyButton/MyButton';

const mapDefaultDepartmentToSelectedDepartment = (
  defaultDepartment: any,
  selectedFacility: any
) => ({
  departmentId: defaultDepartment?.departmentId ?? defaultDepartment?.id ?? null,
  facilityId: defaultDepartment?.facilityId ?? selectedFacility?.id ?? null,
  departmentName: defaultDepartment?.departmentName ?? defaultDepartment?.name ?? null,
  facilityName:
    defaultDepartment?.facilityName ??
    selectedFacility?.facilityName ??
    selectedFacility?.name ??
    null
});

const SignIn = () => {
  const [getDictionary] = useLazyGetDictionaryQuery();
  const [errText, setErrText] = useState(' ');

  const { data: langdefult } = useGetLovDefultByCodeQuery('SYSTEM_LANG');

  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    orgKey: '',
    language: '',
    direction: ''
  });

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [login, { isLoading: isLoggingIn }] = useLoginMutation();
  const [getAccount] = useLazyGetAccountQuery();
  const [getDefaultUserDepartmentByUser] = useLazyGetDefaultUserDepartmentByUserQuery();
  const [getMenuTrigger] = useLazyGetMenuQuery();

  const { data: facilityListResponse } = useGetActiveFacilitiesQuery({});
  const result = useGetActiveFacilitiesQuery({});;
  const { data: langData } = useGetAllLanguagesQuery({});

  const handleLogin = async () => {
    if (
      !credentials.username ||
      !credentials.password ||
      !credentials.orgKey ||
      !credentials.language
    ) {
      setErrText('Please fill all required fields.');
      return;
    }

    try {
      const resp = await login({
        username: credentials.username,
        password: credentials.password,
        facilityId: Number(credentials.orgKey),
        language: credentials.language,
        rememberMe: true
      }).unwrap();

      dispatch(setToken(resp.id_token));
      localStorage.setItem('id_token', resp.id_token);

      const userResp = await getAccount().unwrap();
      dispatch(setUser(userResp));

      dispatch(setLang(credentials.language));

      const selectedFacility =
        (facilityListResponse ?? []).find((f: any) => f.id === Number(credentials.orgKey)) ||
        null;

      const existingTenant = JSON.parse(localStorage.getItem('tenant') || 'null') || {};
      dispatch(setTenant({ ...existingTenant, selectedFacility }));

      if (userResp?.id) {
        try {
          const defaultDepartment = await getDefaultUserDepartmentByUser(
            userResp.id,
            false
          ).unwrap();

          dispatch(
            setSelectedDepartment(
              mapDefaultDepartmentToSelectedDepartment(defaultDepartment, selectedFacility)
            )
          );
        } catch (departmentError) {
          console.error('Failed to load default department:', departmentError);
          dispatch(setSelectedDepartment(null));
        }
      }

      if (userResp?.id && selectedFacility?.id) {
        const menuResponse = await getMenuTrigger({
          userId: userResp.id,
          facilityId: selectedFacility.id
        }).unwrap();

        dispatch(setMenu(menuResponse));
        localStorage.setItem('menu', JSON.stringify(menuResponse));
      }

      const dict = await getDictionary(credentials.language).unwrap();

      localStorage.setItem('language', credentials.language);
      localStorage.setItem('dict', JSON.stringify(dict));
      localStorage.setItem('user', JSON.stringify(userResp));

      dispatch(setLang(credentials.language));
      dispatch(setTranslations(dict));

      store.dispatch(enumsApi.util.prefetch('getAllEnums', undefined, { force: true }));

      setErrText(' ');
      navigate('/');
    } catch (err: any) {
      if (err?.status === 401 || err?.data?.detail === 'Invalid credentials') {
        setErrText('Invalid username or password.');
      } else if (err?.status === 'FETCH_ERROR') {
        setErrText('Server Cannot be Reached, Please Contact System Administrator');
      } else if (err?.status) {
        setErrText(`Server error (${err.status}). Please try again.`);
      } else {
        setErrText('Unexpected error occurred.');
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleLogin();
    }
  };

  useEffect(() => {
    const selectedObject = langData?.find(item => item?.langKey === credentials?.language);

    if (selectedObject?.direction) {
      localStorage.setItem('direction', selectedObject.direction);
    }
  }, [credentials.language, langData]);

  return (
    <Panel className="panel" style={{ backgroundImage: `url(${Background})` }}>
      <Panel
        bordered
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          padding: '20px',
          borderRadius: '10px'
        }}
      >
        <div className="bodySignInDiv">
          <Panel className="logo-panel">
            <img src={Logo} alt="Tenant Logo" />
          </Panel>

          <Panel className="sign-in-panel ">
            <Form fluid onKeyPress={handleKeyPress}>
              <MyInput
                width="100%"
                fieldName="language"
                fieldType="select"
                selectData={langData}
                selectDataLabel="langName"
                selectDataValue="langKey"
                defaultSelectValue={langdefult?.object?.key?.toString() ?? ''}
                record={credentials}
                setRecord={setCredentials}
                placeholder="Select Language"
                showLabel={false}
                searchable={false}
              />

              <MyInput
                placeholder="Select Facility"
                width="100%"
                fieldType="select"
                fieldLabel="Facility"
                selectData={facilityListResponse ?? []}
                selectDataLabel="name"
                selectDataValue="id"
                fieldName="orgKey"
                record={credentials}
                setRecord={setCredentials}
                showLabel={false}
                searchable={false}
              />

              <MyInput
                width="100%"
                placeholder="Enter User Name"
                fieldLabel="User Name"
                fieldName="username"
                record={credentials}
                setRecord={setCredentials}
                showLabel={false}
              />
               <MyInput
                width="100%"
                placeholder="Enter Password"
                fieldLabel="Password"
                fieldName="password"
                fieldType="password"
                record={credentials}
                setRecord={setCredentials}
                showLabel={false}
              />
            


              <p style={{ color: 'red', marginBottom: 10 }}>{errText}</p>
              <MyButton 
              onClick={handleLogin}
              loading={isLoggingIn}
              width={"27vw"}
              radius={'5px'}
              >Sign in</MyButton>
             
            </Form>
          </Panel>
        </div>
      </Panel>
    </Panel>
  );
};

export default SignIn;