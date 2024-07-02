import { checkFloat, checkFloatArray} from './common';
import 'mocha';
import {Nutation, NutationData} from '../src/Nutation';
import {TimeCorrelation, TimeConvention } from '../src/TimeCorrelation';
import { TimeStamp, TimeFormat } from '../src/TimeStamp';

describe('Nutation', function() {
    describe('iau1980', function() {
        it('IAU SOFA', function() {
            const timeCorr : TimeCorrelation = new TimeCorrelation();

            // iauNut80, iauObl80 methods from IAU SOFA:
            // JT_TT, eps, dpsi, deps
            const iauSofaData = [
            [2401544.00000, 23.45709160199038123551,  0.00495827640891064771, -0.00069214123273692398],
            [2411544.00000, 23.45353199624529594303, -0.00468988023509592233,  0.00019500594172398153],
            [2431544.00000, 23.44641202889533460052, -0.00475010707183782816, -0.00042810693710820336],
            [2421544.00000, 23.44997211787627122703,  0.00431893501869127627,  0.00019385277736049916],
            [2441544.00000, 23.44285179131450291834,  0.00457616296048341930,  0.00113240503951782929],
            [2451544.00000, 23.43929146714579303534, -0.00386535069222448697, -0.00159876220796256892],
            [2451544.25000, 23.43929137813712415550, -0.00386670768736087269, -0.00159987652486421380],
            [2451544.50000, 23.43929128912845172295, -0.00386754982186620104, -0.00160111014026440858],
            [2451544.75000, 23.43929120011978284310, -0.00386785492825158670, -0.00160243826896703579]];

            for (let indJT = 0; indJT < iauSofaData.length; indJT++)
            {
                const JTtdb = iauSofaData[indJT][0];
                const eps   = iauSofaData[indJT][1];
                const dpsi  = iauSofaData[indJT][2];
                const deps  = iauSofaData[indJT][3];
                const timeStamp : TimeStamp = new TimeStamp(TimeFormat.FORMAT_JULIAN, TimeConvention.TIME_TDB, JTtdb);
                const nutData : NutationData = Nutation.iau1980(timeStamp.getJulian());

                checkFloat(nutData.eps, eps, 1e-10);
                checkFloat(nutData.deps, deps, 1e-10);
                checkFloat(nutData.dpsi, dpsi, 1e-10);
            }
        });
    });
});