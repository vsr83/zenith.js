import { checkFloat, checkFloatArray} from './common';
import { MathUtils } from '../src';
import 'mocha';

describe('MathUtils', function() {
    it('rad2Deg', function() {
        checkFloat(MathUtils.rad2Deg(0.0 * Math.PI), 0, 1e-9);
        checkFloat(MathUtils.rad2Deg(0.5 * Math.PI), 90, 1e-9);
        checkFloat(MathUtils.rad2Deg(1.0 * Math.PI), 180, 1e-9);
        checkFloat(MathUtils.rad2Deg(1.5 * Math.PI), 270, 1e-9);
        checkFloat(MathUtils.rad2Deg(2.0 * Math.PI), 360, 1e-9);
    })
    it('deg2Rad', function() {
        checkFloat(MathUtils.deg2Rad(0.0),   0.0 * Math.PI, 1e-9);
        checkFloat(MathUtils.deg2Rad(90.0),  0.5 * Math.PI, 1e-9);
        checkFloat(MathUtils.deg2Rad(180.0), 1.0 * Math.PI, 1e-9);
        checkFloat(MathUtils.deg2Rad(270.0), 1.5 * Math.PI, 1e-9);
        checkFloat(MathUtils.deg2Rad(360.0), 2.0 * Math.PI, 1e-9);
    })
    it('sind', function() {
        checkFloat(MathUtils.sind(0.0),    0, 1e-9);
        checkFloat(MathUtils.sind(90.0),   1, 1e-9);
        checkFloat(MathUtils.sind(180.0),  0, 1e-9);
        checkFloat(MathUtils.sind(270.0), -1, 1e-9);
        checkFloat(MathUtils.sind(360.0),  0, 1e-9);
    });
    it('cosd', function() {
        checkFloat(MathUtils.cosd(0.0),    1, 1e-9);
        checkFloat(MathUtils.cosd(90.0),   0, 1e-9);
        checkFloat(MathUtils.cosd(180.0), -1, 1e-9);
        checkFloat(MathUtils.cosd(270.0),  0, 1e-9);
        checkFloat(MathUtils.cosd(360.0),  1, 1e-9);
    });
    it('asind', function() {
        checkFloat(MathUtils.asind(1.0), 90, 1e-9);
        checkFloat(MathUtils.asind(0.0), 0, 1e-9);
        checkFloat(MathUtils.asind(-1.0), -90, 1e-9);
    });
    it('acosd', function() {
        checkFloat(MathUtils.acosd(1.0), 0, 1e-9);
        checkFloat(MathUtils.acosd(0.0), 90, 1e-9);
        checkFloat(MathUtils.acosd(-1.0), 180, 1e-9);
    });
    it('atand', function() {
        checkFloat(MathUtils.atand(1.0), 45, 1e-9);
        checkFloat(MathUtils.atand(0.0), 0, 1e-9);
        checkFloat(MathUtils.atand(-1.0), -45, 1e-9);
    });
    it('atan2d', function() {
        checkFloat(MathUtils.atan2d(0.0, 1.0), 0, 1e-9);
        checkFloat(MathUtils.atan2d(1.0, 0.0), 90, 1e-9);
        checkFloat(MathUtils.atan2d(0.0, -1.0), 180, 1e-9);
        checkFloat(MathUtils.atan2d(-1.0, 0.0), -90, 1e-9);
    });
    it('cross', function() {
        checkFloatArray(MathUtils.cross([0, 1, 0], [0, 0, 1]), [1, 0, 0], 1e-9);
        checkFloatArray(MathUtils.cross([0, 0, 1], [1, 0, 0]), [0, 1, 0], 1e-9);
        checkFloatArray(MathUtils.cross([1, 0, 0], [0, 1, 0]), [0, 0, 1], 1e-9);
        checkFloatArray(MathUtils.cross([0, 2, 1], [0, 0, 1]), [2, 0, 0], 1e-9);
        checkFloatArray(MathUtils.cross([0, 0, 4], [1, 0, 1]), [0, 4, 0], 1e-9);
        checkFloatArray(MathUtils.cross([8, 0, 0], [1, 1, 0]), [0, 0, 8], 1e-9);
    });
    it('dot', function() {
        checkFloat(MathUtils.dot([1, 0, 0],[1, 0, 0]), 1, 1e-9);
        checkFloat(MathUtils.dot([0, 1, 0],[0, 1, 0]), 1, 1e-9);
        checkFloat(MathUtils.dot([0, 0, 1],[0, 0, 1]), 1, 1e-9);
        checkFloat(MathUtils.dot([1, 0, 0],[0, 1, 0]), 0, 1e-9);
        checkFloat(MathUtils.dot([1, 0, 0],[0, 0, 1]), 0, 1e-9);
        checkFloat(MathUtils.dot([0, 1, 0],[0, 0, 1]), 0, 1e-9);
        checkFloat(MathUtils.dot([1, 2, 4],[2, 4, 8]), 1*2 + 2*4 + 4*8, 1e-9);
    });
    it('norm', function() {
        checkFloat(MathUtils.norm([1, 0, 0]), 1, 1e-9);
        checkFloat(MathUtils.norm([0, 2, 0]), 2, 1e-9);
        checkFloat(MathUtils.norm([0, 0, 4]), 4, 1e-9);
        checkFloat(MathUtils.norm([1, 1, 1]), Math.sqrt(3), 1e-9);
    });
    it('vecSum', function() {
        checkFloatArray(MathUtils.vecSum([1, 2, 3], [4, 5, 6]), [5, 7, 9], 1e-9);
    });
    it('linComb', function() {
        checkFloatArray(MathUtils.linComb([], [[1, 2, 3]]), [0, 0, 0], 1e-9);
        checkFloatArray(MathUtils.linComb([1, 2, 4], 
            [[1, 0, 0], [0, 0.5, 0], [0, 0, 0.25]]), [1, 1, 1], 1e-9);
    });
    it('vecDiff', function() {
        checkFloatArray(MathUtils.vecDiff([1, 2, 3], [4, 5, 6]), [-3, -3, -3], 1e-9);
    });
    it('vecMul', function() {
        checkFloatArray(MathUtils.vecMul([1, 2, 3],  -2), [-2, -4, -6], 1e-9);
    });
});