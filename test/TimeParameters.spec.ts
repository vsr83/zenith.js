import { checkFloat, checkFloatArray} from './common';
import 'mocha';
import {AssertionError, strict as assert} from 'assert';
import { GregorianTime } from '../src/GregorianTime';
import { GregorianUnits, TimeParameters, TimeParametersInfo, TimeParamsMode } from '../src/Configuration/TimeParameters';
import { TimeConvention } from '../src/TimeCorrelation';

const leapYears = [
    1904, 1908, 1912, 1916, 1920, 1924, 1928, 1932, 1936, 1940, 1944, 1948,
    1952, 1956, 1960, 1964, 1968, 1972, 1976, 1980, 1984, 1988, 1992, 1996,
    2000, 2004, 2008, 2012, 2016, 2020, 2024, 2028, 2032, 2036, 2040, 2044,
    2048, 2052, 2056, 2060, 2064, 2068, 2072, 2076, 2080, 2084, 2088, 2092,
    2096, 2104, 2108, 2112, 2116, 2120, 2124, 2128, 2132, 2136, 2140, 2144,
    2148, 2152, 2156, 2160, 2164, 2168, 2172, 2176, 2180, 2184, 2188, 2192,
    2196, 2204, 2208, 2212, 2216, 2220, 2224, 2228, 2232, 2236, 2240, 2244,
    2248, 2252, 2256, 2260, 2264, 2268, 2272, 2276, 2280, 2284, 2288, 2292,
    2296, 2304, 2308, 2312, 2316, 2320, 2324, 2328, 2332, 2336, 2340, 2344,
    2348, 2352, 2356, 2360, 2364, 2368, 2372, 2376, 2380, 2384, 2388, 2392,
    2396, 2400, 2404
];

function checkGregTime(val : GregorianTime, exp : GregorianTime) {
    assert.equal(val.year, exp.year);
    assert.equal(val.month, exp.month);
    assert.equal(val.mday, exp.mday);
    assert.equal(val.hour, exp.hour);
    assert.equal(val.minute, exp.minute);
    assert.equal(val.second, exp.second);
}

describe('TimeParameters', function() {
    it('createFromJulianSpan', function() {
        const info : TimeParametersInfo = TimeParameters.createFromJulianSpan(
            1, 2, 3, TimeConvention.TIME_TAI
        );
        assert.equal(info.mode, TimeParamsMode.SPAN_JULIAN);
        assert.equal(info.convention, TimeConvention.TIME_TAI);
        assert.equal(info.spanStartLinear, 1);
        assert.equal(info.spanEndLinear, 2);
        assert.equal(info.timeStepLinear, 3);
    });
    it('createFromMjdSpan', function() {
        const info : TimeParametersInfo = TimeParameters.createFromMjdSpan(
            1, 2, 3, TimeConvention.TIME_TAI
        );
        assert.equal(info.mode, TimeParamsMode.SPAN_MJD);
        assert.equal(info.convention, TimeConvention.TIME_TAI);
        assert.equal(info.spanStartLinear, 1);
        assert.equal(info.spanEndLinear, 2);
        assert.equal(info.timeStepLinear, 3);
    });
    it('createFromGregorianSpan', function() {
        const gregStart : GregorianTime = new GregorianTime(1900, 1, 2, 3, 4, 5);
        const gregEnd : GregorianTime = new GregorianTime(2000, 1, 2, 3, 4, 5);
        const gregStep : number = 10;
        const gregUnits : GregorianUnits = GregorianUnits.YEAR;

        const info : TimeParametersInfo = TimeParameters.createFromGregorianSpan(
            gregStart, gregEnd, gregStep, gregUnits, TimeConvention.TIME_TDT
        );
        assert.equal(info.mode, TimeParamsMode.SPAN_GREGORIAN);
        assert.equal(info.convention, TimeConvention.TIME_TDT);
        checkGregTime(<GregorianTime> info.spanStartGregorian, gregStart);
        checkGregTime(<GregorianTime> info.spanEndGregorian, gregEnd);
        assert.equal(info.timeStepGregorian, gregStep);
        assert.equal(info.timeStepGregorianUnits, gregUnits);
    });

    describe('convertToList', function() {
        it('Julian', function() {
            const info : TimeParametersInfo = TimeParameters.createFromJulianSpan(
                20, 40, 4, TimeConvention.TIME_TAI);
            const infoList : TimeParametersInfo = TimeParameters.convertToList(info);

            assert.equal(infoList.mode, TimeParamsMode.LIST_JULIAN);
            assert.equal(infoList.convention, info.convention);
            checkFloatArray(<number[]> infoList.listJulian, [20, 24, 28, 32, 36, 40], 1e-12);
        });
        it('MJD', function() {
            const info : TimeParametersInfo = TimeParameters.createFromMjdSpan(
                20, 40, 3, TimeConvention.TIME_TAI);
            const infoList : TimeParametersInfo = TimeParameters.convertToList(info);

            assert.equal(infoList.mode, TimeParamsMode.LIST_MJD);
            assert.equal(infoList.convention, info.convention);
            checkFloatArray(<number[]> infoList.listJulian, [20, 23, 26, 29, 32, 35, 38], 1e-12);
        });
        it('Gregorian Time', function() {
            const gregStart : GregorianTime = new GregorianTime(1900, 1, 2, 3, 4, 5);
            const gregEnd : GregorianTime = new GregorianTime(2000, 1, 2, 3, 4, 5);
            const gregStep : number = 10;
            const gregUnits : GregorianUnits = GregorianUnits.YEAR;
    
            const info : TimeParametersInfo = TimeParameters.createFromGregorianSpan(
                gregStart, gregEnd, gregStep, gregUnits, TimeConvention.TIME_TDT
            );
            const infoList : TimeParametersInfo = TimeParameters.convertToList(info);
            const info2 : TimeParametersInfo = TimeParameters.createFromGregorianSpan(
                gregEnd, gregStart, -gregStep, gregUnits, TimeConvention.TIME_TDT
            );
            const infoList2 : TimeParametersInfo = TimeParameters.convertToList(info2);

            assert.equal(infoList.mode, TimeParamsMode.LIST_GREGORIAN);
            assert.equal(infoList.convention, info.convention);
            assert.equal(infoList.listGregorian?.length, 11);
            checkGregTime(infoList.listGregorian[0], new GregorianTime(1900, 1, 2, 3, 4, 5));
            checkGregTime(infoList.listGregorian[1], new GregorianTime(1910, 1, 2, 3, 4, 5));
            checkGregTime(infoList.listGregorian[2], new GregorianTime(1920, 1, 2, 3, 4, 5));
            checkGregTime(infoList.listGregorian[3], new GregorianTime(1930, 1, 2, 3, 4, 5));
            checkGregTime(infoList.listGregorian[4], new GregorianTime(1940, 1, 2, 3, 4, 5));
            checkGregTime(infoList.listGregorian[5], new GregorianTime(1950, 1, 2, 3, 4, 5));
            checkGregTime(infoList.listGregorian[6], new GregorianTime(1960, 1, 2, 3, 4, 5));
            checkGregTime(infoList.listGregorian[7], new GregorianTime(1970, 1, 2, 3, 4, 5));
            checkGregTime(infoList.listGregorian[8], new GregorianTime(1980, 1, 2, 3, 4, 5));
            checkGregTime(infoList.listGregorian[9], new GregorianTime(1990, 1, 2, 3, 4, 5));
            checkGregTime(infoList.listGregorian[10], new GregorianTime(2000, 1, 2, 3, 4, 5));

            assert.equal(infoList2.mode, TimeParamsMode.LIST_GREGORIAN);
            assert.equal(infoList2.convention, info.convention);
            assert.equal(infoList2.listGregorian?.length, 11);
            checkGregTime(infoList2.listGregorian[10], new GregorianTime(1900, 1, 2, 3, 4, 5));
            checkGregTime(infoList2.listGregorian[9], new GregorianTime(1910, 1, 2, 3, 4, 5));
            checkGregTime(infoList2.listGregorian[8], new GregorianTime(1920, 1, 2, 3, 4, 5));
            checkGregTime(infoList2.listGregorian[7], new GregorianTime(1930, 1, 2, 3, 4, 5));
            checkGregTime(infoList2.listGregorian[6], new GregorianTime(1940, 1, 2, 3, 4, 5));
            checkGregTime(infoList2.listGregorian[5], new GregorianTime(1950, 1, 2, 3, 4, 5));
            checkGregTime(infoList2.listGregorian[4], new GregorianTime(1960, 1, 2, 3, 4, 5));
            checkGregTime(infoList2.listGregorian[3], new GregorianTime(1970, 1, 2, 3, 4, 5));
            checkGregTime(infoList2.listGregorian[2], new GregorianTime(1980, 1, 2, 3, 4, 5));
            checkGregTime(infoList2.listGregorian[1], new GregorianTime(1990, 1, 2, 3, 4, 5));
            checkGregTime(infoList2.listGregorian[0], new GregorianTime(2000, 1, 2, 3, 4, 5));

            /*
            const gregStart2 : GregorianTime = new GregorianTime(1999, 1, 1, 0, 0, 0);
            const gregEnd2 : GregorianTime = new GregorianTime(2000, 1, 1, 0, 0, 0);
            const gregStep2 : number = 1;
            const gregUnits2 : GregorianUnits = GregorianUnits.DAY;
            const info3 : TimeParametersInfo = TimeParameters.createFromGregorianSpan(
                gregStart2, gregEnd2, gregStep2, gregUnits2, TimeConvention.TIME_TDT
            );
            const infoList3 : TimeParametersInfo = TimeParameters.convertToList(info3);
            console.log(infoList3);
            for (let day = 0; day < (<GregorianTime[]> infoList3.listGregorian).length; day++) {
                const gregTime : GregorianTime = (<GregorianTime[]>infoList3.listGregorian)[day];
                console.log(gregTime.year + " " + gregTime.month + " " + gregTime.mday);
            }

            const info4 : TimeParametersInfo = TimeParameters.createFromGregorianSpan(
                gregEnd2, gregStart2, -gregStep2, gregUnits2, TimeConvention.TIME_TDT
            );
            const infoList4 : TimeParametersInfo = TimeParameters.convertToList(info4);
            console.log(infoList4);
            for (let day = 0; day < (<GregorianTime[]> infoList4.listGregorian).length; day++) {
                const gregTime : GregorianTime = (<GregorianTime[]>infoList4.listGregorian)[day];
                console.log(gregTime.year + " " + gregTime.month + " " + gregTime.mday);
            }
            */
        });
    });
});