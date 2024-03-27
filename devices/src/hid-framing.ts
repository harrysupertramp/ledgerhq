import { TransportError } from "@ledgerhq/errors";


// Represents a response message from the device being reduced from HID USB frames/packets
export type ResponseAcc =
  | {
      data: Uint8Array;
      dataLength: number;
      // The current frame id/number
      sequence: number;
    }
  | null
  | undefined;

const Tag = 0x05;

function asUInt16BE(value: number): Uint8Array {
  const b = new Uint8Array(2);
  b[0] = (value >> 8) & 0xFF; // high byte
  b[1] = value & 0xFF;        // low byte
  return b;
}

const initialAcc = {
  data: new Uint8Array(0),
  dataLength: 0,
  sequence: 0,
};

/**
 * Object to handle HID frames (encoding and decoding)
 *
 * @param channel
 * @param packetSize The HID protocol packet size in bytes (usually 64)
 */
const createHIDframing = (channel: number, packetSize: number) => {
  return {
    /**
     * Frames/encodes an APDU message into HID USB packets/frames
     *
     * @param apdu The APDU message to send, in a Uint8Array containing [cla, ins, p1, p2, data length, data(if not empty)]
     * @returns an array of HID USB frames ready to be sent
     */
    makeBlocks(apdu: Uint8Array, channel: number, packetSize: number): Uint8Array[] {
      // Encodes the APDU length in 2 bytes before the APDU itself.
      // The length is measured as the number of bytes.
      const apduLength = asUInt16BE(apdu.length);
      const data = new Uint8Array(apduLength.length + apdu.length);
      data.set(apduLength, 0); // Copy the length bytes to the beginning
      data.set(apdu, apduLength.length); // Copy the APDU bytes after the length
    
      const blockSize = packetSize - 5;
      const nbBlocks = Math.ceil(data.length / blockSize);
    
      // Fills data with 0-padding
      const paddedData = new Uint8Array(nbBlocks * blockSize);
      paddedData.set(data, 0); // Copy the data bytes to the beginning
      const blocks: Uint8Array[] = [];
    
      for (let i = 0; i < nbBlocks; i++) {
        const head = new Uint8Array(5);
        head.set(asUInt16BE(channel), 0); // Set the channel bytes
        head.set([Tag], 2); // Set the Tag byte
        head.set(asUInt16BE(i), 3); // Set the sequence bytes
    
        // `slice` and not `subarray`: this might not be a Node Uint8Array, but probably only a Uint8Array
        const chunk = paddedData.slice(i * blockSize, (i + 1) * blockSize);
    
        const concatenatedArray = new Uint8Array(head.length + chunk.length);
        concatenatedArray.set(head, 0);
        concatenatedArray.set(chunk, head.length);
        blocks.push(concatenatedArray);


      }
    
      return blocks;    
    },

    /**
     * Reduces HID USB packets/frames to one response.
     *
     * @param acc The value resulting from (accumulating) the previous call of reduceResponse.
     *   On first call initialized to `initialAcc`. The accumulator enables handling multi-frames messages.
     * @param chunk Current chunk to reduce into accumulator
     * @returns An accumulator value updated with the current chunk
     */
    reduceResponse(acc: ResponseAcc, chunk: Uint8Array): ResponseAcc {
      let { data, dataLength, sequence } = acc || initialAcc;
    
      const channel = chunk[0] << 8 | chunk[1]; // Combine bytes 0 and 1 into a 16-bit integer
      if (channel !== channel) {
        throw new TransportError("Invalid channel", "InvalidChannel");
      }
    
      const tag = chunk[2]; // Get byte 2
      if (tag !== Tag) {
        throw new TransportError("Invalid tag", "InvalidTag");
      }
    
      const seq = chunk[3] << 8 | chunk[4]; // Combine bytes 3 and 4 into a 16-bit integer
      if (seq !== sequence) {
        throw new TransportError("Invalid sequence", "InvalidSequence");
      }
    
      // Gets the total length of the response from the 1st frame
      if (!acc) {
        dataLength = chunk[5] << 8 | chunk[6]; // Combine bytes 5 and 6 into a 16-bit integer
      }
    
      sequence++;
    
      // The total length on the 1st frame takes 2 more bytes
      const chunkData = chunk.subarray(acc ? 5 : 7); // Use subarray to get the remaining data after the header
      const newData = new Uint8Array(data.length + chunkData.length);
      newData.set(data);
      newData.set(chunkData, data.length);
      data = newData;
    
      // Removes any 0 padding
      if (data.length > dataLength) {
        data = data.subarray(0, dataLength); // Use subarray to trim the data if necessary
      }
    
      return {
        data,
        dataLength,
        sequence,
      };
    },
    

    /**
     * Returns the response message that has been reduced from the HID USB frames
     *
     * @param acc The accumulator
     * @returns A Uint8Array containing the cleaned response message, or null if no response message, or undefined if the
     *   accumulator is incorrect (message length is not valid)
     */
    getReducedResult(acc: ResponseAcc): Uint8Array | null | undefined {
      if (acc && acc.dataLength === acc.data.length) {
        return acc.data;
      }
    },
  };
};

export default createHIDframing;
