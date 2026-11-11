import React, { useEffect, useState } from 'react';
import { Message } from 'rsuite';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import { useAppDispatch } from '@/hooks';
import {
  useValidateDiscountCodeMutation,
  useVerifyDiscountCodeUserMutation
} from '@/services/setup/discountCode/discountCodeService';
import type { DiscountCode, DiscountType } from '@/types/model-types-new';
import { notify } from '@/utils/uiReducerActions';

export type AppliedDefaultServiceDiscount = {
  code: string;
  name: string;
  userId: number;
  userLabel: string;
  authorizationToken: string;
  discountType?: DiscountType;
  percentage?: number | null;
  fixedAmount?: number | null;
  currency?: string | null;
};

type VerifiedUser = {
  userId: number;
  login: string;
  firstName?: string | null;
  lastName?: string | null;
  authorizationToken: string;
};

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  facilityId?: number | null;
  facilityCurrency?: string | null;
  onApplied: (discount: AppliedDefaultServiceDiscount) => void;
};

const userLabel = (user: VerifiedUser) => {
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return name || user.login;
};

export const formatDiscountCodeValue = (discount: AppliedDefaultServiceDiscount) => {
  if (discount.discountType === 'FIXED_AMOUNT') {
    return `${discount.fixedAmount ?? 0} ${discount.currency ?? ''}`.trim();
  }
  return `${discount.percentage ?? 0}%`;
};

const GENERIC_API_TITLES = new Set([
  'Bad Request',
  'Unauthorized',
  'Forbidden',
  'Not Found',
  'Internal Server Error',
  'Method argument not valid'
]);

const backendText = (value: unknown) => {
  if (typeof value !== 'string') {
    return '';
  }
  const text = value.trim();
  if (!text || text === 'null' || GENERIC_API_TITLES.has(text) || text.includes('ProblemDetailWithCause')) {
    return '';
  }
  return text.startsWith('error.') ? '' : text;
};

const apiMessage = (error: unknown, fallback: string) => {
  const data = (error as { data?: Record<string, any> })?.data ?? {};
  const fieldErrors = data.fieldErrors ?? data.properties?.fieldErrors;
  if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
    const text = fieldErrors
      .map((field: { message?: string }) => backendText(field?.message))
      .filter(Boolean)
      .join('\n');
    if (text) {
      return text;
    }
  }

  return (
    backendText(data.detail) ||
    backendText(data.title) ||
    backendText(data.message) ||
    backendText(data.properties?.message) ||
    fallback
  );
};

const DefaultServiceDiscountCodeModal = ({
  open,
  setOpen,
  facilityId,
  facilityCurrency,
  onApplied
}: Props) => {
  const dispatch = useAppDispatch();
  const [credentials, setCredentials] = useState({ login: '', password: '' });
  const [codeForm, setCodeForm] = useState({ code: '' });
  const [verifiedUser, setVerifiedUser] = useState<VerifiedUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verifyUser, { isLoading: verifying }] = useVerifyDiscountCodeUserMutation();
  const [validateCode, { isLoading: validating }] = useValidateDiscountCodeMutation();

  useEffect(() => {
    if (open) {
      return;
    }
    setCredentials({ login: '', password: '' });
    setCodeForm({ code: '' });
    setVerifiedUser(null);
    setError(null);
  }, [open]);

  const verify = async () => {
    const login = credentials.login.trim();
    const password = credentials.password;
    if (!login || !password) {
      setError('Enter the username and password of the person applying the code.');
      return false;
    }
    try {
      const user = await verifyUser({ login, password }).unwrap();
      setVerifiedUser(user);
      setError(null);
      return true;
    } catch (caught) {
      const message = apiMessage(caught, 'Invalid username or password.');
      setError(message);
      setVerifiedUser(null);
      return false;
    }
  };

  const apply = async () => {
    const code = codeForm.code.trim();
    if (!facilityId) {
      setError('Facility is required before a discount code can be applied.');
      throw new Error('Facility is required');
    }
    if (!verifiedUser) {
      setError('Verify the user before entering the discount code.');
      throw new Error('User is not verified');
    }
    if (!code) {
      setError('Enter the discount code.');
      throw new Error('Discount code is required');
    }

    let discount: DiscountCode;
    try {
      discount = await validateCode({
        facilityId,
        code,
        userId: verifiedUser.userId,
        authorizationToken: verifiedUser.authorizationToken
      }).unwrap();
    } catch (caught) {
      const message = apiMessage(caught, 'This discount code cannot be used.');
      setError(message);
      throw new Error(message);
    }

    const visitCurrency = facilityCurrency ? String(facilityCurrency) : '';
    const codeCurrency = discount.currency ? String(discount.currency) : '';
    if (
      discount.discountType === 'FIXED_AMOUNT' &&
      codeCurrency &&
      visitCurrency &&
      codeCurrency !== visitCurrency
    ) {
      const message = `This discount code is in ${codeCurrency} and this visit is billed in ${visitCurrency}.`;
      setError(message);
      throw new Error(message);
    }

    onApplied({
      code: discount.code,
      name: discount.name,
      userId: verifiedUser.userId,
      userLabel: userLabel(verifiedUser),
      authorizationToken: verifiedUser.authorizationToken,
      discountType: discount.discountType,
      percentage: discount.percentage,
      fixedAmount: discount.fixedAmount,
      currency: discount.currency
    });
    dispatch(
      notify({
        msg: `Discount code ${discount.code} will be applied to the default services.`,
        sev: 'success'
      })
    );
    setOpen(false);
  };

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Default Service Discount Code"
      size="36vw"
      bodyheight="46vh"
      steps={[
        {
          title: 'Verify User',
          disabledNext: verifying || !credentials.login.trim() || !credentials.password
        },
        { title: 'Discount Code' }
      ]}
      actionButtonLabel="Apply Discount"
      actionButtonLoading={validating}
      isDisabledActionBtn={validating || !codeForm.code.trim()}
      onBeforeNext={async step => (step === 0 ? verify() : true)}
      actionButtonFunction={apply}
      content={(step: number) => (
        <div className="payment-info__discount-modal">
          {error ? (
            <Message type="error" showIcon className="payment-info__discount-error">
              {error}
            </Message>
          ) : null}
          {step === 0 ? (
            <>
              <p className="payment-info__discount-help">
                Confirm who is applying the discount code. This check does not change the signed-in user.
              </p>
              <MyInput
                column
                required
                width="100%"
                fieldLabel="Username"
                fieldName="login"
                fieldType="text"
                record={credentials}
                setRecord={setCredentials}
              />
              <MyInput
                column
                required
                width="100%"
                fieldLabel="Password"
                fieldName="password"
                fieldType="password"
                record={credentials}
                setRecord={setCredentials}
              />
            </>
          ) : (
            <>
              <p className="payment-info__discount-help">
                Verified user: <strong>{verifiedUser ? userLabel(verifiedUser) : ''}</strong>. Enter a code this
                user is allowed to use.
              </p>
              <MyInput
                column
                required
                width="100%"
                fieldLabel="Discount Code"
                fieldName="code"
                fieldType="text"
                record={codeForm}
                setRecord={setCodeForm}
              />
            </>
          )}
        </div>
      )}
    />
  );
};

export default DefaultServiceDiscountCodeModal;
