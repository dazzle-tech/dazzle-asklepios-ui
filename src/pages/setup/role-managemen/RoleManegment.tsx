import React, { useState } from "react";
import { Grid, Row, Col } from "rsuite";
import "./styles.less";
import Roles from "./Roles";
import RoleScreens from "./RoleScreens";
import SectionContainer from "@/components/SectionsoContainer";
import MyModal from "@/components/MyModal/MyModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserShield } from "@fortawesome/free-solid-svg-icons";

type Role = { id: number; name: string; description: string };

type RoleManegmentProps = {
  open: boolean;
  setOpen: (v: boolean) => void;
  facility?: unknown;
  setFacility?: (v: unknown) => void;
  onSave?: (role: Role | null) => void; // optional external save handler
};

const RoleManegment: React.FC<RoleManegmentProps> = ({
  open,
  setOpen,
  facility,
  setFacility,
  onSave,
}) => {
  const [selected, setSelected] = useState<Role | null>(null);

  const handleSave = () => {
    // hook for your save logic (permissions, screens, etc.)
    onSave?.(selected);
    // close after save (optional)
    setOpen(false);
  };
  
  const content = (
    <Grid fluid className="role-management">
      <Row className="role-row">
        <Col xs={24} md={8} className="left-col">
          <Roles
            selected={selected}
            setSelected={setSelected}
            facilityId={facility.id}
          />
        </Col>

        <Col xs={24} md={16}>
          <SectionContainer
            title={"Screens & Permissions"}
            content={
              selected ? (
                <RoleScreens roleId={selected.id} />
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
  );

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Role Management"
      size="full"
     
      content={content}
      hideBack={true}
     
      actionButtonLabel="Save"
      actionButtonFunction={handleSave}
      isDisabledActionBtn={!selected} // disable until a role is selected
    />
  );
};

export default RoleManegment;
