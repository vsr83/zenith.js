import corrData from '../data/time_correlation_data.json';


// Internal hard-coded data.
const ut1TaiInternal : TimeCorrelationData = corrData.ut1Tai;
const ut1UtcInternal : TimeCorrelationData = corrData.ut1Utc;

/**
 * Interface for time correlation input data used in the interpolation.
 */
export interface TimeCorrelationData {
    data : number[][];
    minJD : number;
    maxJD : number;
}

/**
 * Enumeration for time conventions.
 */
export enum TimeConvention {
    TIME_TDB, 
    TIME_TDT,
    TIME_UT1,
    TIME_UTC,
    TIME_TAI
};

/**
 * Class for implementing time correlations.
 */
export class TimeCorrelation {
    // UT1-TAI correlation data.
    private ut1TaiData : TimeCorrelationData;

    // UT1-UTC correlation data.
    private ut1UtcData : TimeCorrelationData;

    /**
     * Public constructor.
     */
    public constructor() {
        // These are not copied for performance reasons. 
        this.ut1TaiData = ut1TaiInternal;
        this.ut1UtcData = ut1UtcInternal;
    }

    /**
     * Compute offset between two time conventions in fractional days.
     * 
     * @param {TimeConvention} src 
     *      The source time convention.
     * @param {TimeConvention} dst
     *      The target time convention. 
     * @returns {number} Offset days.
     */
    public computeOffset(src : TimeConvention, dst : TimeConvention, JT : number) : number {
        if (src == dst) {
            return 0.0;
        }
        let delta = 0.0;

        switch (src) {
            case TimeConvention.TIME_TDT:
                delta = this.deltaTdtTai(JT);
                switch (dst) {
                    case TimeConvention.TIME_TAI: // TDT -> TAI
                        return delta;
                    case TimeConvention.TIME_UT1: // TDT -> TAI -> UT1
                        return delta + this.deltaTaiUt1(JT + delta);
                    case TimeConvention.TIME_UTC: // TDT -> TAI -> UT1 -> UTC
                        delta += this.deltaTaiUt1(JT + delta);
                        return delta + this.deltaUt1Utc(JT + delta);
                }
                break;
            case TimeConvention.TIME_UT1:
                switch (dst) {
                    case TimeConvention.TIME_TAI: // UT1 -> TAI
                        return this.deltaUt1Tai(JT);
                    case TimeConvention.TIME_UTC: // UT1 -> UTC
                        return this.deltaUt1Utc(JT); 
                    case TimeConvention.TIME_TDT: // UT1 -> TAI -> TDT
                        delta = this.deltaUt1Tai(JT); 
                        return delta + this.deltaTaiTdt(JT + delta);
                }
                break;
            case TimeConvention.TIME_UTC:
                switch (dst) {
                    case TimeConvention.TIME_UT1: // UTC -> UT1
                        return this.deltaUtcUt1(JT);
                    case TimeConvention.TIME_TAI: // UTC -> UT1 -> TAI
                        delta = this.deltaUtcUt1(JT); return delta + this.deltaUt1Tai(JT + delta);
                    case TimeConvention.TIME_TDT: // UTC -> UT1 -> TAI -> TDT
                        delta = this.deltaUtcUt1(JT); 
                        delta += this.deltaUt1Tai(JT + delta); 
                        return delta + this.deltaTaiTdt(JT + delta);
                }
                break;
            case TimeConvention.TIME_TAI:
                switch (dst) {
                    case TimeConvention.TIME_TDT: // TAI -> TDT
                        return this.deltaTaiTdt(JT);
                    case TimeConvention.TIME_UT1: // TAI -> UT1
                        return this.deltaTaiUt1(JT);
                    case TimeConvention.TIME_UTC: // TAI -> UT1 -> UTC
                        delta = this.deltaTaiUt1(JT);
                        return delta + this.deltaUt1Utc(JT + delta);
                }
                break;
        }
    }

    /**
     * Compute fractional delta days from UT1 to TAI.
     * 
     * @param {number} JTut1 
     *      Julian UT1 time.
     * @returns {number} Delta days.
     */
    private deltaUt1Tai(JTut1 : number) : number
    {
        return -this.interpolateSearch(this.ut1TaiData, JTut1, true)[1] / 86400.0;
    }

    /**
     * Compute fractional delta days from TAI to UT1.
     * 
     * @param {number} JTtai
     *      Julian time.
     * @returns {number} Delta days.
     */
    private deltaTaiUt1(JTtai : number) : number
    {
        return this.interpolateSearch(this.ut1TaiData, JTtai, true)[1] / 86400.0;
    }

    /**
     * Compute fractional delta days from UT1 to UTC.
     * 
     * @param {number} JTut1 
     *      Julian UT1 time.
     * @returns {number} Delta days.
     */
    private deltaUt1Utc(JTut1 : number) : number
    {
        return -this.interpolateSearch(this.ut1UtcData, JTut1, true)[1] / 86400.0;
    }

    /**
     * Compute fractional delta days from UTC to UT1.
     * 
     * @param {number} JTtai
     *      Julian UTC time.
     * @returns {number} Delta days.
     */
    private deltaUtcUt1(JTtai : number) : number
    {
        return this.interpolateSearch(this.ut1UtcData, JTtai, true)[1] / 86400.0;
    }

    /**
     * Convert TDT to TAI time.
     * 
     * @param {number} JTtdt
     *      T Julian time.
     * @returns {number} TAI Julian time.
     */
    private deltaTdtTai(JTtdt : number) : number
    {
        return -32.184 / 86400.0;
    }

    /**
     * Convert TAI to TDT time.
     * 
     * @param {number} JTtai
     *      TAI Julian time.
     * @returns {number} TDT Julian time.
     */
    private deltaTaiTdt(JTtai : number) : number
    {
        return 32.184 / 86400.0;
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
    private interpolateSearch(data : TimeCorrelationData, JT : number , doInterp : boolean) : number[]
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
