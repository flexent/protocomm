import { Event } from 'nanoevent';

import { DomainMethod } from './domain.js';
import { ProtocolIndex } from './protocol.js';
import { RpcEvent, RpcMethodRequest, RpcMethodResponse } from './rpc-messages.js';

export interface RpcClientTransport {
    messageReceived: Event<unknown>;
    connectionClosed: Event<{}>;
    sendRequest(req: RpcMethodRequest): void;
}

/**
 * PoC client for exchanging messages in RPC format via an abstract transport
 * that supports sending and receiving arbitrary messages (e.g. WebSocket, IPC, events, etc.)
 */
export class RpcClient<P> {
    protected id = 0;
    protected awaitingCommands: Map<number, AwaitingCommand<any>> = new Map();
    protected eventMap: Map<string, Event<any>> = new Map();

    client: P;

    constructor(
        readonly index: ProtocolIndex<P>,
        readonly sendRequest: (req: RpcMethodRequest) => void,
    ) {
        this.client = this.createClient();
    }

    /**
     * Call this on new message.
     */
    processMessage(msg: unknown) {
        const json = typeof msg === 'object' ? msg : JSON.parse(String(msg));
        if (this.isMethodResponse(json)) {
            return this.handleMethodResponse(json);
        }
        if (this.isEvent(json)) {
            return this.handleEvent(json);
        }
    }

    /**
     * Call this when the client connection closes.
     */
    handleClose() {
        for (const cmd of this.awaitingCommands.values()) {
            const err = new ClientClosed(`Method ${cmd.methodName} failed: client connection closed`);
            cmd.reject(err);
        }
        this.awaitingCommands.clear();
    }

    protected createMethod<Req, Res>(domainName: string, methodName: string): DomainMethod<Req, Res> {
        return async (req: Req) => {
            this.id = (this.id + 1) % Number.MAX_SAFE_INTEGER;
            const rpcPayload: RpcMethodRequest = {
                id: this.id,
                domain: domainName,
                method: methodName,
                params: req || {},
            };
            return new Promise<Res>((resolve, reject) => {
                this.awaitingCommands.set(this.id, {
                    id: this.id,
                    methodName,
                    resolve,
                    reject,
                });
                this.sendRequest(rpcPayload);
            });
        };
    }

    protected createEvent(domainName: string, eventName: string) {
        const evt = new Event<any>();
        this.eventMap.set(`${domainName}.${eventName}`, evt);
        return evt;
    }

    protected handleMethodResponse(res: RpcMethodResponse) {
        const cmd = this.awaitingCommands.get(res.id);
        if (!cmd) {
            return;
        }
        this.awaitingCommands.delete(res.id);
        const { resolve, reject } = cmd;
        if (res.error) {
            const error = new Error(res.error?.message ?? 'Unknown error') as any;
            error.name = res.error?.name ?? 'UnknownError';
            error.details = res.error?.details;
            reject(error);
        } else {
            resolve(res.result);
        }
    }

    protected handleEvent(res: RpcEvent) {
        const event = this.eventMap.get(`${res.domain}.${res.event}`);
        if (!event) {
            return;
        }
        event.emit(res.data);
    }

    protected isMethodResponse(msg: unknown): msg is RpcMethodResponse {
        return !!(msg as any).id;
    }

    protected isEvent(msg: unknown): msg is RpcEvent {
        return !!(msg as any).event;
    }

    protected createClient(): P {
        const result: any = {};
        for (const [domainName, domainDef] of this.index) {
            const impl: any = {};
            result[domainName] = impl;
            for (const methodName of Object.keys(domainDef.methods)) {
                impl[methodName] = this.createMethod(domainDef.name, methodName);
            }
            for (const eventName of Object.keys(domainDef.events)) {
                impl[eventName] = this.createEvent(domainDef.name, eventName);
            }
        }
        return result;
    }
}

interface AwaitingCommand<T> {
    id: number;
    methodName: string;
    resolve: (result: T) => void;
    reject: (error: Error) => void;
}

export class ClientClosed extends Error {
    override name = this.constructor.name;
}
