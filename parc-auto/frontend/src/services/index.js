import api from './api'

export const vehiculesService = {
  getAll: (params) => api.get('/vehicules/', { params }),
  getById: (id) => api.get(`/vehicules/${id}`),
  create: (data) => api.post('/vehicules/', data),
  update: (id, data) => api.put(`/vehicules/${id}`, data),
  delete: (id) => api.delete(`/vehicules/${id}`),
  getStats: (id) => api.get(`/vehicules/${id}/stats`)
}

export const conducteursService = {
  getAll: (params) => api.get('/conducteurs/', { params }),
  getById: (id) => api.get(`/conducteurs/${id}`),
  create: (data) => api.post('/conducteurs/', data),
  update: (id, data) => api.put(`/conducteurs/${id}`, data),
  delete: (id) => api.delete(`/conducteurs/${id}`),
  getAffectations: (id) => api.get(`/conducteurs/${id}/affectations`)
}

export const pleinsService = {
  getAll: (params) => api.get('/pleins/', { params }),
  getById: (id) => api.get(`/pleins/${id}`),
  create: (data) => api.post('/pleins/', data),
  update: (id, data) => api.put(`/pleins/${id}`, data),
  delete: (id) => api.delete(`/pleins/${id}`)
}

export const rapportsService = {
  global: (params) => api.get('/rapports/global', { params }),
  parVehicule: (params) => api.get('/rapports/par-vehicule', { params }),
  mensuel: (params) => api.get('/rapports/mensuel', { params }),
  evolutionConso: (vehiculeId) => api.get(`/rapports/evolution-consommation/${vehiculeId}`)
}

export const alertesService = {
  getAll: (params) => api.get('/alertes/', { params }),
  marquerLue: (id) => api.patch(`/alertes/${id}/lire`),
  toutLire: () => api.patch('/alertes/tout-lire'),
  count: () => api.get('/alertes/count')
}

export const utilisateursService = {
  getAll: () => api.get('/utilisateurs/'),
  getById: (id) => api.get(`/utilisateurs/${id}`),
  create: (data) => api.post('/utilisateurs/', data),
  update: (id, data) => api.put(`/utilisateurs/${id}`, data),
  delete: (id) => api.delete(`/utilisateurs/${id}`)
}
