import { TimeConvention, TimeCorrelation } from "./TimeCorrelation";
import { GregorianTime } from "./GregorianTime";
/**
 * Time format.
 */
export enum TimeFormat {
    FORMAT_JULIAN,
    FORMAT_MJD
};

/**
 * Interface for GregorianTime outputs.
 */
/*export interface GregorianTime 
{
    year : number;
    month : number; 
    mday : number; 
    hour : number;
    minute : number; 
    second : number;
}*/

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
     * Transform timestamp to given format and convention.
     * 
     * @param {TimeCorrelation} corr 
     *      Time correlation used for the transformation.
     * @param {TimeFormat} targetFormat 
     *      Target format.
     * @param {TimeConvention} targetConvention 
     *      Target convention.
     * @returns {TimeStamp} The transformed timestamp.
     */
    public changeTo(corr : TimeCorrelation, targetFormat : TimeFormat, targetConvention : TimeConvention) : TimeStamp {
        let jt : number = this.getJulian();
        let mjd : number = this.getMjd();

        const offsetDays : number = corr.computeOffset(this.getConvention(), targetConvention, jt);
        let data;

        switch(targetFormat) {
            case TimeFormat.FORMAT_JULIAN:
                data = jt + offsetDays;
                break;
            case TimeFormat.FORMAT_MJD:
                data = mjd + offsetDays;
                break;
        }

        return new TimeStamp(targetFormat, targetConvention, data);
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
     * Create from Gregorian time.
     * 
     * @param {GregorianTime} gregTime 
     *      Gregorian time.
     * @param {TimeConvention} convention 
     *      Time convention.
     * @returns {TimeStamp} Timestamp.
     */
    static fromGregorian(gregTime : GregorianTime, convention : TimeConvention) : TimeStamp {
        const JT = TimeStamp.timeJulianYmdhms(gregTime.year, gregTime.month,
            gregTime.mday, gregTime.hour, gregTime.minute, gregTime.second);

        return new TimeStamp(TimeFormat.FORMAT_JULIAN, convention, JT);
    }

    /**
     * Create from timestamp.
     * 
     * @param {Date} date 
     *      Timestamp.
     * @param {TimeConvention} convention 
     *      Time convention.
     * @returns {TimeStamp} Timestamp.
     */
    static fromTimestamp(date : Date, convention : TimeConvention) {
        const gregTime : GregorianTime = new GregorianTime(
            date.getUTCFullYear(),
            date.getUTCMonth() + 1,
            date.getUTCDate(),
            date.getUTCHours(),
            date.getUTCMinutes(),
            date.getUTCSeconds() + date.getUTCMilliseconds() / 1000.0
        );

        return TimeStamp.fromGregorian(gregTime, convention);
    }

    /**
     * Get Gregorian time.
     * 
     * @returns {GregorianTime} The Gregorian time.
     */
    public toGregorian() : GregorianTime {
        const JT : number = this.getJulian();

        // Meeus - Astronomical Algorithms - Chapter 7.
        const Z = Math.floor(JT + 0.5);
        const F = JT + 0.5 - Z;
        let A = Z;
        if (Z >= 2299161) 
        {
            let alpha = Math.floor((Z - 1867216.25) / 36524.25);
            A = Z + 1 + alpha - Math.floor(alpha / 4.0);
        }
        const B = A + 1524;
        const C = Math.floor((B - 122.1) / 365.25);
        const D = Math.floor(365.25 * C);
        const E = Math.floor((B - D)/30.6001);

        const mday = Math.floor(B - D - Math.floor(30.6001 * E) + F);
        let month = E - 1;
        if (E >= 14)
        {
            month = E - 13;
        }
        let year = C - 4716;
        if (month < 3)
        {
            year = C - 4715;
        }

        let JTfrac = F;
        if (JTfrac < 0)
        {
            JTfrac += 1;
        }
        const hour = Math.floor(JTfrac * 24.0);
        JTfrac -= hour / 24.0;
        const minute = Math.floor(JTfrac * (24.0 * 60.0));
        JTfrac -= minute / (24.0 * 60.0);
        const second = JTfrac * (24.0 * 60.0 * 60.0);

        return new GregorianTime(year, month, mday, hour, minute, second);
    }

    /**
     * Compute the number of Julian days to a timestamp.
     * 
     * @param {TimeCorrelation} corr 
     *      Time correlation.
     * @param {TimeStamp} target 
     *      Target time.
     * @returns {number} Number of Julian days.
     */
    public daysTo(corr : TimeCorrelation, target : TimeStamp) : number {
        const source = this.changeTo(corr, target.getFormat(), target.getConvention());

        switch (source.getFormat()) {
            case TimeFormat.FORMAT_JULIAN:
                return target.getJulian() - source.getJulian();
                break;
            case TimeFormat.FORMAT_MJD:
                return target.getMjd() - source.getMjd();
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

    /**
     * Compute Julian date for given calendar date.
     * 
     * @param {number} year 
     *      Year as an integer.
     * @param {number} month 
     *      Month (1-12).
     * @param {number} mday 
     *      Day of the month (1-31).
     * @returns {number} Julian date.
     */
    private static dateJulianYmd(year : number, month : number, mday : number) : number
    {
        if (month < 3)
        {
            year--;
            month += 12;
        }

        const A = Math.floor(year / 100.0);
        const B = Math.floor(A / 4.0);
        const C = Math.floor(2.0 - A + B);
        const E = Math.floor(365.25 * (year + 4716.0));
        const F = Math.floor(30.6001 * (month + 1.0));

        return C + mday + E + F - 1524.5;    
    }

    /**
     * Compute Julian time.
     * 
     * @param {number} year 
     *      Year as an integer.
     * @param {number} month 
     *      Month (1-12) integer.
     * @param {number} mday 
     *      Day of the month (1-31) integer.
     * @param {number} hour 
     *      Hour (0-23) integer.
     * @param {number} minute
     *      Minute (0-59) integer. 
     * @param {number} second 
     *      Second (0-60) floating point.
     * @returns {number} An object with JD and JT for Julian date and time.
     */
    private static timeJulianYmdhms(year : number, month : number, mday : number, 
        hour : number, minute : number, second : number) : number
    {
        const JD = TimeStamp.dateJulianYmd(year, month, mday);
        const JT = JD + hour / 24.0 + minute/(24.0 * 60.0) + second/(24.0 * 60.0 * 60.0);

        return JT;
    }
};