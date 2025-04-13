import React from 'react';
import { Navbar, Nav } from 'rsuite';
import ArrowRightLineIcon from '@rsuite/icons/ArrowRightLine';
import './styles.less';
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
          className='nav-item'
          icon={expand ? <ArrowRightLineIcon /> : <></> }
        />
      </Nav>
    </Navbar>
  );
};

export default ArrowLineToggle;