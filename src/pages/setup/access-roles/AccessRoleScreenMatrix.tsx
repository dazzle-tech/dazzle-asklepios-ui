import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useEffect, useState } from 'react';
import { Input, Pagination, Panel, Table, Toggle } from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import {
  useGetScreenAccessMatrixQuery,
  useSaveScreenAccessMatrixMutation
} from '@/services/setupService';
import { ButtonToolbar, IconButton } from 'rsuite';
import ArowBackIcon from '@rsuite/icons/ArowBack';
import CheckIcon from '@rsuite/icons/Check';
import { ApAccessRoleScreen } from '@/types/model-types';
import { FaLockOpen } from 'react-icons/fa6';
const AccessRoleScreenMatrix = ({ accessRole, goBack, ...props }) => {
  const { data: screenAccessMatrixResponse } = useGetScreenAccessMatrixQuery(accessRole);
  const [saveMatrix, saveMatrixMutationResponse] = useSaveScreenAccessMatrixMutation();

  const [matrixData, setMatrixData] = useState([]);

  useEffect(() => {
    // adding the query result to a local state in order to make local changes
    if (screenAccessMatrixResponse) setMatrixData(screenAccessMatrixResponse.object);
  }, [screenAccessMatrixResponse]);

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

  const handleSave = () => {
    if (matrixData) {
      saveMatrix(matrixData).unwrap();
    }
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

  return (
    <Panel
      header={
        <h3 className="title">
          <Translate> Screen Access Matrix for </Translate> <i>{accessRole?.name ?? ''}</i>
        </h3>
      }
    >
      <ButtonToolbar>
        <IconButton appearance="ghost" color="cyan" icon={<ArowBackIcon />} onClick={goBack}>
          Go Back
        </IconButton>
        <IconButton appearance="primary" color="green" icon={<CheckIcon />} onClick={handleSave}>
          Save Changes
        </IconButton>
      </ButtonToolbar>
      <hr />
      <Table height={600} headerHeight={80} rowHeight={60} bordered cellBordered data={matrixData}>
        <Column sortable flexGrow={5}>
          <HeaderCell>
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
          <Cell>{(rowData, i) => <IconButton onClick={() => {grantAll(i)}} icon={<FaLockOpen />} />}</Cell>
        </Column>
      </Table>
    </Panel>
  );
};

export default AccessRoleScreenMatrix;
