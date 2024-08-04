import { TimeConvention } from "../TimeCorrelation";
import { GregorianTime } from "../GregorianTime";
import { TimeStamp, TimeFormat } from "../TimeStamp";

/**
 * Time parameters mode.
 */
export enum TimeParamsMode {
    SPAN_MJD       = "SPAN_MJD",
    SPAN_JULIAN    = "SPAN_JULIAN",
    SPAN_GREGORIAN = "SPAN_GREGORIAN",
    LIST_MJD       = "LIST_MJD",
    LIST_JULIAN    = "LIST_JULIAN",
    LIST_GREGORIAN = "LIST_GREGORIAN"
};

/**
 * Time step mode for Gregorian
 */
export enum GregorianUnits {
    YEAR   = "YEAR",
    MONTH  = "MONTH",
    DAY    = "DAY",
    HOUR   = "HOUR",
    MINUTE = "MINUTE",
    SECOND = "SECOND",
    MILLI  = "MILLI"
};

/**
 * Time parameters configuration.
 */
export interface TimeParametersInfo { 
    // Time parameters configuration mode.
    mode : TimeParamsMode;
    // Time convention used in the configuration.
    convention : TimeConvention;

    // Time step configuration for Julian and MJD.
    spanStartLinear? : number;
    spanEndLinear? : number;
    timeStepLinear? : number;

    // Time step configuration for Gregorian time.
    spanStartGregorian? : GregorianTime;
    spanEndGregorian? : GregorianTime;
    timeStepGregorian? : number;
    timeStepGregorianUnits? : GregorianUnits;

    // Time step lists.
    listJulian? : number[];
    listGregorian? : GregorianTime[];
}

/**
 * Class with static methods to create time parameters info.
 */
export class TimeParameters {
    /**
     * Create Julian time parameters from a span.
     * 
     * @param {number} julianStart 
     *      First Julian time.
     * @param {number} julianEnd 
     *      Last Julian time.
     * @param {number} julianStep 
     *      Julian time step (fractional days)
     * @param {TimeConvention} convention 
     *      Time convention.
     * @returns {TimeParametersInfo} The Time parameters info.
     */
    static createFromJulianSpan(julianStart : number, julianEnd : number, 
        julianStep : number, convention: TimeConvention) : TimeParametersInfo {
        return {
            mode : TimeParamsMode.SPAN_JULIAN,
            convention : convention,
            spanStartLinear : julianStart,
            spanEndLinear : julianEnd, 
            timeStepLinear : julianStep
        }
    }

    /**
     * Create Modified Julian time parameters from a span.
     * 
     * @param {number} mjdStart 
     *      First MJD time.
     * @param {number} mjdEnd 
     *      Last MJD time.
     * @param {number} mjdStep 
     *      Julian time step (fractional days)
     * @param {TimeConvention} convention 
     *      Time convention.
     * @returns {TimeParametersInfo} The Time parameters info.
     */
    static createFromMjdSpan(mjdStart : number, mjdEnd : number, 
        mjdStep : number, convention: TimeConvention) : TimeParametersInfo {
        return {
            mode : TimeParamsMode.SPAN_MJD,
            convention : convention,
            spanStartLinear : mjdStart,
            spanEndLinear : mjdEnd, 
            timeStepLinear : mjdStep
        }
    }

    /**
     * Create Gregorian time parameters from a span.
     * 
     * @param {GregorianTime} gregStart 
     *      First Gregorian time.
     * @param {GregorianTime} gregEnd 
     *      Last Gregorian time.
     * @param {number} gregStep 
     *      Gregorian time step (selected units).
     * @param {GregorianStepMode} gregUnits
     *      Gregorian time step units.
     * @param {TimeConvention} convention 
     *      Time convention.
     * @returns {TimeParametersInfo} The Time parameters info.
     */
    static createFromGregorianSpan(gregStart : GregorianTime, gregEnd : GregorianTime, 
        gregStep : number, gregUnits : GregorianUnits, convention: TimeConvention) 
        : TimeParametersInfo {
        return {
            mode : TimeParamsMode.SPAN_GREGORIAN,
            convention : convention,
            spanStartGregorian : gregStart,
            spanEndGregorian : gregEnd, 
            timeStepGregorian : gregStep,
            timeStepGregorianUnits : gregUnits
        }
    }

    /**
     * Convert time parameters to a list. 
     * 
     * @param {TimeParametersInfo} info 
     *      Time parameters with.
     * @returns {TimeParametersInfo} Time parameters with a list.
     */
    static convertToList(info : TimeParametersInfo) : TimeParametersInfo {
        switch (info.mode) {
            case TimeParamsMode.SPAN_MJD:
                return TimeParameters.convertMjdSpanToList(info);
            case TimeParamsMode.SPAN_JULIAN:
                return TimeParameters.convertJulianSpanToList(info);
            case TimeParamsMode.SPAN_GREGORIAN:
                return TimeParameters.convertGregSpanToList(info);
            case TimeParamsMode.LIST_MJD:
                return info;
            case TimeParamsMode.LIST_JULIAN:
                return info;
            case TimeParamsMode.LIST_GREGORIAN:
                return info;
        }
    }

    /**
     * Convert time parameters to a Julian list.
     * 
     * @param {TimeParametersInfo} info 
     *      Time parameters with a span.
     * @returns {TimeParametersInfo} Time parameters with a list.
     */
    static convertToJulianList(info : TimeParametersInfo) : TimeParametersInfo {
        const infoList : TimeParametersInfo = TimeParameters.convertToList(info);

        const julianList : number[] = [];

        if (infoList.mode == TimeParamsMode.LIST_JULIAN) {
            return infoList;
        } else if (infoList.mode == TimeParamsMode.LIST_MJD) {
            const listMjd : number[] = <number[]> info.listJulian;
            for (let ind = 0; ind < listMjd.length; ind++) {
                const timeStamp : TimeStamp = new TimeStamp(TimeFormat.FORMAT_MJD, 
                    info.convention, listMjd[ind]);
                julianList.push(timeStamp.getJulian());
            }
        } else if (infoList.mode == TimeParamsMode.LIST_GREGORIAN) {
            const listGreg : GregorianTime[] = <GregorianTime[]> info.listGregorian;

            for (let ind = 0; ind < listGreg.length; ind++) {
                const timeStamp : TimeStamp = TimeStamp.fromGregorian(listGreg[ind], info.convention);
                julianList.push(timeStamp.getJulian());
            }
        }

        return {
            mode : TimeParamsMode.LIST_JULIAN,
            convention : info.convention,
            listJulian : julianList
        };
    }

    /**
     * Convert time configuration with a Julian time span to a time configuration 
     * with list of Julian times.
     * 
     * @param {TimeParametersInfo} info
     *      Time configuration with Julian time span. 
     * @returns {TimeParametersInfo} Time configuration with Julian time list.
     */
    static convertJulianSpanToList(info : TimeParametersInfo) : TimeParametersInfo {
        if (info.spanEndLinear   === undefined || 
            info.timeStepLinear  === undefined ||
            info.spanStartLinear === undefined) {
            throw Error("Necessary parameters undefined.");
        }

        const jdList : number[] = [];
        for (let jd : number = info.spanStartLinear; jd <= info.spanEndLinear; jd += info.timeStepLinear) {
            jdList.push(jd);
        }

        return {
            mode : TimeParamsMode.LIST_JULIAN,
            convention : info.convention,
            listJulian : jdList
        };
    }

    /**
     * Convert time configuration with a MJD time span to a time configuration 
     * with list of MJD times.
     * 
     * @param {TimeParametersInfo} info
     *      Time configuration with MJD time span. 
     * @returns {TimeParametersInfo} Time configuration with MJD time list.
     */
    static convertMjdSpanToList(info : TimeParametersInfo) : TimeParametersInfo {
        if (info.spanEndLinear   === undefined || 
            info.timeStepLinear  === undefined ||
            info.spanStartLinear === undefined) {
            throw Error("Necessary parameters undefined.");
        }

        const mjdList : number[] = [];
        for (let mjd : number = info.spanStartLinear; mjd <= info.spanEndLinear; mjd += info.timeStepLinear) {
            mjdList.push(mjd);
        }

        return {
            mode : TimeParamsMode.LIST_MJD,
            convention : info.convention,
            listJulian : mjdList
        };
    }

    /**
     * Convert time configuration with a span of Gregorian times to a time configuration
     * with a list of Gregorian times.
     * 
     * @param {TimeParametersInfo} info 
     *     Time configuration with a span of Gregorian times.
     * @returns {TimeParametersInfo} Time configuration with a list of Gregorian times.
     */
    static convertGregSpanToList(info : TimeParametersInfo) : TimeParametersInfo {
        if (info.spanStartGregorian   === undefined || 
            info.spanEndGregorian  === undefined ||
            info.timeStepGregorian === undefined ||
            info.timeStepGregorianUnits === undefined) {
            throw Error("Necessary parameters undefined.");
        }

        let gregTime : GregorianTime = GregorianTime.copy(info.spanStartGregorian);
        let gregList : GregorianTime[] = [];

        for (;;) {
            if (info.timeStepGregorian > 0) {
                if (gregTime.isAfter(info.spanEndGregorian)) {
                    break;
                }
            } else {
                if (info.spanEndGregorian.isAfter(gregTime)) {
                    break;
                }
            }
            gregList.push(GregorianTime.copy(gregTime));

            switch (info.timeStepGregorianUnits) {
                case GregorianUnits.YEAR:
                    gregTime.addYears(info.timeStepGregorian);
                    break;
                case GregorianUnits.MONTH:
                    gregTime.addMonths(info.timeStepGregorian);
                    break;
                case GregorianUnits.DAY:
                    gregTime.addDays(info.timeStepGregorian);
                    break;
                case GregorianUnits.HOUR:
                    gregTime.addHours(info.timeStepGregorian);
                    break;
                case GregorianUnits.MINUTE:
                    gregTime.addMinutes(info.timeStepGregorian);
                    break;
                case GregorianUnits.SECOND:
                    gregTime.addSeconds(info.timeStepGregorian);
                    break;
                case GregorianUnits.MILLI:
                    gregTime.addMillis(info.timeStepGregorian);
                    break;
            }
        }

        return {
            mode : TimeParamsMode.LIST_GREGORIAN,
            convention : info.convention,
            listGregorian : gregList
        };
    }
}