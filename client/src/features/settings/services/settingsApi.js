import api from '../../../shared/api/axios';

export const fetchSettings = async () => {
  const { data } = await api.get('/api/settings');
  return data;
};

export const saveShopInfo = async (shopId, payload) => {
  const { data } = await api.put(`/api/shops/${shopId}`, payload);
  return data;
};

export const saveSettingsBulk = async (payload) => {
  const { data } = await api.post('/api/settings/bulk', payload);
  return data;
};


