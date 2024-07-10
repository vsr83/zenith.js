import { TimeStamp } from "./TimeStamp";
import { NutationData, Nutation } from "./Nutation";
import { TimeConvention, TimeCorrelation } from "./TimeCorrelation";
import { SiderealTime } from "./SiderealTime";
import { ObserverInfo, StateVector } from ".";
import { IntegrationState } from "./SSIE/Integration";
import { PointMass } from "./SSIE/PointMass";
import { constants } from "./SSIE/Constants";
import { MathUtils } from "./MathUtils";
import { FrameCenter, FrameOrientation } from "./Frames";

import corrData from '../data/time_correlation_data.json';

// Internal hard-coded data.
const polarMotionData : PolarMotionData = corrData.polar;

/**
 * Interface for time correlation input data used in the interpolation.
 */
export interface PolarMotionData {
    data : number[][];
    minJD : number;
    maxJD : number;
}

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

        // Compute polar motion.
        const polarData : number[] = EopComputation.interpolateSearch(polarMotionData, 
            timeStampUt1.getJulian(), true);
        const polarDx : number = polarData[1] / 3600;
        const polarDy : number = polarData[2] / 3600;
    
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

    /**
     * Perform binary search of data.
     * 
     * @param {TimeCorrelationData} data 
     *      JSON of data with fields minJD, maxJD and data.
     * @param {number} JT 
     *      Julian time.
     * @param {boolean} doInterp
     *      Whether to perform interpolation of the values. 
     * @returns {number[]} The possibly interpolated data.
     */
    private static interpolateSearch(data : PolarMotionData, JT : number , doInterp : boolean) : number[]
    {
        if (JT <= data.minJD)
        {
            return data.data[0];
        }
        if (JT >= data.maxJD)
        {
            return data.data[data.data.length - 1];
        }

        let pointerStart = 0;
        let pointerEnd = data.data.length - 1;
        let done = false;

        while (!done)
        {
            let firstHalfStart = pointerStart;
            let secondHalfStart = Math.floor(0.5 * (pointerStart + pointerEnd));
            let JTstart = data.data[firstHalfStart][0];
            let JTmiddle = data.data[secondHalfStart][0];
            let JTend = data.data[pointerEnd][0];

            if (JT >= JTstart && JT <= JTmiddle)
            {
                pointerEnd = secondHalfStart;
            }
            else 
            {
                pointerStart = secondHalfStart;
            }

            if (pointerEnd - pointerStart <= 1)
            {
                done = true;
            }

            //console.log(pointerStart + " " + pointerEnd + " " + done + " " + data.data.length);
        }

        if (pointerStart == pointerEnd)
        {
            return data.data[pointerStart];
        }
        else 
        {
            const dataFirst = data.data[pointerStart];
            const dataSecond = data.data[pointerEnd];

            if (doInterp)
            {
                let dataOut = [JT];
                for (let indData = 1; indData < dataFirst.length; indData++)
                {
                    const value = dataFirst[indData];
                    const valueNext = dataSecond[indData];
                    const JTcurrent = dataFirst[0];
                    const JTnext = dataSecond[0];

                    dataOut.push(value + (valueNext - value) * (JT - JTcurrent) / (JTnext - JTcurrent));
                }

                return dataOut;
            }
            else 
            {
                // We wish to avoid situation, where a leap second is introduced and
                // the new value introduces a jump to the second for a julian time before
                // end of the year.
                return dataFirst;
            }
        }
    }
}