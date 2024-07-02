import { checkFloat, checkFloatArray} from './common';
import 'mocha';
import {AssertionError, strict as assert} from 'assert';
import { GregorianTime } from '../src/GregorianTime';

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

describe('GregorianTime', function() {
    describe('isLeap', function() {
        it('Years 1900-2404', function() {
            for (let year = 1900; year < 2405; year++) {
                assert.equal(new GregorianTime(year, 1, 1, 0, 0, 0).isLeap(), leapYears.includes(year));
            }
        });
    });

    describe('addDays', function() {
        it('Years 1900-2404', function() {
            const gregTime = new GregorianTime(1900, 1, 1, 0, 0, 0);
            const gregTime2 = new GregorianTime(1900, 1, 1, 0, 0, 0);
            let sum = 0;

            for (let year = 1900; year < 2405; year++) {
                if (leapYears.includes(year)) {
                    gregTime.addDays(366);
                    sum += 366;
                } else {
                    gregTime.addDays(365);
                    sum += 365;
                }
                checkGregTime(gregTime, new GregorianTime(year + 1, 1, 1, 0, 0, 0));
            }
            gregTime2.addDays(sum);
            checkGregTime(gregTime2, gregTime);

            sum = 0;
            for (let year = 2405; year >= 1900; year--) {
                if (leapYears.includes(year - 1)) {
                    gregTime.addDays(-366);
                    sum -= 366;
                } else {
                    gregTime.addDays(-365);
                    sum -= 365;
                }
                checkGregTime(gregTime, new GregorianTime(year - 1, 1, 1, 0, 0, 0));
            }

        });

        it('Months 1900-2404', function() {
            const gregTime = new GregorianTime(1900, 1, 1, 0, 0, 0);
            const gregTime2 = new GregorianTime(1900, 1, 1, 0, 0, 0);
            let sum = 0;

            for (let year = 1900; year < 2405; year++) {
                gregTime.addDays(31);
                checkGregTime(gregTime, new GregorianTime(year, 2, 1, 0, 0, 0));
                if (leapYears.includes(year)) {
                    sum += 366;
                    gregTime.addDays(29);
                } else {
                    sum += 365;
                    gregTime.addDays(28);
                }
                checkGregTime(gregTime, new GregorianTime(year, 3, 1, 0, 0, 0));
                gregTime.addDays(31);
                checkGregTime(gregTime, new GregorianTime(year, 4, 1, 0, 0, 0));
                gregTime.addDays(30);
                checkGregTime(gregTime, new GregorianTime(year, 5, 1, 0, 0, 0));

                gregTime.addDays(31);
                checkGregTime(gregTime, new GregorianTime(year, 6, 1, 0, 0, 0));
                gregTime.addDays(30);
                checkGregTime(gregTime, new GregorianTime(year, 7, 1, 0, 0, 0));
                gregTime.addDays(31);
                checkGregTime(gregTime, new GregorianTime(year, 8, 1, 0, 0, 0));
                gregTime.addDays(31);
                checkGregTime(gregTime, new GregorianTime(year, 9, 1, 0, 0, 0));

                gregTime.addDays(30);
                checkGregTime(gregTime, new GregorianTime(year, 10, 1, 0, 0, 0));
                gregTime.addDays(31);
                checkGregTime(gregTime, new GregorianTime(year, 11, 1, 0, 0, 0));
                gregTime.addDays(30);
                checkGregTime(gregTime, new GregorianTime(year, 12, 1, 0, 0, 0));
                gregTime.addDays(31);
                checkGregTime(gregTime, new GregorianTime(year + 1, 1, 1, 0, 0, 0));
            }
            gregTime2.addDays(sum);
            checkGregTime(gregTime2, gregTime);

            for (let year = 2405; year >= 1900; year--) {
                gregTime.addDays(-31);
                checkGregTime(gregTime, new GregorianTime(year - 1, 12, 1, 0, 0, 0));
                gregTime.addDays(-30);
                checkGregTime(gregTime, new GregorianTime(year - 1, 11, 1, 0, 0, 0));
                gregTime.addDays(-31);
                checkGregTime(gregTime, new GregorianTime(year - 1, 10, 1, 0, 0, 0));
                gregTime.addDays(-30);
                checkGregTime(gregTime, new GregorianTime(year - 1, 9, 1, 0, 0, 0));
                gregTime.addDays(-31);
                checkGregTime(gregTime, new GregorianTime(year - 1, 8, 1, 0, 0, 0));
                gregTime.addDays(-31);
                checkGregTime(gregTime, new GregorianTime(year - 1, 7, 1, 0, 0, 0));
                gregTime.addDays(-30);
                checkGregTime(gregTime, new GregorianTime(year - 1, 6, 1, 0, 0, 0));
                gregTime.addDays(-31);
                checkGregTime(gregTime, new GregorianTime(year - 1, 5, 1, 0, 0, 0));
                gregTime.addDays(-30);
                checkGregTime(gregTime, new GregorianTime(year - 1, 4, 1, 0, 0, 0));
                gregTime.addDays(-31);
                checkGregTime(gregTime, new GregorianTime(year - 1, 3, 1, 0, 0, 0));
                if (leapYears.includes(year - 1)) {
                    sum += 366;
                    gregTime.addDays(-29);
                } else {
                    sum += 365;
                    gregTime.addDays(-28);
                }
                checkGregTime(gregTime, new GregorianTime(year - 1, 2, 1, 0, 0, 0));
                gregTime.addDays(-31);
                checkGregTime(gregTime, new GregorianTime(year - 1, 1, 1, 0, 0, 0));
            }
            gregTime.addDays(-32);
            checkGregTime(gregTime, new GregorianTime(1898, 11, 30, 0, 0, 0));
            gregTime.addDays(-29);
            checkGregTime(gregTime, new GregorianTime(1898, 11, 1, 0, 0, 0));
            gregTime.addDays(-1);
            checkGregTime(gregTime, new GregorianTime(1898, 10, 31, 0, 0, 0));
            gregTime.addDays(-31);
            checkGregTime(gregTime, new GregorianTime(1898, 9, 30, 0, 0, 0));

        });

    });

    describe('addHours', function() {
        it('Years 1900-2404', function() {
            const gregTime = new GregorianTime(1900, 1, 1, 0, 0, 0);
            const gregTime2 = new GregorianTime(1900, 1, 1, 0, 0, 0);
            const gregTime3 = new GregorianTime(1900, 1, 1, 0, 0, 0);

            for (let hour = 1; hour < 24; hour++) {
                gregTime3.addHours(1);
                checkGregTime(gregTime3, new GregorianTime(1900, 1, 1, hour, 0, 0));
            }
            gregTime3.addHours(1);
            checkGregTime(gregTime3, new GregorianTime(1900, 1, 2, 0, 0, 0));
            gregTime3.addHours(25);
            checkGregTime(gregTime3, new GregorianTime(1900, 1, 3, 1, 0, 0));
            gregTime3.addHours(6);
            checkGregTime(gregTime3, new GregorianTime(1900, 1, 3, 7, 0, 0));
            gregTime3.addHours(6);
            checkGregTime(gregTime3, new GregorianTime(1900, 1, 3, 13, 0, 0));
            gregTime3.addHours(6);
            checkGregTime(gregTime3, new GregorianTime(1900, 1, 3, 19, 0, 0));
            gregTime3.addHours(6);
            checkGregTime(gregTime3, new GregorianTime(1900, 1, 4, 1, 0, 0));
            gregTime3.addHours(-1);
            checkGregTime(gregTime3, new GregorianTime(1900, 1, 4, 0, 0, 0));
            gregTime3.addHours(-1);
            checkGregTime(gregTime3, new GregorianTime(1900, 1, 3, 23, 0, 0));
            gregTime3.addHours(-25);
            checkGregTime(gregTime3, new GregorianTime(1900, 1, 2, 22, 0, 0));
            let sum = 0;

            for (let year = 1900; year < 2405; year++) {
                if (leapYears.includes(year)) {
                    gregTime.addHours(366 * 24);
                    sum += 366;
                } else {
                    gregTime.addHours(365 * 24);
                    sum += 365;
                }
                checkGregTime(gregTime, new GregorianTime(year + 1, 1, 1, 0, 0, 0));
            }
            gregTime2.addHours(sum * 24);
            checkGregTime(gregTime2, gregTime);
        });
    });

    describe('addMinutes', function() {
        it('Basic Testing', function() {
            const gregTime = new GregorianTime(1900, 1, 1, 0, 0, 0);
            gregTime.addMinutes(10);
            checkGregTime(gregTime, new GregorianTime(1900, 1, 1, 0, 10, 0));
            gregTime.addMinutes(20);
            checkGregTime(gregTime, new GregorianTime(1900, 1, 1, 0, 30, 0));
            gregTime.addMinutes(30);
            checkGregTime(gregTime, new GregorianTime(1900, 1, 1, 1, 0, 0));
            gregTime.addMinutes(10);
            checkGregTime(gregTime, new GregorianTime(1900, 1, 1, 1, 10, 0));
            gregTime.addMinutes(190);
            checkGregTime(gregTime, new GregorianTime(1900, 1, 1, 4, 20, 0));
            gregTime.addMinutes(-20);
            checkGregTime(gregTime, new GregorianTime(1900, 1, 1, 4, 0, 0));
            gregTime.addMinutes(-60);
            checkGregTime(gregTime, new GregorianTime(1900, 1, 1, 3, 0, 0));
            gregTime.addMinutes(-90);
            checkGregTime(gregTime, new GregorianTime(1900, 1, 1, 1, 30, 0));
            gregTime.addMinutes(-1440);
            checkGregTime(gregTime, new GregorianTime(1899, 12, 31, 1, 30, 0));
        });
    });
});