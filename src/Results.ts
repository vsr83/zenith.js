
import { FrameCenter, FrameConversions, FrameOrientation } from "./Frames";
import { StateVector } from "./StateVector";
import { TimeStamp } from "./TimeStamp";
import { Target } from "./Configuration/TargetConf";
import { ObserverInfo } from "./Configuration/ObserverConf";
import { MathUtils } from "./MathUtils";
import { Angles } from "./Angles";

/**
 * Computation results for single target for a single time step.
 */
export interface TargetResults {
    // Map that associates a state vector to each pair (FrameCenter, FrameOrientation).
    // The positions and velocities are raw without any corrections of any kind.
    stateMapRaw : Map<FrameCenter, Map<FrameOrientation, StateVector>>;

    // State map with positions and velocities corrected for light time.
    stateMapLightTime : Map<FrameCenter, Map<FrameOrientation, StateVector>>;

    // State map with positions and velocities corrected for light time and aberration.
    stateMapAberrationCla : Map<FrameCenter, Map<FrameOrientation, StateVector>>;
    stateMapAberrationRel : Map<FrameCenter, Map<FrameOrientation, StateVector>>;
    //stateMapAberration : Map<FrameCenter, Map<FrameOrientation, StateVector>>;
};

/**
 * Results for a target.
 */
export interface TimeStepResults {
    // Time stamp associated to the results.
    timeStamp : TimeStamp;

    // Target info.
    targets : Target[];

    // Results for each time step.
    results : TargetResults[];
};

/**
 * Class for computing results.
 */
export class PostProcessing {
    /**
     * Compute astrometric right ascension with respect to the observer. Includes only 
     * correction for light-time.
     * 
     * @param {TargetResults} results
     *      Target results.
     * @param {ObserverInfo} observerInfo
     *      Observer info.
     * @param {FrameConversions} frameConversions
     *      Frame conversions. 
     * @returns {number[]} Array of right ascension and declination in degrees with the ranges 
     * [0, 360] and [-90, 90], respectively.
     */
    static computeRaDeclIcrf(results : TargetResults, observerInfo : ObserverInfo, frameConversions : FrameConversions) : 
    number[] {
        let observer : StateVector = observerInfo.state;
        observer = frameConversions.rotateTo(observer, FrameOrientation.J2000_EQ);
        const target : StateVector = <StateVector>results.stateMapLightTime.get(observer.frameCenter)
            ?.get(FrameOrientation.J2000_EQ);

        const targetPosition : number[] = MathUtils.vecDiff(target.position, observer.position);
        return [
            Angles.limitAngleDeg(MathUtils.atan2d(targetPosition[1], targetPosition[0])),
            MathUtils.asind(targetPosition[2] / MathUtils.norm(targetPosition))
        ];
    }

    /**
     * Compute airless apparent right ascension with respect to the observer. Corrected 
     * for light-time, aberration, precession and nutation.
     * 
     * @param {TargetResults} results
     *      Target results.
     * @param {ObserverInfo} observerInfo
     *      Observer info.
     * @param {FrameConversions} frameConversions
     *      Frame conversions. 
     * @returns {number[]} Array of right ascension and declination in degrees with the ranges 
     * [0, 360] and [-90, 90], respectively.
     */
    static computeRaDeclApparent(results : TargetResults, observerInfo : ObserverInfo, frameConversions : FrameConversions) : 
    number[] {
        let observer : StateVector = observerInfo.state;
        observer = frameConversions.rotateTo(observer, FrameOrientation.TOD);
        const target : StateVector = <StateVector>results.stateMapAberrationRel.get(observer.frameCenter)
            ?.get(FrameOrientation.TOD);

        const targetPosition : number[] = MathUtils.vecDiff(target.position, observer.position);
        return [
            Angles.limitAngleDeg(MathUtils.atan2d(targetPosition[1], targetPosition[0])),
            MathUtils.asind(targetPosition[2] / MathUtils.norm(targetPosition))
        ];

    }

    /**
     * Compute airless apparent azimuth and elevation with respect to the observer. Corrected 
     * for light-time, aberration, precession and nutation.
     * 
     * @param {TargetResults} results
     *      Target results.
     * @param {ObserverInfo} observerInfo
     *      Observer info.
     * @param {FrameConversions} frameConversions
     *      Frame conversions. 
     * @returns {number[]} Array of right ascension and declination in degrees with the ranges 
     * [0, 360] and [-90, 90], respectively.
     */
    static computeAzElAirless(results : TargetResults, observerInfo : ObserverInfo, frameConversions : FrameConversions) : 
    number[] {
        let observer : StateVector = observerInfo.state;
        observer = frameConversions.rotateTo(observer, FrameOrientation.ENU);
        const target : StateVector = <StateVector>results.stateMapAberrationRel.get(observer.frameCenter)
            ?.get(FrameOrientation.ENU);

        const targetPosition : number[] = MathUtils.vecDiff(target.position, observer.position);
        return [
            Angles.limitAngleDeg(MathUtils.atan2d(targetPosition[0], targetPosition[1])),
            MathUtils.asind(targetPosition[2] / MathUtils.norm(targetPosition))
        ];

    }
}