
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
import { Rotations } from "./Rotations";

/**
 * 
 * Computation results for single target for a single time step.
 */
export interface TargetResults {
    // Target 
    target : Target;

    // Map that associates a state vector to each pair (FrameCenter, FrameOrientation).
    // The positions and velocities are raw without any corrections of any kind.
    stateMapRaw : Map<FrameCenter, Map<FrameOrientation, StateVector>>;

    // State map with positions and velocities corrected for light time.
    stateMapLightTime : Map<FrameCenter, Map<FrameOrientation, StateVector>>;

    // State map with positions and velocities corrected for light time, gravitational 
    // deflection and aberration.
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
    // 1. Astrometric right ascension and declination with respect to the observer (deg). 
    // Includes only correction for light-time.
    raDeclAstrometric : number[];

    // 2. Airless apparent right ascension and declination with respect to the observer (deg). 
    // Corrected for light-time, aberration, precession, nutation and polar motion.
    raDeclApparent : number[];

    // 3. Rates of airless apparent right ascension and declination (arcseconds per hour).
    // dRA/dt is multiplied by the cosine of declination to obtain a linear rate. 
    raDeclRates : number[];

    // 4. Airless apparent azimuth and elevation with respect to the observer (deg). 
    // Corrected for light-time, aberration, precession, nutation and polar motion.
    azElApparent : number[];

    // 5. Rates of airless apparent azimuth and elevation with respect to the observer 
    // (arcseconds per minute).Corrected for light-time, aberration, precession, nutation 
    //and polar motion.
    azElRates : number[];

    // TODO: Satellite apparent differential coordinates.

    // 7. Local Apparent Sidereal Time (decimal hours).
    localGast : number;

    // 8. Airmass & extinction

    // 9. Visual mag. & Surface Brght

    // 10. Illuminated fraction
    illuminatedFraction : number,

    // 11. Defect of illumination.

    // 12. Satellite angular separ/vis.

    // 13. Target angular equatorial diameter, if fully illuminated (arcseconds).
    angularDiam : number;

    // 14. Obserer sub-lon & sub-latitude.
    // TODO
    obsSubLonLat : number[],

    // 15. Sun sub-longitude & sub-latitude.

    // 16. Sub-Sun position angle & distance.

    // 17. North Pole position angle & distance.

    // 18. Heliocentric longitude and latitude of the target center. Corrected for light-time
    // (degrees).
    helLonLat : number[]

    // 19. Sun's apparent range and range rate. Corrected for light-time (au and km/s).
    rRdot : number[],

    // 20. Apparent range and range rate of the target center and the observer (au and km/s).
    deltaDeltaDot : number[];

    // 21. One-way down-leg light-time from the target center to the observer (minutes).
    lightTimeMinutes : number;

    // 22. Speed wrt Sun & observer

    // 23. Elongation angle Sun-Observer-Target. 
    elongationSot : number;

    // 24. Elongation angle Sun-Target-Observer. 
    elongationSto : number;

    // 25. Target-Observer-Moon angle/ Illum%

    // 26. Observer-Primary Target angle.

    // 27. Sun-Target radial & -vel pos. angle.

    // 28. Orbit plane angle.

    // 29. Constellation ID.

    // 30. The difference between TDB and UTC timestamps (seconds).
    tdbUtcDiff : number;

    // 31. Observer ecliptic lon. & lat.
    observerEclLonLat : number[],

    // 32. North pole RA & DEC

    // 33. Galactic longitude and latitude. Observer-centered.
    galacticLonLat : number[];

    // 34. Local apparent solar time.

    // 35. Earth->obs. site light-time.

    // 36 - 40: Errors

    // 41. Heliocentric true anomaly (degrees). Corrected for light-time.
    trueAnom : number;

    // 42. Local apparent hour angle (degrees).
    localAppHourAngle : number;

    // 43. Phase angle & bisector.
    phi : number;

    // 44. Apparent longitude Sun (L_s)

    // 45. Inertial apparent RA & DEC
    raDeclInertialApp : number[];

    // 46. Rate: Inertial RA / DEC
    raDeclInertialRate : number[];

    // 47. Sky motion: rate & angles.

    // 48. Lunar sky-brightness & sky SNR.
};

/**
 * Results for a target.
 */
export interface TimeStepResults {
    // Time stamp associated to the results.
    timeStamp : TimeStamp;

    // Target info.
    targets : Target[];

    // Basic results for each target.
    results : TargetResults[];

    // Observer table for each target.
    observerTables? : ObserverTable[];

    // Earth orientation parameters.
    eopParams : EopParams;
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
     * @param {ObserverInfo} observerInfo
     *      Observer info.
     * @param {FrameConversions} frameConversions
     *      Frame conversions.
     * @returns {number[]} Sun-Observer-Target elongation in degrees.
     */
    static computeElongationSot(results : TargetResults, observerInfo : ObserverInfo, 
        frameConversions : FrameConversions) : 
    number {
        let stateVectorTarget : StateVector = <StateVector> results.stateMapLightTime
            .get(observerInfo.state.frameCenter)
            ?.get(observerInfo.state.frameOrientation);

        // TBD: Light-time corrections?
        let stateVectorSun : StateVector = {
            frameCenter : FrameCenter.HELIOCENTER,
            frameOrientation : observerInfo.state.frameOrientation,
            position : [0, 0, 0],
            velocity : [0, 0, 0],
            timeStamp : stateVectorTarget.timeStamp
        };
        stateVectorSun = frameConversions.translateTo(stateVectorSun, observerInfo.state.frameCenter);

        let stateVectorObserver : StateVector = observerInfo.state;

        const posSun : number[] = MathUtils.normalize(
            MathUtils.vecDiff(stateVectorSun.position, stateVectorObserver.position));
        const posTarget : number[] = MathUtils.normalize(
            MathUtils.vecDiff(stateVectorTarget.position, stateVectorObserver.position));

        return MathUtils.acosd(MathUtils.dot(posSun, posTarget));
    }

    /**
     * Compute elongation angle Sun-Target-Observer.
     * 
     * @param {TargetResults} results
     *      Target results.
     * @param {ObserverInfo} observerInfo
     *      Observer info.
     * @param {FrameConversions} frameConversions
     *      Frame conversions. 
     * @returns {number[]} Sun-Target-Observer elongation in degrees.
     */
    static computeElongationSto(results : TargetResults, observerInfo : ObserverInfo, 
        frameConversions : FrameConversions) : 
    number {
        let stateVectorTarget : StateVector = <StateVector> results.stateMapLightTime
            .get(observerInfo.state.frameCenter)
            ?.get(observerInfo.state.frameOrientation);

        // TBD: Light-time corrections?
        let stateVectorSun : StateVector = {
            frameCenter : FrameCenter.HELIOCENTER,
            frameOrientation : observerInfo.state.frameOrientation,
            position : [0, 0, 0],
            velocity : [0, 0, 0],
            timeStamp : stateVectorTarget.timeStamp
        };
        stateVectorSun = frameConversions.translateTo(stateVectorSun, observerInfo.state.frameCenter);

        let stateVectorObserver : StateVector = observerInfo.state;

        const posSun : number[] = MathUtils.normalize(
            MathUtils.vecDiff(stateVectorSun.position, stateVectorTarget.position));
        const posObs : number[] = MathUtils.normalize(
            MathUtils.vecDiff(stateVectorObserver.position, stateVectorTarget.position));

        return MathUtils.acosd(MathUtils.dot(posSun, posObs));
    }

    /**
     * Compute Heliocentric true anomaly.
     * 
     * @param {TargetResults} results
     *      Target results.
     * @returns {number} Heliocentric true anomaly (degrees).
     */
    static computeTrueAnomaly(results : TargetResults) : number {
        const incl_min = 1e-7;

        const r : number[] = (<StateVector> results.stateMapLightTime.get(FrameCenter.HELIOCENTER)?.get(FrameOrientation.J2000_EQ)
            )?.position;
        const v : number[] = (<StateVector> results.stateMapLightTime.get(FrameCenter.HELIOCENTER)?.get(FrameOrientation.J2000_EQ)
            )?.velocity;

        // Standard gravitational parameter for Sun (m^3/s^2).
        const mu = 1.32712440018e20;

        const kepler = {};
    
        // Angular momentum per unit mass.
        const k = MathUtils.cross(r, v);
        // Eccentricity vector.
        const ecc = MathUtils.vecDiff(
            MathUtils.vecMul(MathUtils.cross(v, k), 1 / mu), MathUtils.vecMul(r, 1/MathUtils.norm(r)));
        const ecc_norm = MathUtils.norm(ecc);
        
        // Inclination
        const incl = MathUtils.acosd(k[2] / MathUtils.norm(k));
        
        // Energy integral.
        const h = 0.5 * MathUtils.norm(v) * MathUtils.norm(v) - mu / MathUtils.norm(r);
        
        // Semi-major axis.
        const a = -mu / (2 * h);
        const b = a * Math.sqrt(1 - ecc_norm * ecc_norm);
        
        // Longitude of the ascending node.
        const Omega = MathUtils.atan2d(k[0], -k[1]);
        
        // Argument of periapsis.
        let omega = 0;
    
        // When inclination is close to zero, we wish to compute the argument of periapsis
        // on the XY-plane and avoid division by zero:
        if (incl < incl_min)
        {
            omega = MathUtils.atan2d(ecc[1], ecc[0]) - Omega;
        }
        else
        {
            // We wish to avoid division by zero and thus use the formula, which has larger
            // absolute value for the denominator:
            if (Math.abs(MathUtils.sind(Omega)) < Math.abs(MathUtils.cosd(Omega)))
            {
                const asc_y = ecc[2] / MathUtils.sind(incl);
                const asc_x = (1 / MathUtils.cosd(Omega)) * (ecc[0] 
                            + MathUtils.sind(Omega) * MathUtils.cosd(incl) * ecc[2] / MathUtils.sind(incl));
        
                omega = MathUtils.atan2d(asc_y, asc_x);
            }
            else
            {
                const asc_y = ecc[2] / MathUtils.sind(incl);
                const asc_x = (1 / MathUtils.sind(Omega)) * (ecc[1] 
                            - MathUtils.cosd(Omega) * MathUtils.cosd(incl) * ecc[2] / MathUtils.sind(incl));
        
                omega = MathUtils.atan2d(asc_y, asc_x)
            }
        }
        
        // Eccentric anomaly
        const r_orbital = Rotations.rotateCart3d(Rotations.rotateCart1d(
            Rotations.rotateCart3d(r, Omega), incl), omega);
        const E = MathUtils.atan2d(r_orbital[1] / b, r_orbital[0] / a + ecc_norm);
    
        // Mean anomaly
        const M = E - (180/Math.PI) * ecc_norm * MathUtils.sind(E);
        
        // Natural anomaly
        const xu = (MathUtils.cosd(E) - ecc_norm) / (1 - ecc_norm * MathUtils.cosd(E));
        const yu = Math.sqrt(1 - ecc_norm * ecc_norm) * MathUtils.sind(E) / (1 - ecc_norm * MathUtils.cosd(E));
        
        const f = Angles.limitAngleDeg(MathUtils.atan2d(yu, xu));
        return f;
    }

    /**
     * Compute local apparent hour angle of the target.
     * 
     * @param {TargetResults} results
     *      Target results.
     * @param {ObserverInfo} observerInfo
     *      Observer info.
     * @param {FrameConversions} frameConversions
     *      Frame conversions. 
     * @returns {number} Local apparent hour angle.
     */
    static computeLocalAppHourAngle(results : TargetResults, observerInfo : ObserverInfo, 
        frameConversions : FrameConversions) : number {
        let stateVectorTarget : StateVector = <StateVector> results.stateMapAberrationRel
            .get(FrameCenter.BODY_CENTER)
            ?.get(FrameOrientation.EFI);
        const earthPosTarget : EarthPosition = Wgs84.coordEfiWgs84(stateVectorTarget.position, 
            10, 1e-10, false);

        return Angles.limitAngleDeg180((<EarthPosition> observerInfo.earthPos).lon - earthPosTarget.lon) / 15;
    }

    /**
     * Compute phase angle.
     * 
     * @param {TargetResults} results
     *      Target results.
     * @param {ObserverInfo} observerInfo
     *      Observer info.
     * @param {FrameConversions} frameConversions
     *      Frame conversions. 
     * @returns {number[]} Phase angle in degrees.
     */
    static computePhase(results : TargetResults, observerInfo : ObserverInfo, 
        frameConversions : FrameConversions) : 
    number {
        let stateVectorTarget : StateVector = <StateVector> results.stateMapAberrationRel
            .get(observerInfo.state.frameCenter)
            ?.get(observerInfo.state.frameOrientation);

        // TBD: Light-time corrections?
        let stateVectorSun : StateVector = {
            frameCenter : FrameCenter.HELIOCENTER,
            frameOrientation : observerInfo.state.frameOrientation,
            position : [0, 0, 0],
            velocity : [0, 0, 0],
            timeStamp : stateVectorTarget.timeStamp
        };
        stateVectorSun = frameConversions.translateTo(stateVectorSun, observerInfo.state.frameCenter);

        let stateVectorObserver : StateVector = observerInfo.state;

        const posSun : number[] = MathUtils.normalize(
            MathUtils.vecDiff(stateVectorSun.position, stateVectorTarget.position));
        const posObs : number[] = MathUtils.normalize(
            MathUtils.vecDiff(stateVectorObserver.position, stateVectorTarget.position));

        return MathUtils.acosd(MathUtils.dot(posSun, posObs));
    }

    /**
     * Compute illuminated fraction.
     * 
     * @param {TargetResults} results
     *      Target results.
     * @param {ObserverInfo} observerInfo
     *      Observer info.
     * @param {FrameConversions} frameConversions
     *      Frame conversions. 
     * @returns {number[]} Illuminated fraction.
     */
    static computeIlluminatedFrac(results : TargetResults, observerInfo : ObserverInfo, 
        frameConversions : FrameConversions) : 
    number {
        const phaseAngle : number  = PostProcessing.computePhase(results, observerInfo, 
            frameConversions);
        return  0.5 * (1.0 + MathUtils.cosd(phaseAngle));
    }


    /**
     * Compute equatorial angular diameter of the target body.
     * 
     * @param {TargetResults} results
     *      Target results.
     * @param {ObserverInfo} observerInfo
     *      Observer info.
     * @param {FrameConversions} frameConversions
     *      Frame conversions. 
     * @returns {number[]} Angular diameter (degrees).
     */
    static computeAngularDiam(results : TargetResults, observerInfo : ObserverInfo, 
        frameConversions : FrameConversions) : number {
        const stateVector : StateVector = <StateVector> results.stateMapAberrationRel
            .get(observerInfo.state.frameCenter)
            ?.get(observerInfo.state.frameOrientation);

        const distance : number = MathUtils.norm(MathUtils.vecDiff(
            stateVector.position, observerInfo.state.position
        ));
        if (results.target.metadata === undefined) {
            return NaN;
        } else {
            return 2.0 * MathUtils.atand(results.target.metadata.eqRadius / distance);
        }
    }

    /**
     * Compute observer ecliptic longitude and latitude.
     * 
     * @param {TargetResults} results
     *      Target results.
     * @param {ObserverInfo} observerInfo
     *      Observer info.
     * @param {FrameConversions} frameConversions
     *      Frame conversions. 
     * @returns {number[]} Observer ecliptic longitude and latitude (degrees).
     */
    static computeObserverEclLonLat(results : TargetResults, observerInfo : ObserverInfo, 
        frameConversions : FrameConversions) : number[] {
        let stateVector : StateVector = <StateVector> results.stateMapAberrationRel
            .get(observerInfo.state.frameCenter)
            ?.get(FrameOrientation.TOD);

        // We need ecliptic of date, which is not one of the frames in FrameConversions.
        stateVector = FrameConversions.rotateEqEcl(stateVector);

        //let stateVectorObs = frameConversions.translateTo(observerInfo.state, FrameCenter.HELIOCENTER);
        let pos : number [] = stateVector.position;

        return [
            Angles.limitAngleDeg(MathUtils.atan2d(pos[1], pos[0])),
            MathUtils.asind(pos[2] / MathUtils.norm(pos))
        ];
    }

    /**
     * Compute astrometric right ascension and declination with respect to the observer. 
     * Includes only correction for light-time and aberration.
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
    static computeRaDeclInertial(results : TargetResults, observerInfo : ObserverInfo, frameConversions : FrameConversions) : 
    number[] {
        let observer : StateVector = observerInfo.state;
        observer = frameConversions.rotateTo(observer, FrameOrientation.J2000_EQ);
        const target : StateVector = <StateVector>results.stateMapAberrationRel.get(observer.frameCenter)
            ?.get(FrameOrientation.J2000_EQ);

        const targetPosition : number[] = MathUtils.vecDiff(target.position, observer.position);
        return [
            Angles.limitAngleDeg(MathUtils.atan2d(targetPosition[1], targetPosition[0])),
            MathUtils.asind(targetPosition[2] / MathUtils.norm(targetPosition))
        ];
    }

    /**
     * Compute astrometric right ascension and declination with respect to the observer. 
     * Includes only correction for light-time and aberration.
     * 
     * @param {TargetResults} results
     *      Target results.
     * @param {ObserverInfo} observerInfo
     *      Observer info.
     * @param {FrameConversions} frameConversions
     *      Frame conversions. 
     * @returns {number[]} Array of right ascension and declination rates (arcsec/hour).
     */
    static computeRaDeclInertialRate(results : TargetResults, observerInfo : ObserverInfo, frameConversions : FrameConversions) : 
    number[] {
        let observer : StateVector = observerInfo.state;
        observer = frameConversions.rotateTo(observer, FrameOrientation.J2000_EQ);
        const target : StateVector = <StateVector>results.stateMapAberrationRel.get(observer.frameCenter)
            ?.get(FrameOrientation.J2000_EQ);

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
     * Compute observer-centered galactic longitude and latitude.
     * 
     * @param {TargetResults} results
     *      Target results.
     * @param {ObserverInfo} observerInfo
     *      Observer info.
     * @returns {number[]} Galactic longitude and latitude in degrees with the ranges 
     * [0, 360] and [-90, 90], respectively.
     */
    static computeGalLonLat(results : TargetResults, observerInfo : ObserverInfo, frameConversions : FrameConversions) : 
    number[] {
        let observer : StateVector = observerInfo.state;
        observer = frameConversions.rotateTo(observer, FrameOrientation.GALACTIC);
        let target : StateVector = <StateVector>results.stateMapAberrationRel.get(observer.frameCenter)
            ?.get(FrameOrientation.J2000_EQ);
        target = FrameConversions.rotateJ2000Gal(target);

        const targetPosition : number[] = MathUtils.vecDiff(target.position, observer.position);
        return [
            Angles.limitAngleDeg(MathUtils.atan2d(targetPosition[1], targetPosition[0])),
            MathUtils.asind(targetPosition[2] / MathUtils.norm(targetPosition))
        ];
    }
}