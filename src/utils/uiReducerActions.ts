/**
 * to avoid circular dependencies, ui reducer actions should be defined here.
 */

import { createAction } from '@reduxjs/toolkit';

export const notify = createAction('ui/notify', payload => ({
  payload: {
    sev: payload.sev ? payload.sev : 'info',
    msg: payload.msg ? payload.msg : payload,
    life: payload.life ? payload.life : 2000
  }
}));
export const openChangePassword = createAction('ui/openChangePassword');
export const closeChangePassword = createAction('ui/closeChangePassword');
export const openEditProfile = createAction('ui/openEditProfile');
export const closeEditProfile = createAction('ui/closeEditProfile');
export const clearNotification = createAction('ui/clearNotification');
export const showLoading = createAction('ui/showLoading');
export const hideLoading = createAction('ui/hideLoading');
export const setScreenKey = createAction('ui/setScreenKey', payload => ({
  payload
}));
