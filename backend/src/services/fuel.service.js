import { findAll, findLastByMatricula, create, remove } from '../modelos/fuel.model.js'

export const doObtenerCargas = (filters) => findAll(filters)

export const doRegistrarCarga = async (data) => {
  const { matricula, litros, km_actual } = data

  const last          = await findLastByMatricula(matricula)
  const km_anterior   = last ? last.km_actual : null
  const km_recorridos = km_anterior !== null ? km_actual - km_anterior : null
  const consumo_km_l  = km_recorridos && km_recorridos > 0 && litros > 0
    ? parseFloat((km_recorridos / litros).toFixed(2))
    : null

  return create({ ...data, km_anterior, km_recorridos, consumo_km_l })
}

export const doEliminarCarga = (id) => remove(id)
