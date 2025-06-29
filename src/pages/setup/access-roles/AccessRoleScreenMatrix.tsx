import Translate from '@/components/Translate';
import React, { useEffect, useState } from 'react';
import { Panel, Toggle, Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import {
  useGetScreenAccessMatrixQuery,
  useSaveScreenAccessMatrixMutation
} from '@/services/setupService';
import { IconButton } from 'rsuite';
import { FaLockOpen } from 'react-icons/fa6';
import MyButton from '@/components/MyButton/MyButton';
import './styles.less';
import MyTable from '@/components/MyTable';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import BackButton from '@/components/BackButton/BackButton';
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch } from '@/hooks';

const AccessRoleScreenMatrix = ({ accessRole, goBack }) => {
  const dispatch = useAppDispatch();
  const [searchTerm, setSearchTerm] = useState<string>();
  const [matrixData, setMatrixData] = useState([]);
  const [recordOfSearch, setRecordOfSearch] = useState({ screenName: '' });
  const [load, setLoad] = useState<boolean>(false);

  // Fetch screenAccessMatrix List response
  const { data: screenAccessMatrixResponse } = useGetScreenAccessMatrixQuery(accessRole);

  // Save matrix of Access Roles
  const [saveMatrix] = useSaveScreenAccessMatrixMutation();

  // Effects
  useEffect(() => {
    if (screenAccessMatrixResponse) {
      const filteredData =
        searchTerm && searchTerm.trim() !== ''
          ? screenAccessMatrixResponse.object.filter(
              item =>
                item.screenName && item.screenName.toLowerCase().includes(searchTerm.toLowerCase())
            )
          : screenAccessMatrixResponse.object;

      setMatrixData(filteredData);
    }
  }, [screenAccessMatrixResponse, searchTerm]);
  useEffect(() => {
    handleFilterChange('objectName', recordOfSearch['screenName']);
  }, [recordOfSearch]);

  // Handle change Read Permission
  const handleReadChange = (checked, index) => {
    let matrixClone = [...matrixData];
    if (checked) {
      matrixClone[index] = { ...matrixClone[index], canRead: true };
    } else {
      matrixClone[index] = {
        ...matrixClone[index],
        canRead: false,
        canWrite: false,
        canDelete: false
      };
    }
    setMatrixData(matrixClone);
  };
  // Handle change Write Permission
  const handleWriteChange = (checked, index) => {
    let matrixClone = [...matrixData];
    if (checked) {
      matrixClone[index] = { ...matrixClone[index], canWrite: true };
    } else {
      matrixClone[index] = {
        ...matrixClone[index],
        canWrite: false,
        canDelete: false
      };
    }
    setMatrixData(matrixClone);
  };
  // Handle change Delete Permission
  const handleDeleteChange = (checked, index) => {
    let matrixClone = [...matrixData];
    matrixClone[index] = { ...matrixClone[index], canDelete: checked };
    setMatrixData(matrixClone);
  };
  // Handle change all permission
  const grantAll = index => {
    let matrixClone = [...matrixData];
    matrixClone[index] = {
      ...matrixClone[index],
      canRead: true,
      canWrite: true,
      canDelete: true
    };
    setMatrixData(matrixClone);
  };
  // Handle save changes
  const handleSave = async () => {
    if (matrixData) {
      setLoad(true);
      await saveMatrix(matrixData).unwrap();
      dispatch(notify({ msg: 'Saved Successfully', sev: 'success' }));
      setLoad(false);
    }
  };
  // Handle filter by screen name
  const handleFilterChange = (fieldName, e) => {
    setSearchTerm(e);
  };
  //table columns
  const tableColumns = [
    {
      key: 'screenName',
      title: <Translate>Screen</Translate>,
      flexGrow: 5,
      dataKey: 'screenName'
    },
    {
      key: 'canRead',
      title: <Translate>Can Read</Translate>,
      flexGrow: 2,
      render: (rowData, i) => (
        <Toggle onChange={checked => handleReadChange(checked, i)} checked={rowData.canRead} />
      )
    },
    {
      key: 'canWrite',
      title: <Translate>Can Write</Translate>,
      flexGrow: 2,
      render: (rowData, i) => (
        <Toggle onChange={checked => handleWriteChange(checked, i)} checked={rowData.canWrite} />
      )
    },
    {
      key: 'canDelete',
      title: <Translate>Can Delete</Translate>,
      flexGrow: 2,
      render: (rowData, i) => (
        <Toggle onChange={checked => handleDeleteChange(checked, i)} checked={rowData.canDelete} />
      )
    },
    {
      key: 'grantAll',
      title: <Translate>Grant All</Translate>,
      flexGrow: 2,
      render: (rowData, i) => (
        <IconButton
          onClick={() => {
            grantAll(i);
          }}
          icon={<FaLockOpen size="0.8em" />}
        />
      )
    }
  ];
  return (
    <Panel
      header={
        <p className="title-matrix">
          <Translate> Screen Access Matrix for </Translate> <i>{accessRole?.name ?? ''}</i>
        </p>
      }
    >
      <div className="container-of-header-actions-matrix">
        <div className="container-of-back-and-search-matrix">
          <div>
            <BackButton onClick={goBack} text="Back" appearance="ghost" />
          </div>
          <Form layout="inline">
            <MyInput
              fieldName="screenName"
              fieldType="text"
              record={recordOfSearch}
              setRecord={setRecordOfSearch}
              showLabel={false}
              placeholder="Search by Screen Name"
              width={'220px'}
            />
          </Form>
        </div>
        <div>
          <MyButton
            prefixIcon={() => <FontAwesomeIcon icon={faCheck} />}
            color="var(--deep-blue)"
            onClick={handleSave}
            width="120px"
            height="40px"
          >
            Save Changes
          </MyButton>
        </div>
      </div>
      <MyTable height={450} data={matrixData} columns={tableColumns} loading={load} />
    </Panel>
  );
};

export default AccessRoleScreenMatrix;
