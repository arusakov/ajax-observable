import { Observable } from 'rxjs/Observable'
import { AjaxError, AjaxResponse } from 'rxjs/observable/dom/AjaxObservable';
import 'rxjs/add/observable/dom/ajax'
import 'rxjs/add/operator/map'

export type Options = {
  handle401: (e: AjaxError) => Observable<any>
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
  private sid = ''

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  setSid(sid: string) {
    this.sid = sid
  }

  post(path: string, data: object): Observable<any> {
    return Observable
      .ajax(this.createRequestOptions(POST, path, data))
      .map(extractResponse)
  }

  get(path: string, data?: GetParams): Observable<any> {
    if (data) {
      const queryString = encodeParams(data)
      if (queryString) {
        path += '?' + queryString
      }
    }
    return Observable
      .ajax(this.createRequestOptions(GET, path))
      .map(extractResponse)
  }

  private createRequestOptions(method: Method, path: string, body?: object) {
    const headers: any = {}
    if (body && !(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json'
    }
    if (this.sid) {
      headers.Authorization = `Bearer ${this.sid}`
    }
    return {
      url: this.baseUrl + path,
      method,
      body,
      headers,
    }
  }
}