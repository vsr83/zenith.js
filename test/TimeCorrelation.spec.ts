import { checkFloat, checkFloatArray} from './common';
import 'mocha';
import { TimeConvention, TimeCorrelation } from '../src/TimeCorrelation';

describe('TimeCorrelation', function() {
    const nanoSecond = 1e-9 / 86400.0;
    //#  an         x(")        x_er(")     y(")        y_er(")    UT1-TAI(s)  UT1_er(s)    dPsi(")     dPsi_er(")  dEps(")     dEps_er(")
    // 1950.00   -0.188586    0.027653    0.403039    0.017069  99.9900000  99.9900000    0.110425    0.000000    0.012781    0.000000
    // 1981.00    0.071701    0.002000    0.359270    0.002000 -19.1947341   0.0001000    0.007149    0.002514    0.001842    0.001000
    // 1981-01-01 00:00 -> 2444605.5000000
 

    //Date           MJD      x          y        UT1-UTC       LOD         dPsi      dEps       x Err     y Err   UT1-UTC Err  LOD Err    dPsi Err   dEpsilon Err
    //                         "          "           s           s            "         "        "          "          s           s            "         "
    //2024   5  10  60440   0.012973   0.418728  -0.0213972  -0.0003291  -0.109229  -0.010160   0.000034   0.000026  0.0000144  0.0000081    0.000365    0.000123


    describe('computeOffset', function() {
        // Note that these tests require the full time correlation data:

        const corr : TimeCorrelation = new TimeCorrelation();
        it('TDT -> TAI', function() {
            checkFloat(corr.computeOffset(TimeConvention.TIME_TDT, TimeConvention.TIME_TAI, 0), -32.184 / 86400.0, nanoSecond);
        });
        it('TAI -> TDT', function() {
            checkFloat(corr.computeOffset(TimeConvention.TIME_TAI, TimeConvention.TIME_TDT, 0),  32.184 / 86400.0, nanoSecond);
        });
        it('TAI -> UT1', function() {            
            checkFloat(corr.computeOffset(TimeConvention.TIME_TAI, TimeConvention.TIME_UT1, 2444605.5000000), -19.1947341 / 86400.0, nanoSecond);
        });
        it('UT1 -> TAI', function() {
            checkFloat(corr.computeOffset(TimeConvention.TIME_UT1, TimeConvention.TIME_TAI, 2444605.5000000),  19.1947341 / 86400.0, nanoSecond);
        });
        it('UT1 -> UTC', function() {
            checkFloat(corr.computeOffset(TimeConvention.TIME_UT1, TimeConvention.TIME_UTC, 60440 + 2400000.5),  0.0213972 / 86400.0, nanoSecond);
        });
        it('UTC -> UT1', function() {
            checkFloat(corr.computeOffset(TimeConvention.TIME_UTC, TimeConvention.TIME_UT1, 60440 + 2400000.5), -0.0213972 / 86400.0, nanoSecond);
        });
        it('TAI -> UTC', function() {
            const deltaTaiUt1 = corr.computeOffset(TimeConvention.TIME_TAI, TimeConvention.TIME_UT1, 2460440.5);
            checkFloat(corr.computeOffset(TimeConvention.TIME_TAI, TimeConvention.TIME_UTC, 2460440.5), 
            deltaTaiUt1 +
            corr.computeOffset(TimeConvention.TIME_UT1, TimeConvention.TIME_UTC, 2460440.5 + deltaTaiUt1), nanoSecond);
        });
        it('UTC -> TAI', function() {
            const deltaUtcUt1 = corr.computeOffset(TimeConvention.TIME_UTC, TimeConvention.TIME_UT1, 2460440.5);
            checkFloat(corr.computeOffset(TimeConvention.TIME_UTC, TimeConvention.TIME_TAI, 2460440.5), 
            deltaUtcUt1 +
            corr.computeOffset(TimeConvention.TIME_UT1, TimeConvention.TIME_TAI, 2460440.5 + deltaUtcUt1), nanoSecond);
        });
        it('TDT -> UT1', function() {
            const deltaTdtTai = corr.computeOffset(TimeConvention.TIME_TDT, TimeConvention.TIME_TAI, 2460440.5);
            checkFloat(corr.computeOffset(TimeConvention.TIME_TDT, TimeConvention.TIME_UT1, 2460440.5), 
            deltaTdtTai +
            corr.computeOffset(TimeConvention.TIME_TAI, TimeConvention.TIME_UT1, 2460440.5 + deltaTdtTai), nanoSecond);
        });
        it('UT1 -> TDT', function() {
            const deltaUt1Tai = corr.computeOffset(TimeConvention.TIME_UT1, TimeConvention.TIME_TAI, 2460440.5);
            checkFloat(corr.computeOffset(TimeConvention.TIME_UT1, TimeConvention.TIME_TDT, 2460440.5), 
            deltaUt1Tai +
            corr.computeOffset(TimeConvention.TIME_TAI, TimeConvention.TIME_TDT, 2460440.5 + deltaUt1Tai), nanoSecond);
        });
        it('TDT -> UTC', function() {
            const deltaTdtTai = corr.computeOffset(TimeConvention.TIME_TDT, TimeConvention.TIME_TAI, 2460440.5);
            const deltaTaiUt1 = corr.computeOffset(TimeConvention.TIME_TAI, TimeConvention.TIME_UT1, 2460440.5 + deltaTdtTai);
            checkFloat(corr.computeOffset(TimeConvention.TIME_TDT, TimeConvention.TIME_UTC, 2460440.5), 
            deltaTdtTai + deltaTaiUt1 + 
            corr.computeOffset(TimeConvention.TIME_UT1, TimeConvention.TIME_UTC, 2460440.5 + deltaTdtTai + deltaTaiUt1), nanoSecond);
        });
        it('UTC -> TDT', function() {
            const deltaUtcUt1 = corr.computeOffset(TimeConvention.TIME_UTC, TimeConvention.TIME_UT1, 2460440.5);
            const deltaUt1Tai = corr.computeOffset(TimeConvention.TIME_UT1, TimeConvention.TIME_TAI, 2460440.5 + deltaUtcUt1);
            checkFloat(corr.computeOffset(TimeConvention.TIME_UTC, TimeConvention.TIME_TDT, 2460440.5), 
            deltaUtcUt1 + deltaUt1Tai +  
            corr.computeOffset(TimeConvention.TIME_TAI, TimeConvention.TIME_TDT, 2460440.5 + deltaUtcUt1 + deltaUt1Tai), nanoSecond);
        });

    });
});