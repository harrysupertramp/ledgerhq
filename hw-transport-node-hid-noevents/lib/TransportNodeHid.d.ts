/// <reference types="node" />
import HID, { Device } from "node-hid";
import { LogType, TraceContext } from "@ledgerhq/logs";
import Transport, { Observer, DescriptorEvent, Subscription } from "@ledgerhq/hw-transport";
import { DeviceModel } from "@ledgerhq/devices";
export declare function getDevices(): (Device & {
    deviceName?: string;
})[];
/**
 * node-hid Transport minimal implementation
 * @example
 * import TransportNodeHid from "@ledgerhq/hw-transport-node-hid-noevents";
 * ...
 * TransportNodeHid.create().then(transport => ...)
 */
export default class TransportNodeHidNoEvents extends Transport {
    /**
     *
     */
    static isSupported: () => Promise<boolean>;
    /**
     *
     */
    static list: () => Promise<any>;
    /**
     */
    static listen: (observer: Observer<DescriptorEvent<any>>) => Subscription;
    /**
     * if path="" is not provided, the library will take the first device
     */
    static open(path: string | null | undefined): Promise<TransportNodeHidNoEvents>;
    device: HID.HID;
    deviceModel: DeviceModel | null | undefined;
    channel: number;
    packetSize: number;
    disconnected: boolean;
    constructor(device: HID.HID, { context, logType }?: {
        context?: TraceContext;
        logType?: LogType;
    });
    setDisconnected: () => void;
    writeHID: (content: Buffer) => Promise<void>;
    readHID: () => Promise<Buffer>;
    /**
     * Exchange with the device using APDU protocol.
     *
     * @param apdu
     * @returns a promise of apdu response
     */
    exchange(apdu: Buffer): Promise<Buffer>;
    setScrambleKey(): void;
    /**
     * release the USB device.
     */
    close(): Promise<void>;
}
//# sourceMappingURL=TransportNodeHid.d.ts.map