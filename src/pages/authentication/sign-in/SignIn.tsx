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
import Logo from '../../../images/Logo_BLUE_New1.svg';
import './styles.less';
import MyButton from '@/components/MyButton/MyButton';
import { useBranding } from '@/hooks/useBranding';


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

const branding = useBranding();
const background = branding.loginBackground || Background;
  const {
    data: facilityListResponse,
    isLoading: isFacilitiesLoading,
    isError: isFacilitiesError,
    refetch: refetchFacilities
  } = useGetActiveFacilitiesQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true
  });

  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    orgKey: '',
    language: '',
    direction: ''
  });

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { data: langdefult } = useGetLovDefultByCodeQuery('SYSTEM_LANG');

  const [login, { isLoading: isLoggingIn }] = useLoginMutation();
  const [getAccount] = useLazyGetAccountQuery();
  const [getDefaultUserDepartmentByUser] = useLazyGetDefaultUserDepartmentByUserQuery();
  const [getMenuTrigger] = useLazyGetMenuQuery();

  const { data: langData, isLoading: isLanguagesLoading } = useGetAllLanguagesQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true
  });

  useEffect(() => {
    if (!isFacilitiesError) {
      return;
    }

    const retryTimer = window.setInterval(() => {
      refetchFacilities();
    }, 5000);

    return () => window.clearInterval(retryTimer);
  }, [isFacilitiesError, refetchFacilities]);

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
      navigate('/', { replace: true });
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


  useEffect(() => {
    const languages = Array.isArray(langData) ? langData : [];
    const defaultLangKey = languages[0]?.langKey;

    if (defaultLangKey && !credentials.language) {
      setCredentials(prev => ({ ...prev, language: defaultLangKey }));
    }
  }, [langData, credentials.language]);

  useEffect(() => {
    const selectedObject = langData?.find(item => item?.langKey === credentials?.language);

    if (selectedObject?.direction) {
      localStorage.setItem('direction', selectedObject.direction);
    }
  }, [credentials.language, langData]);

  return (
<Panel
  className="panel"
  style={{
    backgroundImage: `url(${background})`
  }}
>      <Panel
        bordered
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          padding: '20px',
          borderRadius: '10px'
        }}
      >
        <div className="bodySignInDiv">
          <Panel className="logo-panel">
           <img src={branding.logo || Logo} alt="Logo" />
          </Panel>

          <Panel className="sign-in-panel ">
            <Form fluid >
              <MyInput
                width="100%"
                fieldName="language"
                fieldType="select"
                selectData={langData ?? []}
                selectDataLabel="langName"
                selectDataValue="langKey"
                defaultSelectValue={langData?.[0]?.langKey || ''}
                record={credentials}
                setRecord={setCredentials}
                placeholder="Select Language"
                showLabel={false}
                searchable={false}
                loading={isLanguagesLoading}
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
                loading={isFacilitiesLoading}
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
                width={"26vw"}
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