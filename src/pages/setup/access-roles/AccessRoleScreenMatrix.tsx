import Translate from '@/components/Translate';
import React, { useEffect, useState } from 'react';
import {Panel, Table, Toggle, Form } from 'rsuite';
import MyInput from '@/components/MyInput';
const { Column, HeaderCell, Cell } = Table;
import {
  useGetScreenAccessMatrixQuery,
  useSaveScreenAccessMatrixMutation
} from '@/services/setupService';
import {IconButton } from 'rsuite';
import ArowBackIcon from '@rsuite/icons/ArowBack';
import CheckIcon from '@rsuite/icons/Check';
import { FaLockOpen } from 'react-icons/fa6';
import MyButton from '@/components/MyButton/MyButton';
import './styles.less';
const AccessRoleScreenMatrix = ({ accessRole, goBack, ...props }) => {
  const { data: screenAccessMatrixResponse } = useGetScreenAccessMatrixQuery(accessRole);
  const [saveMatrix, saveMatrixMutationResponse] = useSaveScreenAccessMatrixMutation();
  const [searchTerm, setSearchTerm] = useState<string>();
  const [matrixData, setMatrixData] = useState([]);
  const [recordOfSearch, setRecordOfSearch] = useState({screenName: ""});
  

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

  const handleDeleteChange = (checked, index) => {
    let matrixClone = [...matrixData];
    matrixClone[index] = { ...matrixClone[index], canDelete: checked };
    setMatrixData(matrixClone);
  };
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

  const handleSave = () => {
    if (matrixData) {
      saveMatrix(matrixData).unwrap();
    }
  };

  
  const handleFilterChange = (fieldName, e) => {
    setSearchTerm(e);
  };

  return (
    <Panel
      header={
        <p>
          <Translate> Screen Access Matrix for </Translate> <i>{accessRole?.name ?? ''}</i>
        </p>
      }
    >

      <div className='container-of-header-actions'>
        <div className='container-of-back-and-search'>
          <MyButton
            prefixIcon={() => <ArowBackIcon />}
            color="var(--deep-blue)"
            ghost
            onClick={goBack}
            width="82px"
            height="40px"
          >
            Back
          </MyButton>
          <Form>
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
          <MyButton
            prefixIcon={() => <CheckIcon />}
            color="var(--deep-blue)"
            onClick={handleSave}
            width='111px'
            height='40px'
          >
            Save Changes
          </MyButton>
      </div>
      <Table height={600} data={matrixData}>
        <Column sortable flexGrow={5}>
          <HeaderCell>
            {/* <Input
              onChange={e => handleFilterChange('description', e)}
            /> */}
            <Translate>Screen</Translate>
          </HeaderCell>
          <Cell dataKey="screenName" />
        </Column>
        <Column align="center" flexGrow={2}>
          <HeaderCell>
            <Translate>Can Read</Translate>
          </HeaderCell>
          <Cell>
            {(rowData, i) => (
              <Toggle
                onChange={checked => handleReadChange(checked, i)}
                checked={rowData.canRead}
              />
            )}
          </Cell>
        </Column>
        <Column align="center" flexGrow={2}>
          <HeaderCell>
            <Translate>Can Write</Translate>
          </HeaderCell>
          <Cell>
            {(rowData, i) => (
              <Toggle
                onChange={checked => handleWriteChange(checked, i)}
                checked={rowData.canWrite}
              />
            )}
          </Cell>
        </Column>
        <Column align="center" flexGrow={2}>
          <HeaderCell>
            <Translate>Can Delete</Translate>
          </HeaderCell>
          <Cell>
            {(rowData, i) => (
              <Toggle
                onChange={checked => handleDeleteChange(checked, i)}
                checked={rowData.canDelete}
              />
            )}
          </Cell>
        </Column>
        <Column align="center" flexGrow={1}>
          <HeaderCell>
            <Translate>Grant All</Translate>
          </HeaderCell>
          <Cell>
            {(rowData, i) => (
              <IconButton
                onClick={() => {
                  grantAll(i);
                }}
                icon={<FaLockOpen size="0.8em" />}
              />
            )}
          </Cell>
        </Column>
      </Table>
    </Panel>
  );
};

export default AccessRoleScreenMatrix;
