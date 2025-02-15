import React from 'react';
import { Navbar, Nav } from 'rsuite';
import ArrowLeftLineIcon from '@rsuite/icons/ArrowLeftLine';
import SearchPeopleIcon from '@rsuite/icons/SearchPeople';
interface NavToggleProps {
  expand?: boolean;
  onChange?: () => void;
}

const ArrowLineToggle = ({ expand, onChange }: NavToggleProps) => {
  return (
    <Navbar appearance="subtle" className="nav-toggle">
      <Nav pullRight>
        <Nav.Item
          onClick={onChange}
          style={{ textAlign: 'center' }} 
          icon={expand ? <ArrowLeftLineIcon />:  <SearchPeopleIcon/>  }
        />
      </Nav>
    </Navbar>
  );
};

export default ArrowLineToggle;