import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState } from 'react';
import { Panel } from 'rsuite';
import { useGetAccessRolesQuery } from '@/services/setupService';
import { ButtonToolbar, IconButton } from 'rsuite';
import { FaArrowLeft } from 'react-icons/fa6';
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
        <IconButton appearance="ghost" color="cyan" icon={<FaArrowLeft />} onClick={goBack}>
          Go Back
        </IconButton>
      </ButtonToolbar>
      <hr />
      <h3>nothing here yet...</h3>
    </Panel>
  );
};

export default Authorizations;
