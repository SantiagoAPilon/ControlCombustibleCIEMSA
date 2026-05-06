const BASE = (import.meta.env.VITE_API_URL ?? '') + '/v1'

const authHeaders = () => {
  const token = localStorage.getItem('token')
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}

async function req(path, options = {}) {
  const res = await fetch(BASE + path, {
    ...options,
    headers: {
      ...authHeaders(),
      ...(options.headers || {}),
    },
  })

  if (res.status === 401) {
    localStorage.removeItem('token')
    window.location.reload()
    return
  }
  if (res.status === 204) return null
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message || body.error || `HTTP ${res.status}`)
  }
  return res.json()
}

const jsonReq = (path, method, data) =>
  req(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

// Auth
export const login = ({ usuario, password }) =>
  fetch(`${BASE}/auth/login`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ usuario, password }),
  }).then(async res => {
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.message || 'Credenciales incorrectas')
    }
    return res.json()
  })

// Vehicles
export const getVehicles    = ()                   => req('/vehicles')
export const addVehicle     = (data)               => jsonReq('/vehicles', 'POST', data)
export const updateVehicle  = (matricula, data)    => jsonReq(`/vehicles/${matricula}`, 'PUT', data)
export const deleteVehicle  = (matricula)          => req(`/vehicles/${matricula}`, { method: 'DELETE' })

// Fuel records
export const getFuelRecords = (filters = {}) => {
  const p = new URLSearchParams()
  if (filters.matricula && filters.matricula !== 'all') p.set('matricula', filters.matricula)
  if (filters.mes)  p.set('mes',  filters.mes)
  if (filters.anio) p.set('anio', filters.anio)
  return req(`/fuel?${p}`)
}
export const addFuelRecord    = (data) => jsonReq('/fuel', 'POST', data)
export const updateFuelRecord = (id, data) => jsonReq(`/fuel/${id}`, 'PUT', data)
export const deleteFuelRecord = (id)   => req(`/fuel/${id}`, { method: 'DELETE' })

// Reports
export const getHeatmap = ({ meses, hasta } = {}) => {
  const p = new URLSearchParams()
  if (meses) p.set('meses', meses)
  if (hasta) p.set('hasta', hasta)
  return req(`/reports/heatmap?${p}`)
}

// Ticket scanning
export const scanTicket = (imageFile) => {
  const fd = new FormData()
  fd.append('image', imageFile)
  return req('/fuel/scan-ticket', { method: 'POST', body: fd })
}

export const attachTicketFoto = (id, imageFile) => {
  const fd = new FormData()
  fd.append('image', imageFile)
  return req(`/fuel/${id}/foto-ticket`, { method: 'POST', body: fd })
}

export const fetchTicketFoto = async (id) => {
  const res = await fetch(BASE + `/fuel/${id}/foto-ticket`, {
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error('No se pudo cargar la imagen')
  const blob = await res.blob()
  return URL.createObjectURL(blob)
}
