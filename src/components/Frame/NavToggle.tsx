import React from 'react';
import { Navbar, Nav } from 'rsuite';
import ArrowLeftLineIcon from '@rsuite/icons/ArrowLeftLine';
import ArrowRightLineIcon from '@rsuite/icons/ArrowRightLine';
import './styles.less';
interface NavToggleProps {
  expand?: boolean;
  onChange?: () => void;
  mode: string
}

const NavToggle = ({ expand, onChange, mode }: NavToggleProps) => {
  return (
    <Navbar appearance="subtle" className="nav-toggle">
      <Nav pullRight>
        <Nav.Item
          onClick={onChange}
          className={`nav-item ${mode == 'light' ? 'light' : 'dark'}`}
          // style={{backgroundColor: "red"}}
          icon={expand ? <ArrowLeftLineIcon /> : <ArrowRightLineIcon/>}
        />
      </Nav>
    </Navbar>
  );
};

export default NavToggle;
