import { deepStrictEqual, strictEqual, fail } from 'assert'

// tslint:disable-next-line:no-implicit-dependencies
import { stub, SinonStub, useFakeTimers } from 'sinon'

import { Observable } from 'rxjs/Observable'
import { Subscriber } from 'rxjs/Subscriber'
import { AjaxResponse, AjaxRequest, AjaxError, AjaxTimeoutError } from 'rxjs/observable/dom/AjaxObservable'
import 'rxjs/add/observable/of'
import 'rxjs/add/observable/empty'
import 'rxjs/add/operator/delay'

class FormData { }
(global as any).FormData = FormData // stub for browser

import { Ajax } from '../src/ajax-observable'

const equalAjaxOptions = (stb: SinonStub, expected: AjaxRequest) => {
  deepStrictEqual(stb.args, [[expected]])
}

type SimpleResp = Pick<AjaxResponse, 'response'>

const createAjaxError = (status: number) => new AjaxError('ajax error', { status } as any, {} as any)
const stubAjax = (resp: SimpleResp | AjaxError | Error | Observable<any> | ((s: Subscriber<any>) => void)) =>
  stub(Observable, 'ajax')
    .returns(
      (resp instanceof Error && Observable.throw(resp)) ||
      (resp instanceof Observable && resp) ||
      (typeof resp === 'function' && new Observable(resp)) ||
      Observable.of(resp)
    )

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

  it('post() without body', (done) => {
    ajaxSpy = stubAjax(AJAX_RESP)

    ajax
      .post(URL_1)
      .subscribe((resp) => {

        strictEqual(resp, AJAX_RESP.response)
        equalAjaxOptions(ajaxSpy, {
          body: undefined,
          headers: {},
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

  it('post() with timeout', (done) => {
    const clock = useFakeTimers()

    const timeoutError = new AjaxTimeoutError({} as any, {} as any)
    const error = new Error()
    let index = 0

    const producer = (s: Subscriber<any>) => {
      if (index === 0) {
        s.error(timeoutError)
      } else {
        s.error(error)
      }
      index += 1
    }

    ajaxSpy = stubAjax(producer)

    const ajaxWithTimeout = new Ajax('/', { timeout: 5000 })

    ajaxWithTimeout
      .post(URL_1, {})
      .subscribe(
        () => fail('no event'),
        (err) => {
          strictEqual(err, error)
          done()
        },
        () => fail('no complete')
      )

    clock.tick(1000)
  })

  it('post() sequance of 5xx', (done) => {
    const clock = useFakeTimers()

    const error = createAjaxError(500)
    let index = 0

    const producer = (s: Subscriber<any>) => {
      if (index <= 6) {
        s.error(error)
      } else {
        s.next(AJAX_RESP)
        s.complete()
      }
      index += 1
    }

    ajaxSpy = stubAjax(producer)

    const ajaxWithTimeout = new Ajax('/')

    ajaxWithTimeout
      .post(URL_1)
      .subscribe(
        (resp) => strictEqual(resp, AJAX_RESP.response),
        () => fail('no error'),
        done
      )

    clock.tick(1000)
    clock.tick(2000)
    clock.tick(4000)
    clock.tick(8000)
    clock.tick(16000)
    clock.tick(32000)
    clock.tick(60000)
  })

  it('post() 429', (done) => {
    const clock = useFakeTimers()
    const error429 = createAjaxError(429)
    let index = 0

    const producer = (s: Subscriber<any>) => {
      if (index === 0) {
        s.error(error429)
      } else {
        s.next(AJAX_RESP)
        s.complete()
      }
      index += 1
    }

    ajaxSpy = stubAjax(producer)

    const ajaxWithTimeout = new Ajax('/')

    ajaxWithTimeout
      .post(URL_1, {})
      .subscribe(
        (resp) => strictEqual(resp, AJAX_RESP.response),
        () => fail('no event'),
        done
      )

    clock.tick(30000)
  })

  it('get()', (done) => {
    ajaxSpy = stubAjax(AJAX_RESP)

    ajax
      .get(URL_1, DATA_SIMPLE)
      .subscribe(
        (resp) => {

          strictEqual(resp, AJAX_RESP.response)
          equalAjaxOptions(ajaxSpy, {
            body: undefined,
            headers: {},
            method: 'GET',
            timeout: undefined,
            url: BASE_URL + URL_1 + '?x=1',
          })
        },
        () => fail('no error'),
        done
      )
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

  it('get() with undefined and null', (done) => {
    ajaxSpy = stubAjax(AJAX_RESP)

    ajax
      .get(URL_1, {
        arr: [null, 1, undefined],
        val: 2,
        x: undefined,
        y: null,
      })
      .subscribe((resp) => {

        strictEqual(resp, AJAX_RESP.response)
        equalAjaxOptions(ajaxSpy, {
          body: undefined,
          headers: {},
          method: 'GET',
          timeout: undefined,
          url: BASE_URL + URL_1 + '?arr=1&val=2',
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
