import { TimeConvention } from "./TimeCorrelation";

/**
 * Time format.
 */
export enum TimeFormat {
    FORMAT_JULIAN,
    FORMAT_MJD
};

/**
 * Class for storing time stamps.
 */
export class TimeStamp {
    // Internal format used for storage of the time stamp.
    private format : TimeFormat;

    // Internal time convention used for storage of the time stamp.
    private convention : TimeConvention;  

    // The timestamp as a number.
    private data : number;

    /**
     * Public constructor.
     * 
     * @param {TimeFormat} format 
     * @param {TimeConvention} convention 
     * @param {number} data 
     */
    public constructor(format : TimeFormat, convention : TimeConvention, data : number) {
        this.format = format;
        this.convention = convention;
        this.data = data;
    }

    /**
     * Get time format.
     * 
     * @returns {TimeFormat} The time format.
     */
    public getFormat() : TimeFormat {
        return this.format;
    }

    /**
     * Get time convention.
     * 
     * @returns {TimeConvention} The time convention.
     */
    public getConvention() : TimeConvention {
        return this.convention;
    }

    /**
     * Get Julian Time.
     * 
     * @returns {number} Julian time.
     */
    public getJulian() : number {
        switch (this.format) {
            case TimeFormat.FORMAT_JULIAN:
                return this.data;
                break;
            case TimeFormat.FORMAT_MJD:
                return this.mjdToJulian(this.data);
                break;
        }
    }

    /**
     * Get Modified Julian Time.
     * 
     * @returns {number} Modified Julian Time.
     */
    public getMjd() : number {
        switch (this.format) {
            case TimeFormat.FORMAT_JULIAN:
                return this.julianToMjd(this.data);
                break;
            case TimeFormat.FORMAT_MJD:
                return this.data;
                break;
        }
    }

    /**
     * Compute Julian Time from Modified Julian Date.
     * 
     * @param {number} mjd
     *      Modified Julian date.
     * @returns {number} Julian time.
     */
    private mjdToJulian(mjd : number) : number {
        return mjd + 2400000.5;
    }

    /**
     * Compute Modified Julian Date from Julian Time.
     * 
     * @param {number} jt
     *      Julian Time.
     * @returns {number} Modified Julian Date.
     */
    private julianToMjd(jt : number) : number {
        return jt - 2400000.5;
    }
};