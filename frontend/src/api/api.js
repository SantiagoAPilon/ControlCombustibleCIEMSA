const BASE = '/api';

async function req(path, options = {}) {
  const res = await fetch(BASE + path, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const getVehicles    = ()       => req('/vehicles');
export const deleteFuelRecord = (id)   => req(`/fuel/${id}`, { method: 'DELETE' });

export const getFuelRecords = (filters = {}) => {
  const p = new URLSearchParams();
  if (filters.matricula && filters.matricula !== 'all') p.set('matricula', filters.matricula);
  if (filters.mes)  p.set('mes',  filters.mes);
  if (filters.anio) p.set('anio', filters.anio);
  return req(`/fuel?${p}`);
};

export const addFuelRecord = (data) =>
  req('/fuel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
