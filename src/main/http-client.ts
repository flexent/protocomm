import { DomainMethodDef } from './domain.js';
import { HttpRequestError, RequestFailedError, UnexpectedResponseError } from './errors.js';
import { ProtocolIndex } from './protocol.js';

export type FetchFn = (fullUrl: string, options?: FetchOptions) => Promise<Response>;

export interface FetchOptions {
    method?: string;
    body?: any;
    headers?: RequestHeaders;
    mode?: 'cors' | 'no-cors' | 'same-origin';
    credentials?: 'include' | 'omit' | 'same-origin';
}

export type RequestHeaders = Record<string, string>;

export interface HttpClientConfig {
    baseUrl: string;
    fetch?: FetchFn;
    headers?: Record<string, string>;
}

/**
 * PoC client for sending protocol messages via HTTP.
 */
export function createHttpClient<P>(protocol: ProtocolIndex<P>, config: HttpClientConfig): P {
    const client: any = {};
    for (const [domainName, domainDef] of protocol) {
        const methods: any = {};
        client[domainName] = methods;
        for (const [methodName, methodDef] of Object.entries(domainDef.methods)) {
            methods[methodName] = createMethod(domainDef.name, methodName, methodDef, config);
        }
        // TODO (later) add support for event streaming
    }
    return client;
}

function createMethod<R, P>(
    domainName: string,
    methodName: string,
    methodDef: DomainMethodDef<P, R>,
    config: HttpClientConfig,
) {
    const method = methodDef.type === 'query' ? 'GET' : 'POST';
    return async (params: P): Promise<R> => {
        let baseUrl = config.baseUrl;
        if (!baseUrl.endsWith('/')) {
            baseUrl += '/';
        }
        const url = new URL(`${domainName}/${methodName}`, baseUrl);
        if (method === 'GET') {
            for (const [k, v] of Object.entries(params ?? {})) {
                if (v === undefined) {
                    continue;
                }
                const arr = Array.isArray(v) ? v : [v];
                for (const v of arr) {
                    url.searchParams.append(k, v);
                }
            }
        }
        const headers = {
            'content-type': 'application/json',
            ...config.headers,
        };
        const requestBody = method === 'POST' ? JSON.stringify(params ?? {}) : undefined;
        const fetch = config.fetch ?? globalThis.fetch;
        return await sendRequest(fetch, method, url, headers, requestBody);
    };
}

async function sendRequest(
    fetch: FetchFn,
    method: string,
    url: URL,
    headers: Record<string, string>,
    requestBody: any
): Promise<any> {
    const res = await fetch(url.toString(), {
        method,
        headers,
        mode: 'cors',
        credentials: 'include',
        body: requestBody,
    }).catch(err => {
        throw new RequestFailedError(err, url.toString());
    });
    if (!res.ok) {
        const responseBody = await res.text();
        const details = parseJson(responseBody) ?? { response: responseBody };
        // If response is JSON and has { name, message, details? }, then throw that
        // Otherwise throw a more generic HttpRequestError
        if (details && typeof details.name === 'string' && typeof details.message === 'string') {
            const err = new Error() as any;
            err.message = details.message;
            err.name = details.name;
            err.details = details.details;
            err.status = res.status;
            throw err;
        }
        throw new HttpRequestError(res.status, method, url.toString(), details);
    }
    return await res.json().catch(err => {
        throw new UnexpectedResponseError(err);
    });
}

function parseJson(str: string, defaultValue: any = undefined): any {
    try {
        return JSON.parse(str);
    } catch (_err) {
        return defaultValue;
    }
}
