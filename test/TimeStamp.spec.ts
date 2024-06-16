import { checkFloat, checkFloatArray} from './common';
import 'mocha';
import { TimeConvention, TimeCorrelation } from '../src/TimeCorrelation';
import { TimeStamp, TimeFormat } from '../src/TimeStamp';

describe('TimeStamp', function() {
    const nanoSecond = 1e-9 / 86400.0;
    //#  an         x(")        x_er(")     y(")        y_er(")    UT1-TAI(s)  UT1_er(s)    dPsi(")     dPsi_er(")  dEps(")     dEps_er(")
    // 1950.00   -0.188586    0.027653    0.403039    0.017069  99.9900000  99.9900000    0.110425    0.000000    0.012781    0.000000
    // 1981.00    0.071701    0.002000    0.359270    0.002000 -19.1947341   0.0001000    0.007149    0.002514    0.001842    0.001000
    // 1981-01-01 00:00 -> 2444605.5000000
 

    //Date           MJD      x          y        UT1-UTC       LOD         dPsi      dEps       x Err     y Err   UT1-UTC Err  LOD Err    dPsi Err   dEpsilon Err
    //                         "          "           s           s            "         "        "          "          s           s            "         "
    //2024   5  10  60440   0.012973   0.418728  -0.0213972  -0.0003291  -0.109229  -0.010160   0.000034   0.000026  0.0000144  0.0000081    0.000365    0.000123


    describe('changeTo', function() {
        // Note that these tests require the full time correlation data:

        it('UTC <-> UT1', function() {
            const corr : TimeCorrelation = new TimeCorrelation();
            const tsUtc : TimeStamp = new TimeStamp(TimeFormat.FORMAT_MJD, TimeConvention.TIME_UTC, 60440);
            const tsUt1 : TimeStamp = tsUtc.changeTo(corr, TimeFormat.FORMAT_MJD, TimeConvention.TIME_UT1);
            checkFloat(tsUt1.getMjd(),  60440 - 0.0213972 / 86400.0, nanoSecond);
            checkFloat(tsUt1.getJulian(),  2400000.5 + 60440 - 0.0213972 / 86400.0, nanoSecond);
            const tsUtc_2 : TimeStamp = tsUt1.changeTo(corr, TimeFormat.FORMAT_JULIAN, TimeConvention.TIME_UTC);
            checkFloat(tsUtc_2.getMjd(),  60440, nanoSecond);
            checkFloat(tsUtc_2.getJulian(),  2400000.5 + 60440, nanoSecond);
        });

        it('UT1 <-> TAI', function() {
            const corr : TimeCorrelation = new TimeCorrelation();
            const tsUt1 : TimeStamp = new TimeStamp(TimeFormat.FORMAT_JULIAN, TimeConvention.TIME_UT1, 2444605.5000000);
            const tsTai : TimeStamp = tsUt1.changeTo(corr, TimeFormat.FORMAT_JULIAN, TimeConvention.TIME_TAI);
            checkFloat(tsTai.getJulian(),  2444605.5000000 + 19.1947341 / 86400.0, nanoSecond);
            // Floating point error here is in order of 20 us.
            checkFloat(tsTai.getMjd(),  44605.0000000 + 19.1947341 / 86400.0, nanoSecond * 20000);
            const tsUt1_2 : TimeStamp = tsTai.changeTo(corr, TimeFormat.FORMAT_JULIAN, TimeConvention.TIME_UT1);
            checkFloat(tsUt1_2.getJulian(),  2444605.5000000, nanoSecond);
        });
    });
});