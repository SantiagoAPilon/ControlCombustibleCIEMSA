import { findAllUsers, createUser, updateUser, removeUser } from '../modelos/user.model.js'

export const doGetUsers   = ()               => findAllUsers()
export const doCreateUser = (data)           => createUser(data)
export const doUpdateUser = (id, data)       => updateUser(id, data)
export const doRemoveUser = (id)             => removeUser(id)
