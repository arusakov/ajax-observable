import { deepStrictEqual, strictEqual } from 'assert'

// tslint:disable-next-line:no-implicit-dependencies
import { stub, SinonStub } from 'sinon'

import { Observable } from 'rxjs/Observable'
import { AjaxResponse, AjaxRequest } from 'rxjs/observable/dom/AjaxObservable'
import 'rxjs/add/observable/of'

class FormData {}
(global as any).FormData = FormData // stub for browser

import { Ajax } from '../src/ajax-observable'

const equalAjaxOptions = (stb: SinonStub, expected: AjaxRequest) => {
  deepStrictEqual(stb.args, [[expected]])
}

const stubAjax = (resp: any) => stub(Observable, 'ajax').returns(Observable.of(resp))

describe('Ajax', () => {
  const BASE_URL = '/base-url'
  const URL_1 = '/url1'
  const AJAX_RESP: Pick<AjaxResponse, 'response'> = { response: 'response' }
  const DATA_SIMPLE = { x: 1 }
  const SID = 'sid'

  let ajax: Ajax
  let ajaxSpy: SinonStub

  beforeEach(() => {
    ajax = new Ajax(BASE_URL)
  })

  afterEach(() => {
    if (ajaxSpy) {
      ajaxSpy.restore()
    }
  })

  it('post()', (done) => {
    ajaxSpy = stubAjax(AJAX_RESP)

    ajax
      .post(URL_1, DATA_SIMPLE)
      .subscribe((resp) => {

        strictEqual(resp, AJAX_RESP.response)
        equalAjaxOptions(ajaxSpy, {
          body: DATA_SIMPLE,
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
          timeout: undefined,
          url: BASE_URL + URL_1,
        })

        done()
      })
  })

  it('post() with headers', (done) => {
    ajaxSpy = stubAjax(AJAX_RESP)

    const headers = { Authorization: 'Bearer ' + SID }
    ajax.setReqHeaders(headers)

    ajax
      .post(URL_1, DATA_SIMPLE)
      .subscribe((resp) => {

        strictEqual(resp, AJAX_RESP.response)
        equalAjaxOptions(ajaxSpy, {
          body: DATA_SIMPLE,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          method: 'POST',
          timeout: undefined,
          url: BASE_URL + URL_1,
        })

        done()
      })
  })

  it('get()', (done) => {
    ajaxSpy = stubAjax(AJAX_RESP)

    ajax
      .get(URL_1, DATA_SIMPLE)
      .subscribe((resp) => {

        strictEqual(resp, AJAX_RESP.response)
        equalAjaxOptions(ajaxSpy, {
          body: undefined,
          headers: {},
          method: 'GET',
          timeout: undefined,
          url: BASE_URL + URL_1 + '?x=1',
        })

        done()
      })
  })

  it('get() with empty params object', (done) => {
    ajaxSpy = stubAjax(AJAX_RESP)

    ajax
      .get(URL_1, {})
      .subscribe((resp) => {

        strictEqual(resp, AJAX_RESP.response)
        equalAjaxOptions(ajaxSpy, {
          body: undefined,
          headers: {},
          method: 'GET',
          timeout: undefined,
          url: BASE_URL + URL_1,
        })

        done()
      })
  })

  it('get() with array params', (done) => {
    ajaxSpy = stubAjax(AJAX_RESP)
    const params = { arr: [1, 2] }

    ajax
      .get(URL_1, params)
      .subscribe((resp) => {

        strictEqual(resp, AJAX_RESP.response)
        equalAjaxOptions(ajaxSpy, {
          body: undefined,
          headers: {},
          method: 'GET',
          timeout: undefined,
          url: BASE_URL + URL_1 + '?arr=1&arr=2',
        })

        done()
      })
  })

  it('get() without params', (done) => {
    ajaxSpy = stubAjax(AJAX_RESP)

    ajax
      .get(URL_1)
      .subscribe((resp) => {

        strictEqual(resp, AJAX_RESP.response)
        equalAjaxOptions(ajaxSpy, {
          body: undefined,
          headers: {},
          method: 'GET',
          timeout: undefined,
          url: BASE_URL + URL_1,
        })

        done()
      })
  })

  it('get() with headers', (done) => {
    ajaxSpy = stubAjax(AJAX_RESP)

    const headers = { Authorization: 'Bearer ' + SID }
    ajax.setReqHeaders(headers)

    ajax
      .get(URL_1, DATA_SIMPLE)
      .subscribe((resp) => {

        strictEqual(resp, AJAX_RESP.response)
        equalAjaxOptions(ajaxSpy, {
          body: undefined,
          headers,
          method: 'GET',
          timeout: undefined,
          url: BASE_URL + URL_1 + '?x=1',
        })

        done()
      })
  })

})
