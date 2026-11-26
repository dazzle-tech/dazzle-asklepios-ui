import React from 'react';
import MyModal from '@/components/MyModal/MyModal';
import { TpaDefinition } from '@/types/model-types-new';
import {
  DiscountPanel,
  ExclusionPanel,
  PreApprovalPanel
} from '@/pages/setup/coverage-management/CoverageRulePanels';
import '@/pages/setup/coverage-management/styles.less';

export type TpaRuleKind = 'approval' | 'exclusion' | 'discount';

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  tpa: TpaDefinition | null;
  kind: TpaRuleKind | null;
};

const titles: Record<TpaRuleKind, string> = {
  approval: 'Approval',
  exclusion: 'Excluded',
  discount: 'Discount'
};

const TpaRuleModal = ({ open, setOpen, tpa, kind }: Props) => {
  if (!tpa?.id || !kind) {
    return null;
  }

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={`${titles[kind]} - ${tpa.name || tpa.tpaCode}`}
      size="80vw"
      bodyheight="72vh"
      hideActionBtn
      enforceFocus={false}
      cancelButtonLabel="Close"
      modalColor="var(--primary-blue)"
      content={
        <div className="coverage-rules">
          {kind === 'discount' && (
            <DiscountPanel tpaId={Number(tpa.id)} readOnly={!tpa.isActive} />
          )}
          {kind === 'exclusion' && (
            <ExclusionPanel tpaId={Number(tpa.id)} readOnly={!tpa.isActive} />
          )}
          {kind === 'approval' && (
            <PreApprovalPanel tpaId={Number(tpa.id)} readOnly={!tpa.isActive} />
          )}
        </div>
      }
    />
  );
};

export default TpaRuleModal;
