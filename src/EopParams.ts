import { TimeStamp } from "./TimeStamp";
import { NutationData } from "./Nutation";

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
