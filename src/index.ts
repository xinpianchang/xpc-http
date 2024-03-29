import { CookieSerializeOptions, serialize, parse } from 'cookie'
import type { IncomingMessage, IncomingHttpHeaders, ServerResponse } from 'http'
import type { IncomingHttpHeaders as IncomingHttp2Headers } from 'http2'
import type { TLSSocket } from 'tls'
import merge from 'utils-merge'
import { Env } from './env'

const config = {
  proxy: Env.boolean(process.env.HTTP_BEHIND_PROXY),
  proxyIpHeader: Env.string(process.env.HTTP_FORWARDED_IP_HEADERS || 'x-forwarded-for'),
  maxIpsCount: Env.number(process.env.HTTP_MAX_IPS_COUNT || 0),
}

const IP = Symbol('#ip')
const COOKIE = Symbol('#COOKIE')

declare module 'http' {
  interface IncomingMessage {
    [IP]?: string
    [COOKIE]?: Record<string, string>
    memoizedURL?: URL
    originalUrl?: string
  }
}

interface AllHeaders extends IncomingHttp2Headers, IncomingHttpHeaders {
  referrer?: string
  'x-forwarded-host'?: string
  'x-forwarded-proto'?: string
  'device-id'?: string
}
type HeaderType<F extends string> = string extends F
  ? string | string[]
  : Lowercase<F> extends keyof AllHeaders
    ? NonNullable<AllHeaders[Lowercase<F>]>
    : string | string[]

export { Env }

export function getHeader<F extends string>(req: IncomingMessage, field: F): HeaderType<F> {
  const f = field.toLocaleLowerCase() as Lowercase<F>
  switch (f) {
    case 'referer':
    case 'referrer':
      return (req.headers.referrer || req.headers.referer || '') as any
    default:
      return (req.headers[f] || '') as any
  }
}

export function getUserAgent(req: IncomingMessage) {
  return getHeader(req, 'user-agent')
}

export function getHost(req: IncomingMessage) {
  const proxy = config.proxy
  let host = proxy && getHeader(req, 'x-forwarded-host')
  if (!host) {
    if (req.httpVersionMajor >= 2) host = getHeader(req, ':authority')
    if (!host) host = getHeader(req, 'host')
  }
  if (!host || !host.length) return ''
  return host.split(/\s*,\s*/, 1)[0]
}

/**
 * Parse the "Host" header field hostname
 * and support X-Forwarded-Host when a
 * proxy is enabled.
 */
export function getHostname(req: IncomingMessage) {
  const host = getHost(req)
  if (!host) return ''
  if ('[' === host[0]) return getURL(req).hostname || '' // IPv6
  return host.split(':', 1)[0]
}

/**
 * Get WHATWG parsed URL.
 * Lazily memoized.
 */
export function getURL(req: IncomingMessage) {
  if (!req.memoizedURL) {
    // avoid undefined in template string
    const originalUrl = req.originalUrl || req.url || ''
    try {
      req.memoizedURL = new URL(`${getOrigin(req)}${originalUrl}`)
    } catch (err) {
      req.memoizedURL = Object.create(null)
    }
  }
  return req.memoizedURL as URL
}

export function getHref(req: IncomingMessage) {
  const originalUrl = req.originalUrl || req.url || ''
  if (/^https?:\/\//i.test(originalUrl)) return originalUrl
  return getOrigin(req) + originalUrl
}

export function getOrigin(req: IncomingMessage) {
  return `${getProtocol(req)}://${getHost(req)}`
}

/**
 * Return the protocol string "http" or "https"
 * when requested with TLS. When the proxy setting
 * is enabled the "X-Forwarded-Proto" header
 * field will be trusted. If you're running behind
 * a reverse proxy that supplies https for you this
 * may be enabled.
 */
export function getProtocol(req: IncomingMessage) {
  if ((req.socket as TLSSocket).encrypted) return 'https'
  if (!config.proxy) return 'http'
  const proto = getHeader(req, 'x-forwarded-proto')
  return proto ? proto.split(/\s*,\s*/, 1)[0] : 'http'
}

/**
 * When `config.proxy` is `true`, parse
 * the "X-Forwarded-For" ip address list.
 *
 * For example if the value was "client, proxy1, proxy2"
 * you would receive the array `["client", "proxy1", "proxy2"]`
 * where "proxy2" is the furthest down-stream.
 */
export function getIps(req: IncomingMessage) {
  const proxy = config.proxy
  const val = getHeader(req, config.proxyIpHeader || 'x-forwarded-for')
  const v = Array.isArray(val) ? val[0] : val
  let ips = proxy && v ? v.split(/\s*,\s*/) : []
  if (config.maxIpsCount > 0) {
    ips = ips.slice(-config.maxIpsCount)
  }
  return ips
}

/**
 * Return request's remote address
 * When `config.proxy` is `true`, parse
 * the "X-Forwarded-For" ip address list and return the first one
 */
export function getIp(req: IncomingMessage) {
  let ip = req[IP]
  if (!ip) {
    // nextjs not mocked remote address
    try {
      ip = req[IP] = getIps(req)[0] || (req.socket && req.socket.remoteAddress) || ''
    } catch {
      ip = ''
    }
  }
  return ip
}

export function setIp(req: IncomingMessage, ip: string) {
  req[IP] = ip
}

export function setHeader(res: ServerResponse, field: Record<string, any>): void
export function setHeader(res: ServerResponse, field: string, val: any): void
export function setHeader(res: ServerResponse, field: string | Record<string, any>, val?: any) {
  if (res.headersSent) return

  if (typeof field === 'string') {
    if (Array.isArray(val)) val = val.map(v => (typeof v === 'string' ? v : String(v)))
    else if (typeof val !== 'string') val = String(val)
    res.setHeader(field, val)
  } else {
    for (const key in field) {
      setHeader(res, key, field[key])
    }
  }
}

export function appendHeader(res: ServerResponse, field: string, val: any) {
  const prev = res.getHeader(field)
  if (prev) {
    val = Array.isArray(prev) ? prev.concat(val) : [prev].concat(val)
  }
  setHeader(res, field, val)
}

export function appendHeaders(res: ServerResponse, init: HeadersInit) {
  const headers = new Headers(init)
  headers.forEach((v, k) => appendHeader(res, k, v))
}

export type SetCookieOptions = Omit<CookieSerializeOptions, 'encode'>

/**
 * Get cookie from request headers cookie, value will be decoded with decodeURIComponent
 * @returns {string | undefined}
 */
 export function getCookie(req: IncomingMessage, name: string) {
  let cookies = req[COOKIE]
  if (!cookies) {
    cookies = parse(getHeader(req, 'cookie'))
    req[COOKIE] = cookies
  }
  return cookies[name] as string | undefined
}

/**
 * set cookie on response, value will be encoded with encodeURIComponent
 * @param options {SetCookieOptions} options.maxAge in milliseconds
 */
export function setCookie(res: ServerResponse, name: string, val: string, options?: SetCookieOptions) {
  const opts = merge({ path: '/' }, options) as SetCookieOptions

  if (typeof opts.maxAge === 'number') {
    const maxAge = opts.maxAge || 0
    opts.expires = new Date(Date.now() + maxAge)
    opts.maxAge = maxAge / 1000
  }

  appendHeader(res, 'Set-Cookie', serialize(name, val, opts))
}

export function clearCookie(res: ServerResponse, name: string, options?: SetCookieOptions) {
  const opts: SetCookieOptions = merge({ expires: new Date(1), path: '/' }, options)
  setCookie(res, name, '', opts)
}
