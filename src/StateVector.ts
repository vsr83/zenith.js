import { FrameCenter, FrameOrientation } from "./Frames";
import { TimeStamp } from "./TimeStamp";

/**
 * State vector.
 */
export interface StateVector {
    // Center of the frame.
    frameCenter : FrameCenter;

    // Orientation of the frame.
    frameOrientation : FrameOrientation;

    // Position vector (m).
    position : number[];

    // Velocity vector (m/s).
    velocity : number[];

    // Timestamp.
    timeStamp : TimeStamp;
}