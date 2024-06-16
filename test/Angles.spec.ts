import { checkFloat, checkFloatArray} from './common';
import 'mocha';
import {AssertionError, strict as assert} from 'assert';
import { Angles } from '../src';

describe('Angles', function() {
    describe('limitAngleDeg', function() {
        it('Test Ranges', function() {
            assert.equal(Angles.limitAngleDeg(100), 100);
            assert.equal(Angles.limitAngleDeg(0), 0);
            assert.equal(Angles.limitAngleDeg(360), 0);
            assert.equal(Angles.limitAngleDeg(361), 1);
            assert.equal(Angles.limitAngleDeg(720), 0);
            assert.equal(Angles.limitAngleDeg(721), 1);
            assert.equal(Angles.limitAngleDeg(-1), 359);
            assert.equal(Angles.limitAngleDeg(-361), 359);
            assert.equal(Angles.limitAngleDeg(-721), 359);
        });
    });

    describe('angleDiff', function() {
        it('Zero', function() {
            assert.equal(Angles.angleDiff(0, 0), 0);
            assert.equal(Angles.angleDiff(0, 360), 0);
            assert.equal(Angles.angleDiff(360, 0), 0);
            assert.equal(Angles.angleDiff(-360, 360), 0);
        });
        it('Middle positive', function() {
            assert.equal(Angles.angleDiff(100, 200), 100);
        });
        it('Middle negative', function() {
            assert.equal(Angles.angleDiff(200, 100), -100);
        });
        it('Left positive', function() {
            assert.equal(Angles.angleDiff(0, 0.1), 0.1);
        });
        it('Left negative', function() {
            assert.equal(Angles.angleDiff(0.1, 0), -0.1);
        });
        it('Right positive', function() {
            assert.equal(Angles.angleDiff(359, 0), 1);
            assert.equal(Angles.angleDiff(359, 360), 1);
            assert.equal(Angles.angleDiff(359, 720), 1);
            assert.equal(Angles.angleDiff(359, -360), 1);
            assert.equal(Angles.angleDiff(359, -720), 1);
        });
        it('Right negative', function() {
            assert.equal(Angles.angleDiff(-360, 359), -1);
            assert.equal(Angles.angleDiff(-720, 359), -1);
            assert.equal(Angles.angleDiff(0, 359), -1);
            assert.equal(Angles.angleDiff(360, 359), -1);
            assert.equal(Angles.angleDiff(720, 359), -1);
        });
    });

    describe('angleDegArc', function() {
        it('Nominal Range', function() {
            let {deg, arcMin, arcSec} = Angles.angleDegArc(1 + 2/60 + 3/3600, false);
            assert.equal(deg, 1);
            assert.equal(arcMin, 2);
            checkFloat(arcSec, 3, 1e-9);
        });
        it('Nominal Range2', function() {
            let {deg, arcMin, arcSec} = Angles.angleDegArc(-5.5, false);
            assert.equal(deg, -5);
            assert.equal(arcMin, 30);
            checkFloat(arcSec, 0, 1e-9);
        });
        it('Below Range', function() {
            let {deg, arcMin, arcSec} = Angles.angleDegArc(-359 + 2/60 + 3/3600, false);
            assert.equal(deg, 1);
            assert.equal(arcMin, 2);
            checkFloat(arcSec, 3, 1e-9);
        });
        it('Above Range', function() {
            let {deg, arcMin, arcSec} = Angles.angleDegArc(361 + 2/60 + 3/3600, true);
            assert.equal(deg, 1);
            assert.equal(arcMin, 2);
            checkFloat(arcSec, 3, 1e-9);
        });
    });

    describe('angleArcDeg', function() {
        it('Nominal Range', function() {
            checkFloat(Angles.angleArcDeg(1, 2, 3), 1 + 2/60 + 3/3600, 1e-9);
        });
        it('Below Range', function() {
            checkFloat(Angles.angleArcDeg(-359, 2, 3), 1 - 2/60 - 3/3600, 1e-9);
            checkFloat(Angles.angleArcDeg(1, 2 - 360 * 60, 3), 1 + 2/60 + 3/3600, 1e-9);
            checkFloat(Angles.angleArcDeg(1, 2, 3 - 360 * 3600), 1 + 2/60 + 3/3600, 1e-9);
        });
        it('Above Range', function() {
            checkFloat(Angles.angleArcDeg(361, 2, 3), 1 + 2/60 + 3/3600, 1e-9);
        });
    });

    describe('angleDegHms', function() {
        it('Nominal Range', function() {
            let {hour, minute, second} = Angles.angleDegHms(1 * 15.0 + 2 * 15.0/60 + 3 * 15/3600);
            assert.equal(hour, 1);
            assert.equal(minute, 2);
            checkFloat(second, 3, 1e-9);
        });
        it('Below Range', function() {
            let {hour, minute, second} = Angles.angleDegHms(-23 * 15.0 + 2 * 15.0/60 + 3 * 15/3600);
            assert.equal(hour, 1);
            assert.equal(minute, 2);
            checkFloat(second, 3, 1e-9);
        });
        it('Above Range', function() {
            let {hour, minute, second} = Angles.angleDegHms(25 * 15.0 + 2 * 15.0/60 + 3 * 15/3600);
            assert.equal(hour, 1);
            assert.equal(minute, 2);
            checkFloat(second, 3, 1e-9);
        });
    });

    describe('angleHmsDeg', function() {
        it('Nominal Range', function() {
            checkFloat(Angles.angleHmsDeg(1, 2, 3), 1 * 15 + 2*15/60 + 3*15/3600, 1e-9);
        });
        it('Below Range', function() {
            checkFloat(Angles.angleHmsDeg(-23, 2, 3), 1 * 15 + 2*15/60 + 3*15/3600, 1e-9);
        });
        it('Above Range', function() {
            checkFloat(Angles.angleHmsDeg(25, 2, 3), 1 * 15 + 2*15/60 + 3*15/3600, 1e-9);
        });
    });
});