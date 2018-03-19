import { Observable } from 'rxjs/Observable'
import { AjaxError, AjaxResponse, AjaxRequest } from 'rxjs/observable/dom/AjaxObservable'

import 'rxjs/add/observable/dom/ajax'
import 'rxjs/add/observable/throw'
import 'rxjs/add/operator/catch'
import 'rxjs/add/operator/map'

export type ErrHandlers = {
  [k: number]: (e: AjaxError) => Observable<any>
}

export type Options = {
  errHandlers?: ErrHandlers,
  timeout?: number,
}

export type GetParams = {
  [key: string]: number | string | Array<number | string>,
}

const extractResponse = (resp: AjaxResponse) => resp.response

const encode = (key: string, val: any) => encodeURIComponent(key) + '=' + encodeURIComponent(val)

const encodeParams = (params: GetParams) => Object.keys(params).reduce((arr: string[], key) => {
  const val = params[key]
  if (Array.isArray(val)) {
    arr.push(...(val.map((v) => encode(key, v))))
  } else {
    arr.push(encode(key, val))
  }
  return arr
}, []).join('&')

const GET = 'GET'
const POST = 'POST'

type Method = typeof GET | typeof POST

export class Ajax {
  private baseUrl: string
  private errHandlers: ErrHandlers
  private reqHeaders: { [h: string]: string } = {}
  private timeout?: number

  constructor(baseUrl: string, options?: Options) {
    this.baseUrl = baseUrl
    this.errHandlers = options && options.errHandlers || {}
    this.timeout = options && options.timeout
  }

  setReqHeaders(headers: { [h: string]: string }) {
    this.reqHeaders = headers
  }

  get(path: string, data?: GetParams) {
    if (data) {
      const queryString = encodeParams(data)
      if (queryString) {
        path += '?' + queryString
      }
    }
    return Observable
      .ajax(this.createRequestOptions(GET, path))
      .map(extractResponse)
      .catch(this.catch)
  }

  post(path: string, data: object) {
    return Observable
      .ajax(this.createRequestOptions(POST, path, data))
      .map(extractResponse)
      .catch(this.catch)
  }

  private catch = (err: AjaxError | Error) => {
    if (err instanceof AjaxError) {
      const handler = this.errHandlers[err.status]
      if (handler) {
        return handler(err)
      }
    }
    return Observable.throw(err)
  }

  private createRequestOptions(method: Method, path: string, body?: object): AjaxRequest {
    const headers: any = {}
    if (body && !(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json'
    }
    return {
      body,
      headers: { ...headers, ...this.reqHeaders },
      method,
      timeout: this.timeout,
      url: this.baseUrl + path,
    }
  }
}
