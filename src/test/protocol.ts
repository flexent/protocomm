import { ProtocolIndex } from '../main/protocol.js';
import { HeartbeatDomain } from './domains/heartbeat.js';
import { SystemDomain } from './domains/system.js';

export interface Protocol {
    Heartbeat: HeartbeatDomain;
    System: SystemDomain;
}

export const protocolIndex = new ProtocolIndex<Protocol>({
    Heartbeat: HeartbeatDomain,
    System: SystemDomain,
});
