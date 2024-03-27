import { sendAPDU } from "./sendAPDU";
describe("sendAPDU", () => {
    const mtu = 64; // Arbitrary chosen MTU, in bytes, so we can compare those tests with the HID framing ones
    const tests = [
        {
            // A get version
            input: { apdu: Buffer.from([0xe0, 0x01, 0, 0, 0]) },
            expectedOutput: [
                // No 0-padding is needed
                Buffer.from([0x05, 0, 0, 0, 0x05, 0xe0, 0x01, 0x00, 0x00, 0x00]),
            ],
        },
        {
            // A (long) edit device name
            input: {
                apdu: Buffer.from([
                    0xe0, 0xd4, 0, 0, 0x40, 0x54, 0x6f, 0x66, 0x75, 0x49, 0x73, 0x4e, 0x75, 0x74, 0x72, 0x69,
                    0x74, 0x69, 0x6f, 0x75, 0x73, 0x41, 0x6e, 0x64, 0x42, 0x72, 0x69, 0x6e, 0x67, 0x73, 0x4a,
                    0x6f, 0x79, 0x44, 0x65, 0x6c, 0x69, 0x67, 0x68, 0x74, 0x48, 0x65, 0x61, 0x6c, 0x74, 0x68,
                    0x69, 0x6e, 0x65, 0x73, 0x73, 0x48, 0x61, 0x72, 0x6d, 0x6f, 0x6e, 0x79, 0x49, 0x6e, 0x45,
                    0x76, 0x65, 0x72, 0x79, 0x42, 0x69, 0x74, 0x65,
                ]),
            },
            expectedOutput: [
                // Frame 1
                Buffer.from([
                    ...[0x05, 0, 0, 0, 0x45, 0xe0, 0xd4, 0x00, 0x00, 0x40],
                    ...[
                        0x54, 0x6f, 0x66, 0x75, 0x49, 0x73, 0x4e, 0x75, 0x74, 0x72, 0x69, 0x74, 0x69, 0x6f,
                        0x75, 0x73, 0x41, 0x6e, 0x64, 0x42, 0x72, 0x69, 0x6e, 0x67, 0x73, 0x4a, 0x6f, 0x79,
                        0x44, 0x65, 0x6c, 0x69, 0x67, 0x68, 0x74, 0x48, 0x65, 0x61, 0x6c, 0x74, 0x68, 0x69,
                        0x6e, 0x65, 0x73, 0x73, 0x48, 0x61, 0x72, 0x6d, 0x6f, 0x6e, 0x79, 0x49,
                    ], // First part of the new device name
                ]),
                // Frame 2
                Buffer.from([
                    ...[0x05, 0, 0x01],
                    ...[0x6e, 0x45, 0x76, 0x65, 0x72, 0x79, 0x42, 0x69, 0x74, 0x65], // Second part of the new device name
                    // No 0-padding is needed
                ]),
            ],
        },
    ];
    tests.forEach(({ input, expectedOutput }) => {
        test(`Input: ${JSON.stringify(input)} -> Expected output: ${JSON.stringify(expectedOutput)}`, done => {
            let i = 0;
            // Compares each frame given to the `write` function to the expected frame
            const write = (frame) => {
                expect(frame).toEqual(expectedOutput[i]);
                i++;
                return Promise.resolve();
            };
            sendAPDU(write, input.apdu, mtu).subscribe({
                error: error => {
                    done(`An error should not occur: ${error}`);
                },
                complete: () => {
                    try {
                        expect(i).toBe(expectedOutput.length);
                    }
                    catch (error) {
                        done(error);
                        return;
                    }
                    done();
                },
            });
        });
    });
});
//# sourceMappingURL=sendAPDU.test.js.map