import { StateVector } from "../StateVector";
import { FrameCenter, FrameOrientation } from "../Frames";
import { TimeStamp } from "../TimeStamp";
import { EarthPosition, Wgs84 } from "../Wgs84";
import { TimeCorrelation } from "../TimeCorrelation";
import { MathUtils } from "../MathUtils";

/**
 * Observer mode.
 */
export enum ObserverMode {
    STATIC = "STATIC",
    LINEAR = "LINEAR",
    INTERPOLATE = "INTERPOLATE"
};

/**
 * Interface for observer info.
 */
export interface ObserverInfo {
    // Observer mode.
    mode : ObserverMode;
    // State vector.
    state : StateVector;
    // Interpolated state.
    stateInterpolated? : StateVector[];
    // TLE for the observer.
    tle? : string;
    //
    earthPos? : EarthPosition;
};

/**
 * Class with static information
 */
export class Observer {
    /**
     * Create observer info from TLE.
     * 
     * @param {string} tle 
     *      The TLE.
     * @param {TimeStamp} timeStamp 
     *      The time stamp.
     * @returns {ObserverInfo} Observer information.
     */
    static initializeFromTle(tle : string, timeStamp : TimeStamp) : ObserverInfo {
        // TODO: SGP4/SDP4
        const position : number[] = [];
        const velocity : number[] = [];

        return {
            mode : ObserverMode.STATIC,
            state : {
                frameOrientation : FrameOrientation.TEME,
                frameCenter : FrameCenter.BODY_CENTER,
                position : position,
                velocity : velocity,
                timeStamp : timeStamp
            },
            tle : tle
        }
    }

   /**
     * Create observer info from TLE.
     * 
     * @param {string} tle 
     *      The TLE.
     * @param {TimeStamp} timeStamp 
     *      The time stamp.
     * @returns {ObserverInfo} Observer information.
     */
    static initializeFromWgs84(earthPos : EarthPosition, timeStamp : TimeStamp) 
    : ObserverInfo {
        const posEfi : number[] = Wgs84.coordWgs84Efi(earthPos);

        return {
            mode : ObserverMode.STATIC,
            state : {
                frameOrientation : FrameOrientation.EFI,
                frameCenter : FrameCenter.BODY_CENTER,
                position : posEfi,
                velocity : [0, 0, 0],
                timeStamp : timeStamp
            },
            earthPos : earthPos
        }
    }

}