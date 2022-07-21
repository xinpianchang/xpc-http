# Instructions

  [![@newstudios/http-utils][npm-image]][npm-url]

## Npm install
```shell
  npm install --save @newstudios/http-utils
```

## Yarn install
```shell
  yarn add @newstudios/http-utils
```

# Usage notice

The package is a commonjs library, and needs some environments to work as expected
```bash
# whether the http server is behind a proxy, default is false
HTTP_BEHIND_PROXY = true

# http forwarded ip header name, default is 'x-forwaded-for'
HTTP_FORWARDED_IP_HEADERS = x-forwarded-for

# http forwaded ips max count, default is 0, means no limit restrictions
HTTP_MAX_IPS_COUNT = 0
```

# API
```typescript
export declare function getHeader<F extends string>(req: IncomingMessage, field: F): HeaderType<F>;
export declare function getUserAgent(req: IncomingMessage): string;
export declare function getHost(req: IncomingMessage): string;
/**
 * Parse the "Host" header field hostname
 * and support X-Forwarded-Host when a
 * proxy is enabled.
 */
export declare function getHostname(req: IncomingMessage): string;
/**
 * Get WHATWG parsed URL.
 * Lazily memoized.
 */
export declare function getURL(req: IncomingMessage): URL;
export declare function getHref(req: IncomingMessage): string;
export declare function getOrigin(req: IncomingMessage): string;
/**
 * Return the protocol string "http" or "https"
 * when requested with TLS. When the proxy setting
 * is enabled the "X-Forwarded-Proto" header
 * field will be trusted. If you're running behind
 * a reverse proxy that supplies https for you this
 * may be enabled.
 */
export declare function getProtocol(req: IncomingMessage): string;
/**
 * When `config.proxy` is `true`, parse
 * the "X-Forwarded-For" ip address list.
 *
 * For example if the value was "client, proxy1, proxy2"
 * you would receive the array `["client", "proxy1", "proxy2"]`
 * where "proxy2" is the furthest down-stream.
 */
export declare function getIps(req: IncomingMessage): string[];
/**
 * Return request's remote address
 * When `config.proxy` is `true`, parse
 * the "X-Forwarded-For" ip address list and return the first one
 */
export declare function getIp(req: IncomingMessage): string;
export declare function setIp(req: IncomingMessage, ip: string): void;
export declare function setHeader(res: ServerResponse, field: Record<string, any>): void;
export declare function setHeader(res: ServerResponse, field: string, val: any): void;
export declare function appendHeader(res: ServerResponse, field: string, val: any): void;
export declare function appendHeaders(res: ServerResponse, init: HeadersInit): void;
export declare type SetCookieOptions = Omit<CookieSerializeOptions, 'encode'>;
/**
 * Get cookie from request headers cookie, value will be decoded with decodeURIComponent
 * @returns {string | undefined}
 */
export declare function getCookie(req: IncomingMessage, name: string): string | undefined;
/**
 * set cookie on response, value will be encoded with encodeURIComponent
 * @param options {SetCookieOptions} options.maxAge in milliseconds
 */
export declare function setCookie(res: ServerResponse, name: string, val: string, options?: SetCookieOptions): void;
export declare function clearCookie(res: ServerResponse, name: string, options?: SetCookieOptions): void;
```

[npm-image]: https://img.shields.io/npm/v/@newstudios/http-utils.svg?style=flat-square
[npm-url]: https://npmjs.org/package/@newstudios/http-utils
