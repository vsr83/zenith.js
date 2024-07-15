
import { FrameCenter, FrameConversions, FrameOrientation } from "./Frames";
import { StateVector } from "./StateVector";
import { TimeStamp } from "./TimeStamp";
import { Target } from "./Configuration/TargetConf";
import { ObserverInfo } from "./Configuration/ObserverConf";
import { MathUtils } from "./MathUtils";
import { Angles } from "./Angles";
import { EopParams, SolarParams } from "./EopParams";
import { ComputationInfo } from "./Configuration/ComputationConf";
import { Wgs84, EarthPosition } from "./Wgs84";
import { constants } from "./SSIE/Constants";

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

    // One-way down-leg light-time from the target center to the observer (days).
    lightTimeDays : number;
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

    // Rates of airless apparent azimuth and elevation with respect to the observer 
    // (arcseconds per minute).Corrected for light-time, aberration, precession, nutation 
    //and polar motion.
    azElRates : number[];

    // TODO: Satellite apparent differential coordinates.

    // Local Apparent Sidereal Time (decimal hours).
    localGast : number;

    // One-way down-leg light-time from the target center to the observer (minutes).
    lightTimeMinutes : number;

    // The difference between TDB and UTC timestamps (seconds).
    tdbUtcDiff : number;

    // TODO
    obsSubLonLat : number[],

    // Heliocentric longitude and latitude of the target center. Corrected for light-time
    // (degrees).
    helLonLat : number[]

    // Sun's apparent range and range rate. Corrected for light-time (au and km/s).
    rRdot : number[],

    // Apparent range and range rate of the target center and the observer (au and km/s).
    deltaDeltaDot : number[];

    // Elongation angle Sun-Observer-Target. 
    elongationSot : number;
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
        // Velocity on the unit sphere (deg / s) = 3600 * 3600 (arcsec / hour).
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

    /**
     * Compute airless apparent azimuth and elevation rates with respect to the observer. 
     * Corrected for light-time, aberration, precession and nutation.
     * 
     * @param {TargetResults} results
     *      Target results.
     * @param {ObserverInfo} observerInfo
     *      Observer info.
     * @param {FrameConversions} frameConversions
     *      Frame conversions. 
     * @returns {number[]} Array of right ascension and declination rates in degrees with the ranges 
     * [0, 360] and [-90, 90], respectively.
     */
    static computeAzElRates(results : TargetResults, observerInfo : ObserverInfo, frameConversions : FrameConversions) : 
    number[] {
        let observer : StateVector = observerInfo.state;
        observer = frameConversions.rotateTo(observer, FrameOrientation.ENU);
        const target : StateVector = <StateVector>results.stateMapAberrationRel.get(observer.frameCenter)
            ?.get(FrameOrientation.ENU);

        const targetPosition : number[] = MathUtils.vecDiff(target.position, observer.position);
        const targetVelocity : number[] = MathUtils.vecDiff(target.velocity, observer.velocity);
        const targetDistance = MathUtils.norm(targetPosition);

        const az = Angles.limitAngleDeg(MathUtils.atan2d(targetPosition[0], targetPosition[1]));
        const el = MathUtils.asind(targetPosition[2] / MathUtils.norm(targetPosition));

        // x = r cos(el) sin(az) 
        // y = r cos(el) cos(az) 
        // z = r sin(el)
        // dx/del = -r sin(el) sin(az), dx/daz =   r cos(DE) cos(RA)
        // dy/del = -r sin(el) cos(az), dy/daz = - r cos(DE) sin(RA)
        // dz/del =  r cos(el)        , dz/daz =   0

        const unitEl : number[] = [
            - MathUtils.sind(el) * MathUtils.sind(az),
            - MathUtils.sind(el) * MathUtils.cosd(az),
              MathUtils.cosd(el)
        ];
        const unitAz : number[] = [
              MathUtils.cosd(el) * MathUtils.cosd(az),
            - MathUtils.cosd(el) * MathUtils.sind(az),
              0
        ];
        // Velocity on the unit sphere (deg / s) = 60 * 3600 (arcsec / minute).
        const velUnit = MathUtils.vecMul(targetVelocity, 
            (60 * 3600 * 180 / Math.PI) / targetDistance);

        return [
            MathUtils.dot(velUnit, unitAz) / MathUtils.cosd(el),
            MathUtils.dot(velUnit, unitEl)
        ];
    }

    /**
     * Compute local GAST.
     * 
     * @param {EopParams} eopParams 
     *      Earth Orientation Parameters.
     * @param {ObserverInfo} observerInfo
     *      Observer info. 
     * @returns {number} The local GAST.
     */
    static computeLocalGast(eopParams : EopParams, observerInfo : ObserverInfo) : number {
        return Angles.limitAngleDeg(eopParams.GAST + <number> observerInfo.earthPos?.lon) / 15.0;
    }

    /**
     * Compute apparent planetodetic longitude and latitude of the center of the target disc
     * seen by the observer.
     * 
     * @param {TargetResults} results
     *      Target results.
     * @param {ObserverInfo} observerInfo
     *      Observer info.
     * @param {FrameConversions} frameConversions
     *      Frame conversions. 
     * @returns {number[]} Array of right ascension and declination rates in degrees with the ranges 
     * [0, 360] and [-90, 90], respectively.
     */
    static computeObsSub(results : TargetResults, observerInfo : ObserverInfo, frameConversions : FrameConversions) : 
    number[] {
        let observer : StateVector = observerInfo.state;

        // TODO.
        return [
            0.0, 0.0
        ];
    }

    /**
     * Compute heliocentric longitude and latitude of the target (degrees). Corrected for 
     * light-time.
     * 
     * @param {TargetResults} results
     *      Target results.
     * @returns {number[]} Longitude and latitude in the ranges [0, 360] and [-90, 90], respectively.
     */
    static computeHelLonLat(results : TargetResults) : 
    number[] {
        let stateVector : StateVector = <StateVector> results.stateMapLightTime
            .get(FrameCenter.HELIOCENTER)
            ?.get(FrameOrientation.J2000_ECL);
        const pos : number[] = stateVector.position;

        return [
            Angles.limitAngleDeg(MathUtils.atan2d(pos[1], pos[0])),
            MathUtils.asind(pos[2] / MathUtils.norm(pos))
        ];
    }

    /**
     * Compute distance from target center to the center of the Sun and time-derivative of the range 
     * (au, km/s). Corrected for light-time.
     * 
     * @param {TargetResults} results
     *      Target results.
     * @returns {number[]} Distance from the target to the center of the Sun (au) and 
     *      the rate of the change of distance (km/s).
     */
    static computeRrDot(results : TargetResults) : 
    number[] {
        let stateVector : StateVector = <StateVector> results.stateMapLightTime
            .get(FrameCenter.HELIOCENTER)
            ?.get(FrameOrientation.J2000_EQ);

        const auMeters = constants.au * 1000.0;
        const rMeters = MathUtils.norm(stateVector.position);
        const r : number = rMeters / auMeters;
        const rDot : number = MathUtils.dot(stateVector.position, stateVector.velocity)
                            / (1000.0 * rMeters);

        return [r, rDot];
    }

    /**
     * Compute distance from target center to the observer and time-derivative of the range 
     * (au, km/s). Corrected for light-time.
     * 
     * @param {TargetResults} results
     *      Target results.
     * @returns {number[]} Distance from the target center to the observer (au) and 
     *      the rate of the change of distance (km/s).
     */
    static computeDeltaDeltaDot(results : TargetResults, observerInfo : ObserverInfo) : 
    number[] {
        let stateVectorTarget : StateVector = <StateVector> results.stateMapLightTime
            .get(observerInfo.state.frameCenter)
            ?.get(observerInfo.state.frameOrientation);
        let stateVectorObserver : StateVector = observerInfo.state;

        const auMeters = constants.au * 1000.0;
        const position : number[] = MathUtils.vecDiff(stateVectorTarget.position,
            stateVectorObserver.position);
        const velocity : number[] = MathUtils.vecDiff(stateVectorTarget.velocity,
            stateVectorObserver.velocity);
        const rMeters = MathUtils.norm(position);
        const delta : number = rMeters / auMeters;
        const deltaDot : number = MathUtils.dot(position, velocity)
                            / (1000.0 * rMeters);

        return [delta, deltaDot];
    }

    /**
     * Compute elongation angle Sun-Observer-Target.
     * 
     * @param {TargetResults} results
     *      Target results.
     * @returns {number[]} Distance from the target center to the observer (au) and 
     *      the rate of the change of distance (km/s).
     */
    static computeElongationSot(results : TargetResults, observerInfo : ObserverInfo) : 
    number[] {
        let stateVectorTarget : StateVector = <StateVector> results.stateMapLightTime
            .get(observerInfo.state.frameCenter)
            ?.get(observerInfo.state.frameOrientation);
        let stateVectorObserver : StateVector = observerInfo.state;

        const auMeters = constants.au * 1000.0;
        const position : number[] = MathUtils.vecDiff(stateVectorTarget.position,
            stateVectorObserver.position);
        const velocity : number[] = MathUtils.vecDiff(stateVectorTarget.velocity,
            stateVectorObserver.velocity);
        const rMeters = MathUtils.norm(position);
        const delta : number = rMeters / auMeters;
        const deltaDot : number = MathUtils.dot(position, velocity)
                            / (1000.0 * rMeters);

        return [delta, deltaDot];
    }
}