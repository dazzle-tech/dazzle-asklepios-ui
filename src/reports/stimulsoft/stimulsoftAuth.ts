export const getStimulsoftAuthHeaders = (): { key: string; value: string }[] => {
  const raw =
    localStorage.getItem('id_token') || localStorage.getItem('token') || '';
  const jwt = raw.replace(/^Bearer\s+/i, '').trim();
  if (!jwt) return [];
  return [
    { key: 'Authorization', value: `Bearer ${jwt}` },
    { key: 'id_token', value: jwt },
  ];
};
