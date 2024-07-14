
import { FrameCenter, FrameConversions, FrameOrientation } from "./Frames";
import { StateVector } from "./StateVector";
import { TimeStamp } from "./TimeStamp";
import { Target } from "./Configuration/TargetConf";
import { ObserverInfo } from "./Configuration/ObserverConf";
import { MathUtils } from "./MathUtils";
import { Angles } from "./Angles";
import { EopParams, SolarParams } from "./EopParams";
import { ComputationInfo } from "./Configuration/ComputationConf";
import { EarthPosition } from "./Wgs84";

/**
 * 
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
 * Observer table compatible with JPL Horizons.
 */
export interface ObserverTable {
    // Astrometric right ascension and declination with respect to the observer (deg). 
    // Includes only correction for light-time.
    raDeclAstrometric : number[];

    // Airless apparent right ascension and declination with respect to the observer (deg). 
    // Corrected for light-time, aberration, precession, nutation and polar motion.
    raDeclApparent : number[];

    // Rates of airless apparent right ascension and declination (arcseconds per hour).
    // dRA/dt is multiplied by the cosine of declination to obtain a linear rate. 
    raDeclRates : number[];

    // Airless apparent azimuth and elevation with respect to the observer (deg). 
    // Corrected for light-time, aberration, precession, nutation and polar motion.
    azElApparent : number[];
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
    // Computation info.
    computationInfo : ComputationInfo;

    /**
     * Public constructor.
     * 
     * @param {ComputationInfo} computationInfo 
     *      Computation info.
     */
    constructor(computationInfo : ComputationInfo, eopParams : EopParams, 
        solarParams : SolarParams) {
        this.computationInfo = computationInfo;
    }

    /**
     * Compute astrometric right ascension and declination with respect to the observer. 
     * Includes only correction for light-time.
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
     * Compute airless apparent right ascension and declination with respect to the observer. 
     * Corrected for light-time, aberration, precession and nutation.
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
     * Compute airless apparent right ascension declination rates with respect to the 
     * observer. Corrected for light-time, aberration, precession and nutation.
     * 
     * @param {TargetResults} results
     *      Target results.
     * @param {ObserverInfo} observerInfo
     *      Observer info.
     * @param {FrameConversions} frameConversions
     *      Frame conversions. 
     * @returns {number[]} Array of right ascension and declination rates (arcsec/hour).
     */
    static computeRaDeclRate(results : TargetResults, observerInfo : ObserverInfo, frameConversions : FrameConversions) : 
    number[] {
        let observer : StateVector = observerInfo.state;
        observer = frameConversions.rotateTo(observer, FrameOrientation.TOD);
        const target : StateVector = <StateVector>results.stateMapAberrationRel.get(observer.frameCenter)
            ?.get(FrameOrientation.TOD);

        const targetPosition : number[] = MathUtils.vecDiff(target.position, observer.position);
        const targetVelocity : number[] = MathUtils.vecDiff(target.velocity, observer.velocity);
        const targetDistance = MathUtils.norm(targetPosition);
        console.log("vel " + MathUtils.norm(targetVelocity) + " " + targetDistance);

        const RA = Angles.limitAngleDeg(MathUtils.atan2d(targetPosition[1], targetPosition[0]));
        const decl = MathUtils.asind(targetPosition[2] / MathUtils.norm(targetPosition));


        // x = r cos(DE) cos(RA) 
        // y = r cos(DE) sin(RA) 
        // z = r sin(DE)
        // dx/dDE = -r sin(DE) cos(RA), dx/dRA = - r cos(DE) sin(RA)
        // dy/dDE = -r sin(DE) sin(RA), dy/dRA =   r cos(DE) cos(RA)
        // dz/dDE =  r cos(DE)        , dz/dRA =   0

        const unitDe : number[] = [
            - MathUtils.sind(decl) * MathUtils.cosd(RA),
            - MathUtils.sind(decl) * MathUtils.sind(RA),
              MathUtils.cosd(decl)
        ];
        const unitRa : number[] = [
            - MathUtils.cosd(decl) * MathUtils.sind(RA),
              MathUtils.cosd(decl) * MathUtils.cosd(RA),
              0
        ];
        // Velocity on the unit sphere (deg / s) = (arcsec / hour).
        const velUnit = MathUtils.vecMul(targetVelocity, 
            (3600 * 3600 * 180 / Math.PI) / targetDistance);

        return [
            MathUtils.dot(velUnit, unitRa) / MathUtils.cosd(decl),
            MathUtils.dot(velUnit, unitDe)
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