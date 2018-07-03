import { Observable } from 'rxjs/Observable'
import { AjaxError, AjaxResponse, AjaxRequest } from 'rxjs/observable/dom/AjaxObservable'

import 'rxjs/add/observable/dom/ajax'
import 'rxjs/add/observable/throw'
import 'rxjs/add/observable/timer'
import 'rxjs/add/operator/catch'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/mergeMap'
import 'rxjs/add/operator/retryWhen'

export type Options = {
  timeout?: number,
}

export type GetSimpleValue = undefined | null | number | string

export type GetParams = {
  [key: string]: GetSimpleValue | GetSimpleValue[],
}

const extractResponse = (resp: AjaxResponse) => resp.response

const encode = (key: string, val: GetSimpleValue) =>
  val != null ? encodeURIComponent(key) + '=' + encodeURIComponent(val + '') : val

const encodeParams = (params: GetParams) => Object
  .keys(params)
  .reduce((arr: GetSimpleValue[], key) => {
    const val = params[key]
    if (Array.isArray(val)) {
      arr.push(...(val.map((v) => encode(key, v))))
    } else {
      arr.push(encode(key, val))
    }
    return arr
  }, [])
  .filter((v) => v)
  .join('&')

const retryWhen = (retry: number) => (err$: Observable<Error | AjaxError>) =>
  err$.mergeMap((e: AjaxError | Error, index) => {
    if (e instanceof AjaxError && (!e.status || e.status >= 500 || e.status === 429)) {
      if (retry >= 0 && index >= retry) { return Observable.throw(e) }
      let seconds: number
      // tslint:disable-next-line:prefer-conditional-expression
      if (e.status === 429) {
        // 30, 60, 90, 120, 150, 180, 180...
        seconds = Math.min(index + 1, 6) * 30
      } else {
        // 1, 2, 4, 8, 16, 32, 60, 60...
        seconds = index < 6 ? 2 ** index : 60
      }
      return Observable.timer(seconds * 1000)
    }
    return Observable.throw(e)
  })

const GET = 'GET'
const POST = 'POST'

type Method = typeof GET | typeof POST

/**
 * retry < 0 for infinity
 */
const defaultOptions = {
  retry: -1,
}

export class Ajax {
  private baseUrl: string
  private reqHeaders: { [h: string]: string } = {}
  private timeout?: number

  constructor(baseUrl: string, options?: Options) {
    this.baseUrl = baseUrl
    this.timeout = options && options.timeout
  }

  setReqHeaders(headers: { [h: string]: string }) {
    this.reqHeaders = headers
  }

  get(path: string, data?: GetParams, { retry } = defaultOptions) {
    if (data) {
      const queryString = encodeParams(data)
      if (queryString) {
        path += '?' + queryString
      }
    }
    return Observable
      .ajax(this.createRequestOptions(GET, path))
      .retryWhen(retryWhen(retry))
      .map(extractResponse)
  }

  post(path: string, data?: object, { retry } = defaultOptions) {
    return Observable
      .ajax(this.createRequestOptions(POST, path, data))
      .retryWhen(retryWhen(retry))
      .map(extractResponse)
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
