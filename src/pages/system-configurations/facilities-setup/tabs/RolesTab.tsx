import React, { useState } from 'react';
import { Grid, Row, Col } from 'rsuite';
import Roles from '@/pages/setup/role-managemen/Roles';
import RoleScreens from '@/pages/setup/role-managemen/RoleScreens';
import SectionContainer from '@/components/SectionsoContainer';
import { Facility } from '@/types/model-types-new';

interface RolesTabProps {
  facility: Facility;
}

type Role = { id: number; name: string; description: string };

const RolesTab: React.FC<RolesTabProps> = ({ facility }) => {
  const [selected, setSelected] = useState<Role | null>(null);

          // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <div dir={dir}>
      <Grid fluid className="role-management">
        <Row className="role-row">
          <Col xs={24} md={8} className="left-col">
            <Roles selected={selected} setSelected={setSelected} facilityId={facility?.id} />
          </Col>

          <Col xs={24} md={16}>
            <SectionContainer
              title={'Screens & Permissions'}
              content={
                selected ? (
                  <RoleScreens key={selected.id} roleId={selected.id} />
                ) : (
                  <div className="empty">
                    No role selected. Use the left list to add or choose a role.
                  </div>
                )
              }
            />
          </Col>
        </Row>
      </Grid>
    </div>
  );
};

export default RolesTab;

