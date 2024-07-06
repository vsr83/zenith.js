import { TimeStamp } from "./TimeStamp";
import { NutationData, Nutation } from "./Nutation";
import { TimeConvention, TimeCorrelation } from "./TimeCorrelation";
import { SiderealTime } from "./SiderealTime";
import { StateVector } from ".";
import { IntegrationState } from "./SSIE/Integration";
import { PointMass } from "./SSIE/PointMass";
import { constants } from "./SSIE/Constants";
import { MathUtils } from "./MathUtils";
import { FrameCenter, FrameOrientation } from "./Frames";

/**
 * Earth-Orientation Parameters.
 */
export interface EopParams {
    // UT1 timestamp for Earth rotation.
    timeStampUt1 : TimeStamp;
    // TDB timestamp for precession.
    timeStampTdb : TimeStamp;
    // Polar motion parameter (degrees).
    polarDx : number;
    // Polar motion parameter (degrees).
    polarDy : number;
    // Nutation parameters (degrees).
    nutationParams : NutationData;
    // Greenwich Mean Sidereal Time (degrees).
    GMST : number;
    // Greenwich Apparent Sidereal Time (degrees).
    GAST : number;
}

/**
 * Solar system parameters.
 */
export interface SolarParams {
    // State of the Solar System Barycenter (SSB) in Heliocentric frame.
    ssbState : StateVector;
    // State of the Earth geocenter.
    geoState : StateVector;
    // State of the Moon.
    moonState : StateVector;
    // State of the Earth-Moon Barycenter (EMB) in Heliocentric frame.
    embState : StateVector;    
}

/**
 * Class with static methods for the computation of EOP.
 */
export class EopComputation {

    /**
     * Compute Solar System parameters.
     * 
     * @param {TimeStamp} timeStamp
     *      Time stamp. 
     * @param {IntegrationState} solarState 
     *      Integration state.
     * @returns {SolarParams} Solar system parameters.
     */
    static computeSolarData(timeStamp : TimeStamp , solarState : IntegrationState) : SolarParams {
        // To create Heliocentric positions, we need to compute the difference to the position and
        // velocity of the Sun and transform the units to m and m/s.
        const secondsPerDay = 86400.0;
        const auMeters = constants.au * 1000.0;

        const ssbOsv = PointMass.barycenter(solarState.pointMasses, true);
        const sunPointMass : PointMass = solarState.pointMasses[0];

        const ssbPos : number[] = MathUtils.vecMul(
            MathUtils.vecDiff(ssbOsv.r, solarState.pointMasses[0].r), auMeters);
        const ssbVel : number[] = MathUtils.vecMul(
            MathUtils.vecDiff(ssbOsv.v, solarState.pointMasses[0].v), auMeters / secondsPerDay);
        const geoPos : number[] = MathUtils.vecMul(
            MathUtils.vecDiff(solarState.pointMasses[3].r, solarState.pointMasses[0].r), auMeters);
        const geoVel : number[] = MathUtils.vecMul(
            MathUtils.vecDiff(solarState.pointMasses[3].v, solarState.pointMasses[0].v), auMeters / secondsPerDay);
        const moonPos : number[] = MathUtils.vecMul(
            MathUtils.vecDiff(solarState.pointMasses[4].r, solarState.pointMasses[0].r), auMeters);
        const moonVel : number[] = MathUtils.vecMul(
            MathUtils.vecDiff(solarState.pointMasses[4].v, solarState.pointMasses[0].v), auMeters / secondsPerDay);
        
        const ssbState : StateVector = {
            frameCenter : FrameCenter.HELIOCENTER,
            frameOrientation : FrameOrientation.J2000_EQ,
            position : ssbPos, 
            velocity : ssbVel,
            timeStamp : timeStamp
        };
        const geoState : StateVector = {
            frameCenter : FrameCenter.HELIOCENTER,
            frameOrientation : FrameOrientation.J2000_EQ,
            position : geoPos, 
            velocity : geoVel,
            timeStamp : timeStamp
        };
        const moonState : StateVector = {
            frameCenter : FrameCenter.HELIOCENTER,
            frameOrientation : FrameOrientation.J2000_EQ,
            position : moonPos, 
            velocity : moonVel,
            timeStamp : timeStamp
        };

        const muMoon = solarState.pointMasses[4].mu;
        const muEarth = solarState.pointMasses[3].mu;
        const embPos : number[] = MathUtils.linComb(
            [muEarth / (muMoon + muEarth), muMoon / (muMoon + muEarth)], 
            [geoState.position, moonState.position]
        );
        const embVel : number[] = MathUtils.linComb(
            [muEarth / (muMoon + muEarth), muMoon / (muMoon + muEarth)], 
            [geoState.velocity, moonState.velocity]
        );

        const embState : StateVector = {
            frameCenter : FrameCenter.HELIOCENTER,
            frameOrientation : FrameOrientation.J2000_EQ,
            position : embPos, 
            velocity : embVel,
            timeStamp : timeStamp
        };

        return {
            ssbState : ssbState,
            geoState : geoState,
            embState : embState,
            moonState : moonState
        };
    }

    /**
     * Compute Earth Orientation Parameters (EOP).
     * 
     * @param {TimeStamp} timeStamp 
     *      Time stamp.
     * @param {TimeCorrelation} timeCorrelation
     *      Time correlation.
     * @returns {EopParams} The EOP for given time step.
     */
    static computeEopData(timeStamp : TimeStamp, timeCorrelation : TimeCorrelation) 
        : EopParams {
        // Perform time correlation.
        const timeStampUt1 : TimeStamp = timeStamp.changeTo(timeCorrelation, 
            timeStamp.getFormat(), TimeConvention.TIME_UT1);
        const timeStampTdb : TimeStamp = timeStamp.changeTo(timeCorrelation, 
            timeStamp.getFormat(), TimeConvention.TIME_TDB);

        // Compute polar motion (TODO).
        const polarDx : number = 0;
        const polarDy : number = 0;

        // Compute nutation params:
        const nutParams : NutationData = Nutation.iau1980(timeStampTdb.getJulian());

        // Compute sidereal time:
        const GMST = SiderealTime.timeGmst(timeStampUt1.getJulian(), timeStampTdb.getJulian());
        const GAST = SiderealTime.timeGast(timeStampUt1.getJulian(), timeStampTdb.getJulian(),
                nutParams);

        return {
            timeStampUt1 : timeStampUt1,
            timeStampTdb : timeStampTdb,
            polarDx : polarDx,
            polarDy : polarDy,
            nutationParams : nutParams,
            GMST : GMST,
            GAST : GAST
        };
    }
}