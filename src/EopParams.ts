import { TimeStamp } from "./TimeStamp";
import { NutationData, Nutation } from "./Nutation";
import { TimeConvention, TimeCorrelation } from "./TimeCorrelation";
import { SiderealTime } from "./SiderealTime";

/**
 * 
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
 * Class with static methods for the computation of EOP.
 */
export class EopComputation {
    /**
     * Compute Earth Orientation Parameters (EOP).
     * 
     * @param {TimeStamp} timeStamp 
     *      Time stamp.
     * @param {TimeCorrelation} timeCorrelation
     *      Time correlation.
     * @returns {EopParams} The EOP for given time step.
     */
    static computeEopData(timeStamp : TimeStamp, timeCorrelation : TimeCorrelation) : EopParams {
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