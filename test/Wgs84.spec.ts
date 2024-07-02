import { checkFloat, checkFloatArray} from './common';
import 'mocha';
import {Wgs84, EarthPosition} from '../src/Wgs84'

describe('Wgs84', function() {
    describe('coordEfiWgs84, coordWgs84Efi', function() {
        it('Venus', function() {
            const rEfi = [-87838751662.35324,
                           52736029625.35403,
                          -25596488029.92342];
            const latExp = -14.02735035654504;
            const lonExp = 149.0205247603176;
            const hExp = 105596252409.9468;

            const {lat, lon, h} = Wgs84.coordEfiWgs84(rEfi, 10, 1e-16, false);
            checkFloat(lat, latExp, 1e-10);
            checkFloat(lon, lonExp, 1e-10);
            checkFloat(h, hExp, 1);

            const rEfi2 = Wgs84.coordWgs84Efi({lat : lat, lon : lon, h : h});
            checkFloatArray(rEfi2, rEfi, 1);
        });
    });
});