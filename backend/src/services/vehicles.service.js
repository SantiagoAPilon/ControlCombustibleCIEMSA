import { findAll, create, update, remove } from '../modelos/vehicle.model.js'

export const doObtenerVehiculos   = ()                => findAll()
export const doAgregarVehiculo    = (data)            => create(data)
export const doActualizarVehiculo = (matricula, data) => update(matricula, data)
export const doEliminarVehiculo   = (matricula)       => remove(matricula)
