import React, { useState } from 'react';
import MainScreenBar from '../MainScreenBarIcons/MainScreenBar';
import MainScreenBarFilters from '../MainScreenBarIcons/MainScreenBarFilters';
import { Stack } from 'rsuite';
import ChangePassword from './ChangePassword';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { closeChangePassword, closeEditProfile } from '@/utils/uiReducerActions';
import EditProfile from './EditProfile';
import RegistrationWizard from '@/pages/patient/facility-patient-list/RegistrationWizard';
import { MODULES } from '@/config/modules-config';
import { useAppSelector } from '@/hooks';

type HeaderProps = {
  expand: boolean;
  setExpand: React.Dispatch<React.SetStateAction<boolean>>;
  setExpandNotes: React.Dispatch<React.SetStateAction<boolean>>;
  expandNotes: boolean;
  drawerOffset: number;
  direction: string | null;
};


const Header: React.FC<HeaderProps> = ({
  expand,
  setExpand,
  setExpandNotes,
  expandNotes,
  drawerOffset,
  direction
}) => {
  type BackendMenuItem = { module?: string | null; label?: string | null; screen?: string | null };
  const authSlice = useAppSelector(state => state.auth);
  const uiMode = useAppSelector(state => state.ui.mode);
  // Read layout direction ("LTR" / "RTL") from localStorage as before
  const buildPermissionLookup = (menuItems: BackendMenuItem[]) => {
    const globalAllowed = new Set<string>();
    const moduleAllowed = new Map<string, Set<string>>();

    for (const m of menuItems ?? []) {
      const nLabel = m.label;
      const nScreen = (m.screen ?? '');
      const nModule = m.module;

      if (nLabel) globalAllowed.add(nLabel);
      if (nScreen) globalAllowed.add(nScreen);

      if (nModule) {
        if (!moduleAllowed.has(nModule)) moduleAllowed.set(nModule, new Set());
        if (nLabel) moduleAllowed.get(nModule)!.add(nLabel);
        if (nScreen) moduleAllowed.get(nModule)!.add(nScreen);
      }
    }
    return { globalAllowed, moduleAllowed };
  };

  const lookups = buildPermissionLookup(authSlice?.menu as BackendMenuItem[]);

  const isScreenAllowed = (
    screen: { name: string; code: string; navPath: string },
    moduleName: string,
    lookups: { globalAllowed: Set<string>; moduleAllowed: Map<string, Set<string>> }
  ) => {
    const { globalAllowed, moduleAllowed } = lookups;
    const nScreenName = screen.name;
    const nScreenCode = screen.code;
    const nNavPath = screen.navPath;
    const nModule = moduleName;
    const modSet = moduleAllowed.get(nModule);

    if (modSet && (modSet.has(nScreenName) || modSet.has(nScreenCode) || modSet.has(nNavPath)))
      return true;
    if (
      globalAllowed.has(nScreenName) ||
      globalAllowed.has(nScreenCode) ||
      globalAllowed.has(nNavPath)
    )
      return true;
    return false;
  };

  const childrenNavs: any[] = [];
  MODULES.forEach((module, mIdx) => {
    if (!module.screens?.length) return;
    const sortedScreens = [...module.screens].sort(
      (a, b) => (a.viewOrder ?? 0) - (b.viewOrder ?? 0)
    );

    sortedScreens.forEach((screen, sIdx) => {
      if (isScreenAllowed(screen, module.name, lookups)) {
        // const safeIconKey = (screen?.icon as keyof typeof icons) ?? 'FaCircle';
        // const IconComp = icons[safeIconKey] ?? icons.FaCircle;

        childrenNavs.push({
          eventKey: `nav:${module.name}:${screen.navPath}:${sIdx}`,
          // icon: <Icon as={IconComp} />,
          title: screen.name,
          to: `/${screen.navPath}`
        });
      }
    });

    // if (childrenNavs.length > 0) {
    //   const safeModuleIconKey = (module?.icon as keyof typeof icons) ?? 'FaBox';
    //   const ModuleIconComp = icons[safeModuleIconKey] ?? icons.FaBox;

    //   navsTemp.push({
    //     eventKey: `nav:${module.name}:${mIdx}`,
    //     icon: <Icon as={ModuleIconComp} />,
    //     title: module.name,
    //     children: childrenNavs
    //   });
    // }

  });

  const dispatch = useDispatch();
  const [displaySearch, setDisplaySearch] = useState<boolean>(true);

  const showChangePassword = useSelector(
    (state: RootState) => state.ui.showChangePassword,
  );
  const showEditProfile = useSelector(
    (state: RootState) => state.ui.showEditProfile,
  );
  const pageCode = useSelector((state: RootState) => state.div?.pageCode);

  const handleCloseChangePassword = () => {
    dispatch(closeChangePassword());
  };

  const handleCloseEditProfile = () => {
    dispatch(closeEditProfile());
  };



  return (
    <>
      <Stack
        className={`header ${expand ? 'expand' : ''} ${uiMode === 'dark' ? 'dark' : 'light'}`}
        spacing={8}
        style={{
          flexDirection: direction === 'LTR' ? 'row' : 'row-reverse',
          left: direction === 'LTR' ? drawerOffset : 0,
          right: direction === 'RTL' ? drawerOffset : 0,
          width: `calc(100% - ${drawerOffset}px)`,
          transition: 'left 0.3s ease, right 0.3s ease, width 0.3s ease'
        }}
      >

        <MainScreenBarFilters
          displaySearch={displaySearch}
          setDisplaySearch={setDisplaySearch}
          childrenNavs={childrenNavs}
        />
        <div className="headerItem">
          {pageCode === 'P_Facility' && <RegistrationWizard />}
          <div className="main-screen-bar-icons-main-container-header">
            <MainScreenBar
              setExpandNotes={setExpandNotes}
              displaySearch={displaySearch}
              setDisplaySearch={setDisplaySearch}
              expandNotes={expandNotes}
            />
          </div>
        </div>
      </Stack>

      <ChangePassword open={showChangePassword} onClose={handleCloseChangePassword} />
      <EditProfile open={showEditProfile} onClose={handleCloseEditProfile} />
    </>
  );
};

export default Header;
