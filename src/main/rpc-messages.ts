import { Schema } from 'airtight';

export interface RpcError {
    name: string;
    message: string;
    details: any;
}

export const RpcError = new Schema<RpcError>({
    id: 'RpcError',
    type: 'object',
    properties: {
        name: { type: 'string' },
        message: { type: 'string' },
        details: { type: 'any' },
    },
});

export interface RpcMethodRequest {
    id: number;
    domain: string;
    method: string;
    params: any;
}

export const RpcMethodRequest = new Schema<RpcMethodRequest>({
    id: 'RpcRequestMethod',
    type: 'object',
    properties: {
        id: { type: 'number' },
        domain: { type: 'string' },
        method: { type: 'string' },
        params: { type: 'any' },
    },
});

export interface RpcMethodResponse {
    id: number;
    result?: any;
    error?: RpcError;
}

export const RpcMethodResponse = new Schema<RpcMethodResponse>({
    id: 'RpcRequestResponse',
    type: 'object',
    properties: {
        id: { type: 'number' },
        result: { type: 'any', optional: true },
        error: { ...RpcError.schema, optional: true },
    },
});

export interface RpcEvent {
    domain: string;
    event: string;
    channel: string;
    data: any;
}

export const RpcEvent = new Schema<RpcEvent>({
    id: 'RpcEvent',
    type: 'object',
    properties: {
        domain: { type: 'string' },
        channel: { type: 'string' },
        event: { type: 'string' },
        data: { type: 'any' },
    },
});
