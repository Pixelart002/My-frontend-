import { API } from './backend-api.js'
const unavailableApi = new Proxy({}, {
  get: () => async () => {
    throw new Error('The Luviio API is unavailable. Please refresh and try again.')
  },
})

export function getApi() {
  return API || unavailableApi
}

export async function requestApi(method, ...args) {
  const api = getApi()
  if (typeof api[method] !== 'function') {
    throw new Error(`Luviio API method ${method} is unavailable.`)
  }
  return api[method](...args)
}
