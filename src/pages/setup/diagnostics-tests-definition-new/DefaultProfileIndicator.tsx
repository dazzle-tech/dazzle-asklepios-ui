import {
  useGetDiagnosticTestProfilesByTestIdQuery
} from '@/services/setup/diagnosticTest/diagnosticTestProfileService';
import React from 'react';
import { FaChartLine } from 'react-icons/fa';
import { Tooltip, Whisper } from 'rsuite';


type Props = {
  testId?: number;
  testType?: string;
  onClick?: () => void;
};

const DefaultProfileIndicator: React.FC<Props> = ({
  testId,
  testType,
  onClick
}) => {

  const { data } = useGetDiagnosticTestProfilesByTestIdQuery(
    testId && testType === 'LABORATORY'
      ? { testId, page: 0, size: 2 }
      : undefined,
    { skip: !testId || testType !== 'LABORATORY' }
  );

  const profiles = data?.data ?? [];
  const activeProfiles = profiles.filter(p => p.isActive === true);
  const defaultActiveProfiles = activeProfiles.filter(
    p => p.isDefault === true
  );
  const isDefaultOnly =
    defaultActiveProfiles.length === 1 &&
    activeProfiles.length === 1;
  if (!isDefaultOnly) return null;

  return (
    <Whisper placement="top" speaker={<Tooltip>Default Normal Range</Tooltip>}>
      <span
        onClick={e => {
          e.stopPropagation();
          onClick?.();
        }}
        style={{ cursor: 'pointer' }}
      >
        <FaChartLine
          size={18}
          color="var(--primary-gray)"
          style={{ marginLeft: 6 }}
        />
      </span>
    </Whisper>
  );
};

export default DefaultProfileIndicator;
