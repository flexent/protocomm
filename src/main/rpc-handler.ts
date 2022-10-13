import { ChannelEvent } from './channel-event.js';
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
            const req = RpcMethodRequest.decode(json, { strictRequired: true });
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
        const {
            reqSchema,
            resSchema,
        } = this.protocolIndex.lookupMethod(domain, method);
        const domainImpl = (this.protocolImpl as any)[domain];
        const methodImpl = domainImpl?.[method];
        if (!methodImpl) {
            throw new MethodNotFound(`${domain}.${method}`);
        }
        const decodedParams = reqSchema.decode(params, { strictRequired: true });
        const res = await methodImpl.call(domainImpl, decodedParams);
        return resSchema.decode(res);
    }

    protected registerEvents() {
        for (const [domainName, domainDef] of this.protocolIndex) {
            for (const [eventName] of Object.entries(domainDef.events)) {
                const { paramSchema } = this.protocolIndex.lookupEvent(domainName, eventName);
                const ev = (this.protocolImpl as any)[domainName][eventName];
                if (ev instanceof ChannelEvent) {
                    ev.on(payload => this.sendEvent({
                        domain: domainName,
                        event: eventName,
                        channel: payload.channel,
                        data: paramSchema.decode(payload.data),
                    }));
                }
            }
        }
    }

}
