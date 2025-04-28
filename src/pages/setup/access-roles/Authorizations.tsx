import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState } from 'react';
import { Input, Pagination, Panel, Table } from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import { useGetAccessRolesQuery } from '@/services/setupService';
import { ButtonToolbar, IconButton } from 'rsuite';
import ArowBackIcon from '@rsuite/icons/ArrowBack';
const Authorizations = ({ accessRole, goBack, ...props }) => {
  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });

  const { data: accessRoleListResponse } = useGetAccessRolesQuery(listRequest);

  return (
    <Panel
      header={
        <h3 className="title">
          <Translate> Authorizations for </Translate> <i>{accessRole?.name ?? ''}</i> 
        </h3>
      }
    >
      <ButtonToolbar>
        <IconButton appearance="ghost" color="cyan" icon={<ArowBackIcon />} onClick={goBack}>
          Go Back
        </IconButton>
      </ButtonToolbar>
      <hr />
      <h3>nothing here yet...</h3>
    </Panel>
  );
};

export default Authorizations;
