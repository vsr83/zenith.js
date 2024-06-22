import { checkFloat, checkFloatArray} from './common';
import { MathUtils, SiderealTime } from '../src';
import 'mocha';
import { FrameConversions, FrameCenter, FrameOrientation } from '../src/Frames';
import { TimeFormat, TimeStamp } from '../src/TimeStamp';
import { StateVector } from '../src/StateVector';
import { TimeConvention } from '../src/TimeCorrelation';
import {AssertionError, strict as assert} from 'assert';
import { NutationData, Nutation } from '../src/Nutation';
import { EarthPosition, Wgs84 } from '../src/Wgs84';

describe('Frames', function() {
    it('rotateJ2000Mod', function() {
        const timeStamp : TimeStamp = new TimeStamp(
            TimeFormat.FORMAT_JULIAN, 
            TimeConvention.TIME_TDB,
            2458849.5000000);

        const osvJ2000_1 : StateVector = {
            frameCenter : FrameCenter.CENTER_GEO,
            frameOrientation : FrameOrientation.J2000_EQ,
            position : [1, 0, 0],
            velocity : [1, 0, 0],
            timeStamp : timeStamp
        };
        const osvJ2000_2 : StateVector = {
            frameCenter : FrameCenter.CENTER_GEO,
            frameOrientation : FrameOrientation.J2000_EQ,
            position : [0, 1, 0],
            velocity : [0, 1, 0],
            timeStamp : timeStamp
        };
        const osvJ2000_3 : StateVector = {
            frameCenter : FrameCenter.CENTER_GEO,
            frameOrientation : FrameOrientation.J2000_EQ,
            position : [0, 0, 1],
            velocity : [0, 0, 1],
            timeStamp : timeStamp
        };
        const osvMod_1_exp : StateVector = {
            frameCenter : FrameCenter.CENTER_GEO,
            frameOrientation : FrameOrientation.J2000_EQ,
            position : [0.9999881111996561, 0.004472291294412529, 0.0019432112397220493],
            velocity : [0.9999881111996561, 0.004472291294412529, 0.0019432112397220493],
            timeStamp : timeStamp
        };
        const osvMod_2_exp : StateVector = {
            frameCenter : FrameCenter.CENTER_GEO,
            frameOrientation : FrameOrientation.J2000_EQ,
            position : [-0.004472291294702779, 0.9999899992458399, -0.000004345179819155259],
            velocity : [-0.004472291294702779, 0.9999899992458399, -0.000004345179819155259],
            timeStamp : timeStamp
        };
        const osvMod_3_exp : StateVector = {
            frameCenter : FrameCenter.CENTER_GEO,
            frameOrientation : FrameOrientation.J2000_EQ,
            position : [-0.0019432112390540374, -0.000004345478550997587, 0.9999981119538163],
            velocity : [-0.0019432112390540374, -0.000004345478550997587, 0.9999981119538163],
            timeStamp : timeStamp
        };

        const jtTdb = 2458849.5000000;

        const osvMod_1 = FrameConversions.rotateJ2000Mod(osvJ2000_1, jtTdb);
        const osvMod_2 = FrameConversions.rotateJ2000Mod(osvJ2000_2, jtTdb);
        const osvMod_3 = FrameConversions.rotateJ2000Mod(osvJ2000_3, jtTdb);

        assert.equal(osvMod_1.frameCenter, FrameCenter.CENTER_GEO);
        assert.equal(osvMod_1.frameOrientation, FrameOrientation.MOD);
        assert.equal(osvMod_1.timeStamp, osvMod_1_exp.timeStamp);
        checkFloatArray(osvMod_1.position, osvMod_1_exp.position, 1e-15);
        checkFloatArray(osvMod_1.velocity, osvMod_1_exp.velocity, 1e-15);

        assert.equal(osvMod_2.frameCenter, FrameCenter.CENTER_GEO);
        assert.equal(osvMod_2.frameOrientation, FrameOrientation.MOD);
        assert.equal(osvMod_2.timeStamp, osvMod_2_exp.timeStamp);
        checkFloatArray(osvMod_2.position, osvMod_2_exp.position, 1e-15);
        checkFloatArray(osvMod_2.velocity, osvMod_2_exp.velocity, 1e-15);

        assert.equal(osvMod_3.frameCenter, FrameCenter.CENTER_GEO);
        assert.equal(osvMod_3.frameOrientation, FrameOrientation.MOD);
        assert.equal(osvMod_3.timeStamp, osvMod_3_exp.timeStamp);
        checkFloatArray(osvMod_3.position, osvMod_3_exp.position, 1e-15);
        checkFloatArray(osvMod_3.velocity, osvMod_3_exp.velocity, 1e-15);
    });

    it('rotateModJ2000', function() {
        const timeStamp : TimeStamp = new TimeStamp(
            TimeFormat.FORMAT_JULIAN, 
            TimeConvention.TIME_TDB,
            2458849.5000000);

        const osvMod_1 : StateVector = {
            frameCenter : FrameCenter.CENTER_GEO,
            frameOrientation : FrameOrientation.MOD,
            position : [1, 0, 0],
            velocity : [1, 0, 0],
            timeStamp : timeStamp
        };
        const osvMod_2 : StateVector = {
            frameCenter : FrameCenter.CENTER_GEO,
            frameOrientation : FrameOrientation.MOD,
            position : [0, 1, 0],
            velocity : [0, 1, 0],
            timeStamp : timeStamp
        };
        const osvMod_3 : StateVector = {
            frameCenter : FrameCenter.CENTER_GEO,
            frameOrientation : FrameOrientation.MOD,
            position : [0, 0, 1],
            velocity : [0, 0, 1],
            timeStamp : timeStamp
        };
        const osvJ2000_1_exp : StateVector = {
            frameCenter : FrameCenter.CENTER_GEO,
            frameOrientation : FrameOrientation.J2000_EQ,
            position : [0.9999881111996561, -0.004472291294702779, -0.0019432112390540374],
            velocity : [0.9999881111996561, -0.004472291294702779, -0.0019432112390540374],
            timeStamp : timeStamp
        };
        const osvJ2000_2_exp : StateVector = {
            frameCenter : FrameCenter.CENTER_GEO,
            frameOrientation : FrameOrientation.J2000_EQ,
            position : [0.004472291294412529, 0.9999899992458399, -0.000004345478550997587],
            velocity : [0.004472291294412529, 0.9999899992458399, -0.000004345478550997587],
            timeStamp : timeStamp
        };
        const osvJ2000_3_exp : StateVector = {
            frameCenter : FrameCenter.CENTER_GEO,
            frameOrientation : FrameOrientation.J2000_EQ,
            position : [0.0019432112397220493, -0.000004345179819155259, 0.9999981119538163],
            velocity : [0.0019432112397220493, -0.000004345179819155259, 0.9999981119538163],
            timeStamp : timeStamp
        };

        const jtTdb = 2458849.5000000;

        const osvJ2000_1 = FrameConversions.rotateModJ2000(osvMod_1, jtTdb);
        const osvJ2000_2 = FrameConversions.rotateModJ2000(osvMod_2, jtTdb);
        const osvJ2000_3 = FrameConversions.rotateModJ2000(osvMod_3, jtTdb);

        assert.equal(osvJ2000_1.frameCenter, FrameCenter.CENTER_GEO);
        assert.equal(osvJ2000_1.frameOrientation, FrameOrientation.J2000_EQ);
        assert.equal(osvJ2000_1.timeStamp, osvJ2000_1_exp.timeStamp);
        checkFloatArray(osvJ2000_1.position, osvJ2000_1_exp.position, 1e-15);
        checkFloatArray(osvJ2000_1.velocity, osvJ2000_1_exp.velocity, 1e-15);

        assert.equal(osvJ2000_2.frameCenter, FrameCenter.CENTER_GEO);
        assert.equal(osvJ2000_2.frameOrientation, FrameOrientation.J2000_EQ);
        assert.equal(osvJ2000_2.timeStamp, osvJ2000_2_exp.timeStamp);
        checkFloatArray(osvJ2000_2.position, osvJ2000_2_exp.position, 1e-15);
        checkFloatArray(osvJ2000_2.velocity, osvJ2000_2_exp.velocity, 1e-15);

        assert.equal(osvJ2000_3.frameCenter, FrameCenter.CENTER_GEO);
        assert.equal(osvJ2000_3.frameOrientation, FrameOrientation.J2000_EQ);
        assert.equal(osvJ2000_3.timeStamp, osvJ2000_3_exp.timeStamp);
        checkFloatArray(osvJ2000_3.position, osvJ2000_3_exp.position, 1e-15);
        checkFloatArray(osvJ2000_3.velocity, osvJ2000_3_exp.velocity, 1e-15);
    });

    it('rotateModTod', function() {
        const timeStamp : TimeStamp = new TimeStamp(
            TimeFormat.FORMAT_JULIAN, 
            TimeConvention.TIME_TDB,
            2458849.5000000);

        const osvMoD_1 : StateVector = {
            frameCenter : FrameCenter.CENTER_GEO,
            frameOrientation : FrameOrientation.MOD,
            position : [1, 0, 0],
            velocity : [1, 0, 0],
            timeStamp : timeStamp
        };
        const osvMoD_2 : StateVector = {
            frameCenter : FrameCenter.CENTER_GEO,
            frameOrientation : FrameOrientation.MOD,
            position : [0, 1, 0],
            velocity : [0, 1, 0],
            timeStamp : timeStamp
        };
        const osvMoD_3 : StateVector = {
            frameCenter : FrameCenter.CENTER_GEO,
            frameOrientation : FrameOrientation.MOD,
            position : [0, 0, 1],
            velocity : [0, 0, 1],
            timeStamp : timeStamp
        };
        const osvTod_1_exp : StateVector = {
            frameCenter : FrameCenter.CENTER_GEO,
            frameOrientation : FrameOrientation.TOD,
            position : [0.9999999968057675, -0.00007333409765325254, -0.000031789547169624676],
            velocity : [0.9999999968057675, -0.00007333409765325254, -0.000031789547169624676],
            timeStamp : timeStamp
        };
        const osvTod_2_exp : StateVector = {
            frameCenter : FrameCenter.CENTER_GEO,
            frameOrientation : FrameOrientation.TOD,
            position : [0.00007333383452258797, 0.9999999972768087, -0.000008278356584179303],
            velocity : [0.00007333383452258797, 0.9999999972768087, -0.000008278356584179303],
            timeStamp : timeStamp
        };
        const osvTod_3_exp : StateVector = {
            frameCenter : FrameCenter.CENTER_GEO,
            frameOrientation : FrameOrientation.TOD,
            position : [0.00003179015416886581, 0.000008276025308340262, 0.9999999994604467],
            velocity : [0.00003179015416886581, 0.000008276025308340262, 0.9999999994604467],
            timeStamp : timeStamp
        };

        const jtTdb = 2458849.5000000;
        const nutData : NutationData = Nutation.iau1980(jtTdb);

        const osvTod_1 = FrameConversions.rotateModTod(osvMoD_1, nutData);
        const osvTod_2 = FrameConversions.rotateModTod(osvMoD_2, nutData);
        const osvTod_3 = FrameConversions.rotateModTod(osvMoD_3, nutData);

        assert.equal(osvTod_1.frameCenter, FrameCenter.CENTER_GEO);
        assert.equal(osvTod_1.frameOrientation, FrameOrientation.TOD);
        assert.equal(osvTod_1.timeStamp, osvTod_1_exp.timeStamp);
        checkFloatArray(osvTod_1.position, osvTod_1_exp.position, 1e-15);
        checkFloatArray(osvTod_1.velocity, osvTod_1_exp.velocity, 1e-15);

        assert.equal(osvTod_2.frameCenter, FrameCenter.CENTER_GEO);
        assert.equal(osvTod_2.frameOrientation, FrameOrientation.TOD);
        assert.equal(osvTod_2.timeStamp, osvTod_2_exp.timeStamp);
        checkFloatArray(osvTod_2.position, osvTod_2_exp.position, 1e-15);
        checkFloatArray(osvTod_2.velocity, osvTod_2_exp.velocity, 1e-15);

        assert.equal(osvTod_3.frameCenter, FrameCenter.CENTER_GEO);
        assert.equal(osvTod_3.frameOrientation, FrameOrientation.TOD);
        assert.equal(osvTod_3.timeStamp, osvTod_3_exp.timeStamp);
        checkFloatArray(osvTod_3.position, osvTod_3_exp.position, 1e-15);
        checkFloatArray(osvTod_3.velocity, osvTod_3_exp.velocity, 1e-15);
    });

    it('rotateTodMod', function() {
        const timeStamp : TimeStamp = new TimeStamp(
            TimeFormat.FORMAT_JULIAN, 
            TimeConvention.TIME_TDB,
            2458849.5000000);

        const osvToD_1 : StateVector = {
            frameCenter : FrameCenter.CENTER_GEO,
            frameOrientation : FrameOrientation.TOD,
            position : [1, 0, 0],
            velocity : [1, 0, 0],
            timeStamp : timeStamp
        };
        const osvToD_2 : StateVector = {
            frameCenter : FrameCenter.CENTER_GEO,
            frameOrientation : FrameOrientation.TOD,
            position : [0, 1, 0],
            velocity : [0, 1, 0],
            timeStamp : timeStamp
        };
        const osvToD_3 : StateVector = {
            frameCenter : FrameCenter.CENTER_GEO,
            frameOrientation : FrameOrientation.TOD,
            position : [0, 0, 1],
            velocity : [0, 0, 1],
            timeStamp : timeStamp
        };
        const osvMod_1_exp : StateVector = {
            frameCenter : FrameCenter.CENTER_GEO,
            frameOrientation : FrameOrientation.MOD,
            position : [0.9999999968057675, 0.00007333383452258797, 0.00003179015416886581],
            velocity : [0.9999999968057675, 0.00007333383452258797, 0.00003179015416886581],
            timeStamp : timeStamp
        };
        const osvMod_2_exp : StateVector = {
            frameCenter : FrameCenter.CENTER_GEO,
            frameOrientation : FrameOrientation.MOD,
            position : [-0.00007333409765325254, 0.9999999972768088, 0.000008276025308340262],
            velocity : [-0.00007333409765325254, 0.9999999972768088, 0.000008276025308340262],
            timeStamp : timeStamp
        };
        const osvMod_3_exp : StateVector = {
            frameCenter : FrameCenter.CENTER_GEO,
            frameOrientation : FrameOrientation.MOD,
            position : [-0.000031789547169624676, -0.000008278356584179303, 0.9999999994604467],
            velocity : [-0.000031789547169624676, -0.000008278356584179303, 0.9999999994604467],
            timeStamp : timeStamp
        };

        const jtTdb = 2458849.5000000;
        const nutData : NutationData = Nutation.iau1980(jtTdb);

        const osvMod_1 = FrameConversions.rotateTodMod(osvToD_1, nutData);
        const osvMod_2 = FrameConversions.rotateTodMod(osvToD_2, nutData);
        const osvMod_3 = FrameConversions.rotateTodMod(osvToD_3, nutData);

        assert.equal(osvMod_1.frameCenter, FrameCenter.CENTER_GEO);
        assert.equal(osvMod_1.frameOrientation, FrameOrientation.MOD);
        assert.equal(osvMod_1.timeStamp, osvMod_1_exp.timeStamp);
        checkFloatArray(osvMod_1.position, osvMod_1_exp.position, 1e-15);
        checkFloatArray(osvMod_1.velocity, osvMod_1_exp.velocity, 1e-15);

        assert.equal(osvMod_2.frameCenter, FrameCenter.CENTER_GEO);
        assert.equal(osvMod_2.frameOrientation, FrameOrientation.MOD);
        assert.equal(osvMod_2.timeStamp, osvMod_2_exp.timeStamp);
        checkFloatArray(osvMod_2.position, osvMod_2_exp.position, 1e-15);
        checkFloatArray(osvMod_2.velocity, osvMod_2_exp.velocity, 1e-15);

        assert.equal(osvMod_3.frameCenter, FrameCenter.CENTER_GEO);
        assert.equal(osvMod_3.frameOrientation, FrameOrientation.MOD);
        assert.equal(osvMod_3.timeStamp, osvMod_3_exp.timeStamp);
        checkFloatArray(osvMod_3.position, osvMod_3_exp.position, 1e-15);
        checkFloatArray(osvMod_3.velocity, osvMod_3_exp.velocity, 1e-15);
    });

    it('rotateTodPef', function() {
        const timeStamp : TimeStamp = new TimeStamp(
            TimeFormat.FORMAT_JULIAN, 
            TimeConvention.TIME_TDB,
            2458849.5000000);

        const osvToD_1 : StateVector = {
            frameCenter : FrameCenter.CENTER_GEO,
            frameOrientation : FrameOrientation.TOD,
            position : [1, 0, 0],
            velocity : [1, 0, 0],
            timeStamp : timeStamp
        };
        const osvToD_2 : StateVector = {
            frameCenter : FrameCenter.CENTER_GEO,
            frameOrientation : FrameOrientation.TOD,
            position : [0, 1, 0],
            velocity : [0, 1, 0],
            timeStamp : timeStamp
        };
        const osvToD_3 : StateVector = {
            frameCenter : FrameCenter.CENTER_GEO,
            frameOrientation : FrameOrientation.TOD,
            position : [0, 0, 1],
            velocity : [0, 0, 1],
            timeStamp : timeStamp
        };
        const osvPef_1_exp : StateVector = {
            frameCenter : FrameCenter.CENTER_GEO,
            frameOrientation : FrameOrientation.PEF,
            position : [-0.17566927104019348, -0.9844492405463102, 0],
            velocity : [-0.1757410582193516, -0.9844364305395437, 0],
            timeStamp : timeStamp
        };
        const osvPef_2_exp : StateVector = {
            frameCenter : FrameCenter.CENTER_GEO,
            frameOrientation : FrameOrientation.PEF,
            position : [0.9844492405463102, -0.17566927104019348, 0],
            velocity : [0.9844364305395437, -0.1757410582193516, 0],
            timeStamp : timeStamp
        };
        const osvPef_3_exp : StateVector = {
            frameCenter : FrameCenter.CENTER_GEO,
            frameOrientation : FrameOrientation.PEF,
            position : [0, 0, 1],
            velocity : [0, 0, 1],
            timeStamp : timeStamp
        };

        const jtUt1 = 2458849.5000000;
        const nutData : NutationData = Nutation.iau1980(jtUt1);
        const GAST : number = SiderealTime.timeGast(jtUt1, jtUt1, nutData);
        //console.log(GAST);

        // orbits.js has an inaccurate GAST compuation with almost 1 mas error.

        const osvPef_1 = FrameConversions.rotateTodPef(osvToD_1, GAST, jtUt1);
        const osvPef_2 = FrameConversions.rotateTodPef(osvToD_2, GAST, jtUt1);
        const osvPef_3 = FrameConversions.rotateTodPef(osvToD_3, GAST, jtUt1);

        assert.equal(osvPef_1.frameCenter, FrameCenter.CENTER_GEO);
        assert.equal(osvPef_1.frameOrientation, FrameOrientation.PEF);
        assert.equal(osvPef_1.timeStamp, osvPef_1_exp.timeStamp);
        checkFloatArray(osvPef_1.position, osvPef_1_exp.position, 1e-9);
        checkFloatArray(osvPef_1.velocity, osvPef_1_exp.velocity, 1e-9);

        assert.equal(osvPef_2.frameCenter, FrameCenter.CENTER_GEO);
        assert.equal(osvPef_2.frameOrientation, FrameOrientation.PEF);
        assert.equal(osvPef_2.timeStamp, osvPef_2_exp.timeStamp);
        checkFloatArray(osvPef_2.position, osvPef_2_exp.position, 1e-9);
        checkFloatArray(osvPef_2.velocity, osvPef_2_exp.velocity, 1e-9);

        assert.equal(osvPef_3.frameCenter, FrameCenter.CENTER_GEO);
        assert.equal(osvPef_3.frameOrientation, FrameOrientation.PEF);
        assert.equal(osvPef_3.timeStamp, osvPef_3_exp.timeStamp);
        checkFloatArray(osvPef_3.position, osvPef_3_exp.position, 1e-9);
        checkFloatArray(osvPef_3.velocity, osvPef_3_exp.velocity, 1e-9);
    });

    it('rotatePefTod', function() {
        const timeStamp : TimeStamp = new TimeStamp(
            TimeFormat.FORMAT_JULIAN, 
            TimeConvention.TIME_TDB,
            2458849.5000000);

        const osvPef_1 : StateVector = {
            frameCenter : FrameCenter.CENTER_GEO,
            frameOrientation : FrameOrientation.PEF,
            position : [1, 0, 0],
            velocity : [1, 0, 0],
            timeStamp : timeStamp
        };
        const osvPef_2 : StateVector = {
            frameCenter : FrameCenter.CENTER_GEO,
            frameOrientation : FrameOrientation.PEF,
            position : [0, 1, 0],
            velocity : [0, 1, 0],
            timeStamp : timeStamp
        };
        const osvPef_3 : StateVector = {
            frameCenter : FrameCenter.CENTER_GEO,
            frameOrientation : FrameOrientation.PEF,
            position : [0, 0, 1],
            velocity : [0, 0, 1],
            timeStamp : timeStamp
        };
        const osvTod_1_exp : StateVector = {
            frameCenter : FrameCenter.CENTER_GEO,
            frameOrientation : FrameOrientation.TOD,
            position : [-0.17566927104019348, 0.9844492405463102, 0],
            velocity : [-0.1757410582193516, 0.9844364305395437, 0],
            timeStamp : timeStamp
        };
        const osvTod_2_exp : StateVector = {
            frameCenter : FrameCenter.CENTER_GEO,
            frameOrientation : FrameOrientation.TOD,
            position : [-0.9844492405463102, -0.17566927104019348, 0],
            velocity : [-0.9844364305395437, -0.1757410582193516, 0],
            timeStamp : timeStamp
        };
        const osvTod_3_exp : StateVector = {
            frameCenter : FrameCenter.CENTER_GEO,
            frameOrientation : FrameOrientation.TOD,
            position : [0, 0, 1],
            velocity : [0, 0, 1],
            timeStamp : timeStamp
        };

        const jtUt1 = 2458849.5000000;
        const nutData : NutationData = Nutation.iau1980(jtUt1);
        const GAST : number = SiderealTime.timeGast(jtUt1, jtUt1, nutData);
        //console.log(GAST);

        // orbits.js has an inaccurate GAST compuation with almost 1 mas error.

        const osvTod_1 = FrameConversions.rotatePefTod(osvPef_1, GAST, jtUt1);
        const osvTod_2 = FrameConversions.rotatePefTod(osvPef_2, GAST, jtUt1);
        const osvTod_3 = FrameConversions.rotatePefTod(osvPef_3, GAST, jtUt1);

        assert.equal(osvTod_1.frameCenter, FrameCenter.CENTER_GEO);
        assert.equal(osvTod_1.frameOrientation, FrameOrientation.TOD);
        assert.equal(osvTod_1.timeStamp, osvTod_1_exp.timeStamp);
        checkFloatArray(osvTod_1.position, osvTod_1_exp.position, 1e-9);
        checkFloatArray(osvTod_1.velocity, osvTod_1_exp.velocity, 1e-9);

        assert.equal(osvTod_2.frameCenter, FrameCenter.CENTER_GEO);
        assert.equal(osvTod_2.frameOrientation, FrameOrientation.TOD);
        assert.equal(osvTod_2.timeStamp, osvTod_2_exp.timeStamp);
        checkFloatArray(osvTod_2.position, osvTod_2_exp.position, 1e-9);
        checkFloatArray(osvTod_2.velocity, osvTod_2_exp.velocity, 1e-9);

        assert.equal(osvTod_3.frameCenter, FrameCenter.CENTER_GEO);
        assert.equal(osvTod_3.frameOrientation, FrameOrientation.TOD);
        assert.equal(osvTod_3.timeStamp, osvTod_3_exp.timeStamp);
        checkFloatArray(osvTod_3.position, osvTod_3_exp.position, 1e-9);
        checkFloatArray(osvTod_3.velocity, osvTod_3_exp.velocity, 1e-9);
    });

    it('rotatePefEfi', function() {
        const timeStamp : TimeStamp = new TimeStamp(
            TimeFormat.FORMAT_JULIAN, 
            TimeConvention.TIME_TDB,
            2458849.5000000);

        const osvPef_1 : StateVector = {
            frameCenter : FrameCenter.CENTER_GEO,
            frameOrientation : FrameOrientation.PEF,
            position : [1, 0, 0],
            velocity : [1, 0, 0],
            timeStamp : timeStamp
        };
        const osvPef_2 : StateVector = {
            frameCenter : FrameCenter.CENTER_GEO,
            frameOrientation : FrameOrientation.PEF,
            position : [0, 1, 0],
            velocity : [0, 1, 0],
            timeStamp : timeStamp
        };
        const osvPef_3 : StateVector = {
            frameCenter : FrameCenter.CENTER_GEO,
            frameOrientation : FrameOrientation.PEF,
            position : [0, 0, 1],
            velocity : [0, 0, 1],
            timeStamp : timeStamp
        };
        const osvEfi_1_exp : StateVector = {
            frameCenter : FrameCenter.CENTER_GEO,
            frameOrientation : FrameOrientation.EFI,
            position : [0.9999984769132877, 0, -0.0017453283658983088],
            velocity : [0.9999984769132877, 0, -0.0017453283658983088],
            timeStamp : timeStamp
        };
        const osvEfi_2_exp : StateVector = {
            frameCenter : FrameCenter.CENTER_GEO,
            frameOrientation : FrameOrientation.EFI,
            position : [0.000006092332930453056, 0.9999939076577904, 0.0034906460986589443],
            velocity : [0.000006092332930453056, 0.9999939076577904, 0.0034906460986589443],
            timeStamp : timeStamp
        };
        const osvEfi_3_exp : StateVector = {
            frameCenter : FrameCenter.CENTER_GEO,
            frameOrientation : FrameOrientation.EFI,
            position : [0.0017453177327606357, -0.003490651415223732, 0.9999923845803572],
            velocity : [0.0017453177327606357, -0.003490651415223732, 0.9999923845803572],
            timeStamp : timeStamp
        };

        const jtUt1 = 2458849.5000000;

        // orbits.js has an inaccurate GAST compuation with almost 1 mas error.

        const osvEfi_1 = FrameConversions.rotatePefEfi(osvPef_1, 0.1, 0.2);
        const osvEfi_2 = FrameConversions.rotatePefEfi(osvPef_2, 0.1, 0.2);
        const osvEfi_3 = FrameConversions.rotatePefEfi(osvPef_3, 0.1, 0.2);

        assert.equal(osvEfi_1.frameCenter, FrameCenter.CENTER_GEO);
        assert.equal(osvEfi_1.frameOrientation, FrameOrientation.EFI);
        assert.equal(osvEfi_1.timeStamp, osvEfi_1_exp.timeStamp);
        checkFloatArray(osvEfi_1.position, osvEfi_1_exp.position, 1e-15);
        checkFloatArray(osvEfi_1.velocity, osvEfi_1_exp.velocity, 1e-15);

        assert.equal(osvEfi_2.frameCenter, FrameCenter.CENTER_GEO);
        assert.equal(osvEfi_2.frameOrientation, FrameOrientation.EFI);
        assert.equal(osvEfi_2.timeStamp, osvEfi_2_exp.timeStamp);
        checkFloatArray(osvEfi_2.position, osvEfi_2_exp.position, 1e-15);
        checkFloatArray(osvEfi_2.velocity, osvEfi_2_exp.velocity, 1e-15);

        assert.equal(osvEfi_3.frameCenter, FrameCenter.CENTER_GEO);
        assert.equal(osvEfi_3.frameOrientation, FrameOrientation.EFI);
        assert.equal(osvEfi_3.timeStamp, osvEfi_3_exp.timeStamp);
        checkFloatArray(osvEfi_3.position, osvEfi_3_exp.position, 1e-15);
        checkFloatArray(osvEfi_3.velocity, osvEfi_3_exp.velocity, 1e-15);
    });    

    it('rotateEfiPef', function() {
        const timeStamp : TimeStamp = new TimeStamp(
            TimeFormat.FORMAT_JULIAN, 
            TimeConvention.TIME_TDB,
            2458849.5000000);

        const osvEfi_1 : StateVector = {
            frameCenter : FrameCenter.CENTER_GEO,
            frameOrientation : FrameOrientation.EFI,
            position : [1, 0, 0],
            velocity : [1, 0, 0],
            timeStamp : timeStamp
        };
        const osvEfi_2 : StateVector = {
            frameCenter : FrameCenter.CENTER_GEO,
            frameOrientation : FrameOrientation.EFI,
            position : [0, 1, 0],
            velocity : [0, 1, 0],
            timeStamp : timeStamp
        };
        const osvEfi_3 : StateVector = {
            frameCenter : FrameCenter.CENTER_GEO,
            frameOrientation : FrameOrientation.EFI,
            position : [0, 0, 1],
            velocity : [0, 0, 1],
            timeStamp : timeStamp
        };
        const osvPef_1_exp : StateVector = {
            frameCenter : FrameCenter.CENTER_GEO,
            frameOrientation : FrameOrientation.PEF,
            position : [0.9999984769132877, 0.000006092332930453056, 0.0017453177327606357],
            velocity : [0.9999984769132877, 0.000006092332930453056, 0.0017453177327606357],
            timeStamp : timeStamp
        };
        const osvPef_2_exp : StateVector = {
            frameCenter : FrameCenter.CENTER_GEO,
            frameOrientation : FrameOrientation.PEF,
            position : [0, 0.9999939076577904, -0.003490651415223732],
            velocity : [0, 0.9999939076577904, -0.003490651415223732],
            timeStamp : timeStamp
        };
        const osvPef_3_exp : StateVector = {
            frameCenter : FrameCenter.CENTER_GEO,
            frameOrientation : FrameOrientation.PEF,
            position : [-0.0017453283658983088, 0.0034906460986589443, 0.9999923845803572],
            velocity : [-0.0017453283658983088, 0.0034906460986589443, 0.9999923845803572],
            timeStamp : timeStamp
        };

        const jtUt1 = 2458849.5000000;

        // orbits.js has an inaccurate GAST compuation with almost 1 mas error.

        const osvPef_1 = FrameConversions.rotateEfiPef(osvEfi_1, 0.1, 0.2);
        const osvPef_2 = FrameConversions.rotateEfiPef(osvEfi_2, 0.1, 0.2);
        const osvPef_3 = FrameConversions.rotateEfiPef(osvEfi_3, 0.1, 0.2);

        assert.equal(osvPef_1.frameCenter, FrameCenter.CENTER_GEO);
        assert.equal(osvPef_1.frameOrientation, FrameOrientation.PEF);
        assert.equal(osvPef_1.timeStamp, osvPef_1_exp.timeStamp);
        checkFloatArray(osvPef_1.position, osvPef_1_exp.position, 1e-15);
        checkFloatArray(osvPef_1.velocity, osvPef_1_exp.velocity, 1e-15);

        assert.equal(osvPef_2.frameCenter, FrameCenter.CENTER_GEO);
        assert.equal(osvPef_2.frameOrientation, FrameOrientation.PEF);
        assert.equal(osvPef_2.timeStamp, osvPef_2_exp.timeStamp);
        checkFloatArray(osvPef_2.position, osvPef_2_exp.position, 1e-15);
        checkFloatArray(osvPef_2.velocity, osvPef_2_exp.velocity, 1e-15);

        assert.equal(osvPef_3.frameCenter, FrameCenter.CENTER_GEO);
        assert.equal(osvPef_3.frameOrientation, FrameOrientation.PEF);
        assert.equal(osvPef_3.timeStamp, osvPef_3_exp.timeStamp);
        checkFloatArray(osvPef_3.position, osvPef_3_exp.position, 1e-15);
        checkFloatArray(osvPef_3.velocity, osvPef_3_exp.velocity, 1e-15);
    });    

    it('rotateEfiEnu', function() {
        const timeStamp : TimeStamp = new TimeStamp(TimeFormat.FORMAT_JULIAN, 
            TimeConvention.TIME_UT1, 2459662.467361111);
        const osvEfiGeo : StateVector = {
            frameCenter : FrameCenter.CENTER_GEO,
            frameOrientation : FrameOrientation.EFI,
            position : [-87838751662.35324,
                         52736029625.35403,
                        -25596488029.92342],
            velocity : [3.815926089266752e+06,
                6.391070765456880e+06,
                1.653485602488094e+04],
            timeStamp : timeStamp
        };
        const observerPosition : EarthPosition = {
            lat : 60.205490,
            lon : 24.0206,
            h : 0
        }
        const osvEfiHor : StateVector = FrameConversions.translateGeoTopo(osvEfiGeo, observerPosition);
        const osvEnuHor : StateVector = FrameConversions.rotateEfiEnu(osvEfiHor, observerPosition);

        const osvEnuExp : StateVector = {
            frameCenter : FrameCenter.CENTER_TOPOC,
            frameOrientation : FrameOrientation.ENU,
            position : [ 83925132910.53931,
                    38278260514.84691,
                    -51419041065.68192],
            velocity : [ 4284268.453380695,
                    -5274201.499041729,
                    3038946.069965863],
            timeStamp : timeStamp
        };

        assert.equal(osvEnuHor.frameCenter, FrameCenter.CENTER_TOPOC);
        assert.equal(osvEnuHor.frameOrientation, FrameOrientation.ENU);
        assert.equal(osvEnuHor.timeStamp, osvEnuExp.timeStamp);
        checkFloatArray(osvEnuHor.position, osvEnuExp.position, 1e-3);
        checkFloatArray(osvEnuHor.velocity, osvEnuExp.velocity, 1e-3);
    });

    it('rotateEnuEfi', function() {
        const timeStamp : TimeStamp = new TimeStamp(TimeFormat.FORMAT_JULIAN, 
            TimeConvention.TIME_UT1, 2459662.467361111);
        const osvEnuTopo : StateVector = {
            frameCenter : FrameCenter.CENTER_TOPOC,
            frameOrientation : FrameOrientation.ENU,
            position : [ 83925132910.53931,
                         38278260514.84691,
                        -51419041065.68192],
            velocity : [ 4284268.453380695,
                        -5274201.499041729,
                         3038946.069965863],
            timeStamp : timeStamp
        };
        const observerPosition : EarthPosition = {
            lat : 60.205490,
            lon : 24.0206,
            h : 0
        }
        const osvEfiTopo : StateVector = FrameConversions.rotateEnuEfi(osvEnuTopo, observerPosition);
        const osvEfiGeo  : StateVector = FrameConversions.translateTopoGeo(osvEfiTopo, observerPosition);

        const osvEfiExp : StateVector = {
            frameCenter : FrameCenter.CENTER_GEO,
            frameOrientation : FrameOrientation.EFI,
            position : [-87838751662.35324,
                         52736029625.35403,
                        -25596488029.92342],
            velocity : [3.815926089266752e+06,
                        6.391070765456880e+06,
                        1.653485602488094e+04],
            timeStamp : timeStamp
        };

        assert.equal(osvEfiGeo.frameCenter, FrameCenter.CENTER_GEO);
        assert.equal(osvEfiGeo.frameOrientation, FrameOrientation.EFI);
        assert.equal(osvEfiGeo.timeStamp, osvEfiExp.timeStamp);
        checkFloatArray(osvEfiGeo.position, osvEfiExp.position, 1e-3);
        checkFloatArray(osvEfiGeo.velocity, osvEfiExp.velocity, 1e-3);
    });    
});