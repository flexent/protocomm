import { parseJson } from '../util/json.js';
import { DomainMethodDef } from './domain.js';
import { ProtocolIndex } from './protocol.js';

export interface FetchOptions {
    method?: string;
    body?: any;
    headers?: RequestHeaders;
}

export interface RequestHeaders {
    [key: string]: string;
}

export interface HttpClientConfig {
    baseUrl: string;
    fetch?(fullUrl: string, options?: FetchOptions): Promise<Response>;
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
    const fetch = config.fetch ?? globalThis.fetch;
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
        try {
            const res = await fetch(url.toString(), {
                method,
                headers,
                mode: 'cors',
                credentials: 'include',
                body: method === 'POST' ? JSON.stringify(params ?? {}) : undefined,
            });
            
            if (!res.ok) {
                const responseBodyText = await res.text();
                const json = parseJson(responseBodyText, {})
                const message = json.message ?? responseBodyText;
                const error = new Error(message) as any;
                error.name = json.name ?? 'UnknownError';
                error.details = json.details;
                error.code = res.status;
                throw error;
            }
            return await res.json();
        } catch (error: any) {
            throw new RequestError(error, url.toString());
        }
    };
}

class RequestError extends Error {
    cause: any;
    code?: number;

    constructor(err: any, url: string) {
        super(`Request to ${url} failed: ${err.message}`);
        this.name = "RequestError";
        this.code = err.code ?? undefined;
        this.cause = {
            name: err?.name ?? "UnknownError",
            message: err?.message ?? String(err),
            details: err?.details ?? "The target server failed to process the request."
        }
    }
}
