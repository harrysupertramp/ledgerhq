import HID from "node-hid";
import TransportNodeHidNoEvents, { getDevices } from "@ledgerhq/hw-transport-node-hid-noevents";
import { identifyUSBProductId } from "@ledgerhq/devices";
import { TransportError } from "@ledgerhq/errors";
import listenDevices from "./listenDevices";
let listenDevicesDebounce = 500;
let listenDevicesPollingSkip = () => false;
/**
 * node-hid Transport implementation
 * @example
 * import TransportNodeHid from "@ledgerhq/hw-transport-node-hid";
 * ...
 * TransportNodeHid.create().then(transport => ...)
 */
class TransportNodeHid extends TransportNodeHidNoEvents {
    /**
     * if path="" is not provided, the library will take the first device
     */
    static open(path) {
        return Promise.resolve().then(() => {
            if (path) {
                return new TransportNodeHid(new HID.HID(path));
            }
            const device = getDevices()[0];
            if (!device)
                throw new TransportError("NoDevice", "NoDevice");
            return new TransportNodeHid(new HID.HID(device.path));
        });
    }
}
/**
 *
 */
TransportNodeHid.isSupported = TransportNodeHidNoEvents.isSupported;
/**
 *
 */
TransportNodeHid.list = TransportNodeHidNoEvents.list;
/**
 *
 */
TransportNodeHid.setListenDevicesDebounce = (delay) => {
    listenDevicesDebounce = delay;
};
/**
 *
 */
TransportNodeHid.setListenDevicesPollingSkip = (conditionToSkip) => {
    listenDevicesPollingSkip = conditionToSkip;
};
/**
 *
 */
TransportNodeHid.setListenDevicesDebug = () => {
    console.warn("setListenDevicesDebug is deprecated. Use @ledgerhq/logs instead. No logs will get emitted there anymore.");
};
/**
 */
TransportNodeHid.listen = (observer) => {
    let unsubscribed = false;
    Promise.resolve(getDevices()).then(devices => {
        // this needs to run asynchronously so the subscription is defined during this phase
        for (const device of devices) {
            if (!unsubscribed) {
                const descriptor = device.path;
                const deviceModel = identifyUSBProductId(device.productId);
                observer.next({
                    type: "add",
                    descriptor,
                    device,
                    deviceModel,
                });
            }
        }
    });
    const { events, stop } = listenDevices(listenDevicesDebounce, listenDevicesPollingSkip);
    const onAdd = device => {
        if (unsubscribed || !device)
            return;
        const deviceModel = identifyUSBProductId(device.productId);
        observer.next({
            type: "add",
            descriptor: device.path,
            deviceModel,
            device,
        });
    };
    const onRemove = device => {
        if (unsubscribed || !device)
            return;
        const deviceModel = identifyUSBProductId(device.productId);
        observer.next({
            type: "remove",
            descriptor: device.path,
            deviceModel,
            device,
        });
    };
    events.on("add", onAdd);
    events.on("remove", onRemove);
    function unsubscribe() {
        unsubscribed = true;
        events.removeListener("add", onAdd);
        events.removeListener("remove", onRemove);
        stop();
    }
    return {
        unsubscribe,
    };
};
export default TransportNodeHid;
//# sourceMappingURL=TransportNodeHid.js.map