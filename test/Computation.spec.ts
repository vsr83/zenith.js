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
import { EopParams, SolarParams } from '../src/EopParams';
import { TimeParametersInfo, TimeParameters } from '../src/Configuration/TimeParameterConf';
import { CorrectionInfo, CorrectionType, RefractionModel, RefractionParams } from '../src/Configuration/CorrectionConf';
import { ObserverInfo, Observer } from '../src';
import { Target } from '../src';
import { ComputationInfo } from '../src/Configuration/ComputationConf';
import { targetList, targetMap } from '../src/Configuration/TargetConf';
import { Computation } from '../src/Computation';
import { TimeStepResults, TargetResults, PostProcessing } from '../src/Results';

function checkOsv(val : StateVector, exp : StateVector, posTol : number, velTol : number) {
    assert.equal(val.frameCenter, exp.frameCenter);
    assert.equal(val.frameOrientation, exp.frameOrientation);
    assert.equal(val.timeStamp, exp.timeStamp);
    checkFloatArray(val.position, exp.position, MathUtils.norm(val.position) * posTol);
    checkFloatArray(val.velocity, exp.velocity, MathUtils.norm(val.velocity) * velTol);
}

describe('Computation', function() {
    describe('Planets', function() {
        it('Mercury', function() {

            const timeParameters : TimeParametersInfo = TimeParameters.createFromJulianSpan(
                2450497.5000000, 2450520, 22.5, TimeConvention.TIME_UTC
            );
            const corrections : CorrectionInfo = {
                corrections : [CorrectionType.LIGHT_TIME],
                refractionParams : {refractionModel : RefractionModel.NO_CORRECTION}
            };
            const earthPos : EarthPosition = {lat : 61.4945763, lon : 23.8283, h : 121.916};
            const dummyTimeStamp : TimeStamp = new TimeStamp(
                TimeFormat.FORMAT_JULIAN, 
                TimeConvention.TIME_TDB,
                2458849.5000000);
    
            const observer : ObserverInfo = Observer.initializeFromWgs84(earthPos, dummyTimeStamp);
            const target : Target = targetList[1];

            const targetSel : Target[] = [targetList[1]];

            const computationInfo : ComputationInfo = {
                timeParameters : timeParameters,
                corrections : corrections,
                observer : observer,
                targetList : targetSel
            };

            const computation : Computation = new Computation(computationInfo);
            const results : TimeStepResults[] = computation.compute();

            for (let timeStep = 0; timeStep < results.length; timeStep++) {
                const timeStepResults : TimeStepResults = results[timeStep];
                
                for (let indTarget = 0; indTarget < timeStepResults.targets.length; indTarget++) {
                    console.log(timeStepResults.results[indTarget].stateMapRaw
                        .get(FrameCenter.HELIOCENTER)
                        ?.get(FrameOrientation.J2000_EQ));
                    console.log(timeStepResults.results[indTarget].stateMapRaw
                        .get(FrameCenter.PLANET_TOPO)
                        ?.get(FrameOrientation.ENU));
                    /*
                    console.log("light-time");
                    console.log(timeStepResults.results[indTarget].stateMapLightTime
                        .get(FrameCenter.PLANET_TOPO)
                        ?.get(FrameOrientation.ENU));
                    console.log("aberrationcla");
                    console.log(timeStepResults.results[indTarget].stateMapAberrationCla
                        .get(FrameCenter.PLANET_TOPO)
                        ?.get(FrameOrientation.ENU));
                    console.log(timeStepResults.results[indTarget].stateMapAberrationRel
                        .get(FrameCenter.PLANET_TOPO)
                        ?.get(FrameOrientation.ENU));
                    console.log(timeStepResults.results[indTarget].stateMapAberrationRel
                        .get(FrameCenter.PLANET_TOPO)
                        ?.get(FrameOrientation.J2000_EQ));
                    console.log(timeStepResults.results[indTarget].stateMapLightTime
                        .get(FrameCenter.BODY_CENTER)
                        ?.get(FrameOrientation.J2000_EQ));
                    console.log(timeStepResults.results[indTarget].stateMapAberrationCla
                        .get(FrameCenter.BODY_CENTER)
                        ?.get(FrameOrientation.J2000_EQ));
                    console.log("fooo");
                    console.log(timeStepResults.results[indTarget].stateMapLightTime
                        .get(FrameCenter.BODY_CENTER)
                        ?.get(FrameOrientation.J2000_EQ)); */
                }
            }
        });
    });

    describe('Stars', function() {
        it('Vega', function() {

            const timeParameters : TimeParametersInfo = TimeParameters.createFromJulianSpan(
                2450497.5000000, 2450520, 22.5, TimeConvention.TIME_UTC
            );
            const corrections : CorrectionInfo = {
                corrections : [CorrectionType.LIGHT_TIME],
                refractionParams : {refractionModel : RefractionModel.NO_CORRECTION}
            };
            const earthPos : EarthPosition = {lat : 61.4945763, lon : 23.8283, h : 121.916};
            const dummyTimeStamp : TimeStamp = new TimeStamp(
                TimeFormat.FORMAT_JULIAN, 
                TimeConvention.TIME_TDB,
                2458849.5000000);
    
            const observer : ObserverInfo = Observer.initializeFromWgs84(earthPos, dummyTimeStamp);


            
            const target : Target = targetList[<number> targetMap.get("3 Alpha Lyrae (Vega)_HIP")];
            const targetSel : Target[] = [target];

            const computationInfo : ComputationInfo = {
                timeParameters : timeParameters,
                corrections : corrections,
                observer : observer,
                targetList : targetSel
            };

            const computation : Computation = new Computation(computationInfo);
            const results : TimeStepResults[] = computation.compute();

            for (let timeStep = 0; timeStep < results.length; timeStep++) {
                const timeStepResults : TimeStepResults = results[timeStep];
                
                for (let indTarget = 0; indTarget < timeStepResults.targets.length; indTarget++) {
                    console.log(timeStepResults.results[indTarget].stateMapRaw
                        .get(FrameCenter.HELIOCENTER)
                        ?.get(FrameOrientation.J2000_EQ));
                    console.log(timeStepResults.results[indTarget].stateMapRaw
                        .get(FrameCenter.PLANET_TOPO)
                        ?.get(FrameOrientation.ENU));
                    /*
                    console.log("light-time");
                    console.log(timeStepResults.results[indTarget].stateMapLightTime
                        .get(FrameCenter.PLANET_TOPO)
                        ?.get(FrameOrientation.ENU));
                    console.log("aberrationcla");
                    console.log(timeStepResults.results[indTarget].stateMapAberrationCla
                        .get(FrameCenter.PLANET_TOPO)
                        ?.get(FrameOrientation.ENU));
                    console.log(timeStepResults.results[indTarget].stateMapAberrationRel
                        .get(FrameCenter.PLANET_TOPO)
                        ?.get(FrameOrientation.ENU));
                    console.log(timeStepResults.results[indTarget].stateMapAberrationRel
                        .get(FrameCenter.PLANET_TOPO)
                        ?.get(FrameOrientation.J2000_EQ));
                    console.log(timeStepResults.results[indTarget].stateMapLightTime
                        .get(FrameCenter.BODY_CENTER)
                        ?.get(FrameOrientation.J2000_EQ));
                    console.log(timeStepResults.results[indTarget].stateMapAberrationCla
                        .get(FrameCenter.BODY_CENTER)
                        ?.get(FrameOrientation.J2000_EQ));
                    console.log("fooo");
                    console.log(timeStepResults.results[indTarget].stateMapLightTime
                        .get(FrameCenter.BODY_CENTER)
                        ?.get(FrameOrientation.J2000_EQ)); */
                }
            }
        });
    });
});