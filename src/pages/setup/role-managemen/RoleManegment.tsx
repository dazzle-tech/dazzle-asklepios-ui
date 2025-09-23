import React, { useState } from "react";
import { Grid, Row, Col, Panel, Button, List, Divider, Input } from "rsuite";
import "./styles.less";
import Roles from "./Role";
import RoleScreens from "./RoleScreens";
import SectionContainer from "@/components/SectionsoContainer";
type Role = { id: number; name: string; description: string };

const RoleManegment: React.FC = () => {

  const [selected, setSelected] = useState<Role | null>( null);
// const deleteSelected = () => {
//     if (!selected) return;
//     setRoles((prev) => {
//       const remaining = prev.filter((r) => r.id !== selected.id);
//       setSelected(remaining[0] ?? null);
//       return remaining;
//     });
//   };


 

  return (
    <Grid fluid className="role-management">
      <Row className="role-row">
        <Col xs={24} md={8} className="left-col">
         <Roles selected={selected} setSelected={setSelected} />
        </Col>

        <Col xs={24} md={16} >
        <SectionContainer
          title={"Screens & Permissions"}
          content={  selected ? (
             
               <RoleScreens roleId={3}/>
              
            ) : (
              <div className="empty">No role selected. Use the left list to add or choose a role.</div>
            )}/>
        
        </Col>
      </Row>
    </Grid>
  );
};

export default RoleManegment;