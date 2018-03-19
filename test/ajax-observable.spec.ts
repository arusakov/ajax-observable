import { deepStrictEqual, strictEqual, fail } from 'assert'

// tslint:disable-next-line:no-implicit-dependencies
import { stub, SinonStub } from 'sinon'

import { Observable } from 'rxjs/Observable'
import { AjaxResponse, AjaxRequest, AjaxError } from 'rxjs/observable/dom/AjaxObservable'
import 'rxjs/add/observable/of'
import 'rxjs/add/observable/empty'

class FormData { }
(global as any).FormData = FormData // stub for browser

import { Ajax } from '../src/ajax-observable'

const equalAjaxOptions = (stb: SinonStub, expected: AjaxRequest) => {
  deepStrictEqual(stb.args, [[expected]])
}

type SimpleResp = Pick<AjaxResponse, 'response'>

const createAjaxError = (status: number) => new AjaxError('ajax error', { status } as any, {} as any)
const stubAjax = (resp: SimpleResp | AjaxError | Error) =>
  stub(Observable, 'ajax')
    .returns(resp instanceof Error ? Observable.throw(resp) : Observable.of(resp))

describe('Ajax', () => {
  const BASE_URL = '/base-url'
  const URL_1 = '/url1'
  const AJAX_RESP: SimpleResp = { response: 'response' }
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

  it('get() just error', (done) => {
    const error = new Error()
    ajaxSpy = stubAjax(error)

    ajax
      .post(URL_1, {})
      .subscribe(
        () => fail('no event'),
        (err) => {
          strictEqual(err, error)
          done()
        },
        () => fail('no complete')
      )
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
      .subscribe(
        (resp) => {
          strictEqual(resp, AJAX_RESP.response)
          equalAjaxOptions(ajaxSpy, {
            body: undefined,
            headers,
            method: 'GET',
            timeout: undefined,
            url: BASE_URL + URL_1 + '?x=1',
          })
        },
        undefined,
        done
      )
  })

  it('get() just error', (done) => {
    const error = new Error()
    ajaxSpy = stubAjax(error)

    ajax
      .get(URL_1)
      .subscribe(
        () => fail('no event'),
        (err) => {
          strictEqual(err, error)
          done()
        },
        () => fail('no complete')
      )
  })

  it('get() unhandled error', (done) => {
    const error = createAjaxError(400)
    ajaxSpy = stubAjax(error)

    ajax
      .get(URL_1)
      .subscribe(
        () => fail('no event'),
        (err) => {
          strictEqual(err, error)
          done()
        },
        () => fail('no complete')
      )
  })

})
