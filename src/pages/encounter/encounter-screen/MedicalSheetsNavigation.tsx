import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import { faClockRotateLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { FaSearch } from 'react-icons/fa';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Form, List } from 'rsuite';

type Props = {
  searchTerm: any;
  setSearchTerm: any;
  visibleSheets: any[];
  sharedNavigationState: any;
  onSheetNavigate?: (relativePath: string) => void;
  onAfterNavigate?: () => void;
};

const MedicalSheetsNavigation = ({
  searchTerm,
  setSearchTerm,
  visibleSheets,
  sharedNavigationState,
  onSheetNavigate,
  onAfterNavigate
}: Props) => {
  const navigate = useNavigate();
  const location = useLocation();

  const goDashboard = () => {
    if (onSheetNavigate) {
      onSheetNavigate('');
    } else {
      const basePath = location.pathname.split('/').slice(0, -1).join('/');
      navigate(basePath, { state: sharedNavigationState });
    }

    onAfterNavigate?.();
  };

  return (
    <>
      <Form fluid>
        <MyInput
          width="100%"
          placeholder="Search screens..."
          fieldName="term"
          record={searchTerm}
          setRecord={setSearchTerm}
          showLabel={false}
          rightAddon={<FaSearch style={{ color: 'var(--primary-gray)' }} />}
        />
      </Form>

      <List hover className="drawer-list-style">
        <List.Item className="drawer-item return-button" onClick={goDashboard}>
          <FontAwesomeIcon icon={faClockRotateLeft} className="icon" />
          <Translate>Dashboard</Translate>
        </List.Item>

        {visibleSheets.map(({ code, name, icon, path }) => {
          const fullPath = `/encounter${path.startsWith('/') ? path : `/${path}`}`;

          const handleClick = () => {
            onAfterNavigate?.();

            if (onSheetNavigate) {
              const relativePath = path.startsWith('/') ? path.slice(1) : path;
              onSheetNavigate(relativePath);
            } else {
              navigate(fullPath, { state: sharedNavigationState });
            }
          };

          return (
            <List.Item key={code} className="drawer-item" onClick={handleClick}>
              {onSheetNavigate ? (
                <span className="inherit-link">
                  {icon}
                  <span className="margin-left-10">
                    <Translate>{name}</Translate>
                  </span>
                </span>
              ) : (
                <Link to={fullPath} state={sharedNavigationState} className="inherit-link">
                  {icon}
                  <span className="margin-left-10">
                    <Translate>{name}</Translate>
                  </span>
                </Link>
              )}
            </List.Item>
          );
        })}
      </List>
    </>
  );
};

export default MedicalSheetsNavigation;