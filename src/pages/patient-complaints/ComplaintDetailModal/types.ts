export type OwnerDraft = {
  assignedUserId: number | string | null;
  targetDeadline: string;
};

export type ActionDraft = {
  description: string;
  assignedUserId: number | string | null;
  deadline: string;
};

export type ResolutionDraft = {
  resolutionSummary: string;
  reopenReason: string;
};

export type CompleteDraft = {
  actionId: number;
  result: string;
};

export type StaffOption = {
  label: string;
  value: number;
};

export const emptyOwnerDraft = (): OwnerDraft => ({
  assignedUserId: null,
  targetDeadline: ''
});

export const emptyActionDraft = (): ActionDraft => ({
  description: '',
  assignedUserId: null,
  deadline: ''
});

export const emptyResolutionDraft = (): ResolutionDraft => ({
  resolutionSummary: '',
  reopenReason: ''
});
