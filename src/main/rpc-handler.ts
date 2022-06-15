import { Event } from 'typesafe-event';

import { MethodNotFound, ProtocolIndex } from './protocol.js';
import { RpcEvent, RpcMethodRequest, RpcMethodResponse } from './rpc-messages.js';

/**
 * PoC RPC message handler. Can be used to implement server side of RPC communication.
 */
export class RpcHandler<P> {

    constructor(
        readonly protocolIndex: ProtocolIndex<P>,
        readonly protocolImpl: P,
        readonly sendResponse: (res: RpcMethodResponse) => void,
        readonly sendEvent: (evt: RpcEvent) => void,
    ) {
        this.registerEvents();
    }

    async processMessage(msg: unknown) {
        let id = -1;
        try {
            const json = typeof msg === 'object' ? msg : JSON.parse(String(msg));
            const req = RpcMethodRequest.decode(json);
            id = req.id;
            const result = await this.runMethod(req);
            const res: RpcMethodResponse = {
                id,
                result,
            };
            this.sendResponse(res);
        } catch (error: any) {
            this.sendResponse({
                id,
                error: {
                    name: error.name,
                    message: error.message,
                },
            });
        }
    }

    protected async runMethod(rpcReq: RpcMethodRequest): Promise<unknown> {
        const { domain, method, params } = rpcReq;
        const key = `${domain}.${method}`;
        const {
            reqSchema,
            resSchema,
        } = this.protocolIndex.lookupMethod(domain, method);
        const domainImpl = (this.protocolImpl as any)[domain];
        const methodImpl = domainImpl?.[method];
        if (!methodImpl) {
            throw new MethodNotFound(key);
        }
        const decodedParams = reqSchema.decode(params);
        const res = await methodImpl.call(domainImpl, decodedParams);
        return resSchema.decode(res);
    }

    protected registerEvents() {
        for (const [domainName, domainDef] of this.protocolIndex) {
            for (const [eventName] of Object.entries(domainDef.events)) {
                const ev = (this.protocolImpl as any)[domainName][eventName];
                if (ev instanceof Event) {
                    ev.on(params => this.sendEvent({
                        domain: domainName,
                        event: eventName,
                        params,
                    }));
                }
            }
        }
    }

}
