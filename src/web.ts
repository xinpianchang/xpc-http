const Headers = (global.Headers || require('node-fetch').Headers) as unknown as typeof globalThis.Headers
const Response = (global.Response || require('node-fetch').Response) as unknown as typeof globalThis.Response
const URL = (global.URL || require('url').URL) as typeof globalThis.URL

export { Headers, URL, Response }
