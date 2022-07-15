import { Exception } from 'typesafe-exception';

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
        const url = new URL(`${domainName}/${methodName}`, config.baseUrl);
        if (method === 'GET') {
            for (const [k, v] of Object.entries(params ?? {})) {
                if (v === undefined) {
                    continue;
                }
                url.searchParams.append(k, v as any);
            }
        }
        const headers = {
            'content-type': 'application/json',
            ...config.headers,
        };
        const res = await fetch(url.toString(), {
            method,
            headers,
            mode: 'cors',
            credentials: 'include',
            body: method === 'POST' ? JSON.stringify(params ?? {}) : undefined,
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
            const err = new Exception(json.message ?? 'The request cannot be processed.');
            err.name = json.name ?? 'UnknownError';
            throw err;
        }
        return json;
    };
}
