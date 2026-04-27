import { useAppSelector } from '@/hooks';
import { useLazyGetDepartmentByIdQuery } from '@/services/security/departmentService';
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import * as errors from '@/images/errors';
import { MODULES } from '@/config/modules-config';
import './styles.less';
import { formatEnumString } from '@/utils';

const norm = (s?: string | null) => (s ?? '').toLowerCase().trim().replace(/^\/+/, '');

const ErrorDepartmentTypePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const authSlice = useAppSelector((s) => s.auth);

  const code = 403;
  const selectedDepartment = authSlice.selectedDepartment;
  const fromPath = location.state?.from || '/';

  const message =
    location.state?.message || 'Current Department type is not compatible with this module.';
  const allowedTypes = location.state?.allowedTypes || [];

  const [
    getDepartmentById,
    { data: department, isLoading, isFetching, isUninitialized },
  ] = useLazyGetDepartmentByIdQuery();

  useEffect(() => {
    if (selectedDepartment?.departmentId && isUninitialized) {
      getDepartmentById(selectedDepartment.departmentId);
    }
  }, [selectedDepartment?.departmentId, isUninitialized, getDepartmentById]);

  useEffect(() => {
    if (!fromPath) return;
    if (!department?.departmentType) return;

    const cleanPath = norm(fromPath.split('?')[0]);

    const matchedModule = MODULES.find((m: any) =>
      (m.screens ?? []).some((s: any) => norm(s.navPath) === cleanPath)
    );

    if (!matchedModule?.departmentTypes?.length) return;

    const currentDepartmentType = String(department.departmentType).toUpperCase();
    const moduleDepartmentTypes = matchedModule.departmentTypes.map((x: string) =>
      String(x).toUpperCase()
    );

    const isCompatible = moduleDepartmentTypes.includes(currentDepartmentType);

    if (isCompatible) {
      navigate(fromPath, { replace: true });
    }
  }, [department?.departmentType, fromPath, navigate]);

  const isChecking =
    !!selectedDepartment?.departmentId && (isUninitialized || isLoading || isFetching);

  if (isChecking) {
    return null;
  }

  return (
    <div className="error-page">
      <div className="error-page__container">
        <div className="error-page__image">
          <img src={errors[`Error${code}Img`]} alt="Department type error" />
        </div>

        <div className="error-page__code">403</div>

        <div className="error-page__title">Department Type Not Compatible</div>

        <div className="error-page__message">{message}</div>

        <div className="error-page__details">
          <div>
            <strong>Current Type:</strong> {formatEnumString(department?.departmentType) || 'N/A'}
          </div>
          <div>
            <strong>Allowed Types:</strong> {allowedTypes.length ? allowedTypes.map(formatEnumString).join(', ') : 'N/A'}
          </div>
        </div>

        <button className="error-page__button" onClick={() => navigate('/')}>
          Take me home
        </button>
      </div>
    </div>
  );
};

export default ErrorDepartmentTypePage;