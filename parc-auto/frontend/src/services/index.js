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
  getAffectations: (id) => api.get(`/conducteurs/${id}/affectations`),
  createAffectation: (id, data) => api.post(`/conducteurs/${id}/affectations`, data),
  terminerAffectation: (id, affId) => api.put(`/conducteurs/${id}/affectations/${affId}/terminer`),
  deleteAffectation: (id, affId) => api.delete(`/conducteurs/${id}/affectations/${affId}`)
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

export const parametresService = {
  getAll: () => api.get('/parametres/'),
  update: (data) => api.put('/parametres/', data)
}

export const entretiensService = {
  getAll: (params) => api.get('/entretiens/', { params }),
  getById: (id) => api.get(`/entretiens/${id}`),
  create: (data) => api.post('/entretiens/', data),
  update: (id, data) => api.put(`/entretiens/${id}`, data),
  delete: (id) => api.delete(`/entretiens/${id}`)
}

export const echeancesService = {
  getByVehicule: (vehiculeId) => api.get(`/echeances/vehicule/${vehiculeId}`),
  create: (vehiculeId, data) => api.post(`/echeances/vehicule/${vehiculeId}`, data),
  update: (id, data) => api.put(`/echeances/${id}`, data),
  delete: (id) => api.delete(`/echeances/${id}`),
  verifier: (force = false) => api.post('/echeances/verifier', { force }),
  testerEmail: () => api.post('/echeances/tester-email')
}

export const relevesService = {
  pourVehicule: (params) => api.get('/releves/pour-vehicule', { params }),
  pourDate: (params) => api.get('/releves/pour-date', { params }),
  getHistorique: (params) => api.get('/releves/historique', { params }),
  getAll: (params) => api.get('/releves/', { params }),
  create: (data) => api.post('/releves/', data),
  update: (id, data) => api.put(`/releves/${id}`, data),
  addTrajet: (id, data) => api.post(`/releves/${id}/trajets`, data),
  updateTrajet: (id, tid, data) => api.put(`/releves/${id}/trajets/${tid}`, data),
  deleteTrajet: (id, tid) => api.delete(`/releves/${id}/trajets/${tid}`)
}
