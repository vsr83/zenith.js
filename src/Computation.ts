import { CorrectionInfo } from "./Configuration/CorrectionConf";
import { ObserverInfo } from "./Configuration/ObserverConf";
import { Target, TargetType } from "./Configuration/TargetConf";
import { TimeParameters, TimeParametersInfo } from "./Configuration/TimeParameterConf";
import { ComputationInfo } from "./Configuration/ComputationConf";
import { TimeStamp, TimeFormat } from "./TimeStamp";
import { TimeConvention, TimeCorrelation } from "./TimeCorrelation";
import { FrameCenter, FrameOrientation, FrameConversions } from "./Frames";
import { EopComputation, EopParams, SolarParams } from "./EopParams";
import { Engine } from "./SSIE/Engine";
import { IntegrationState } from "./SSIE/Integration";
import { StateVector } from "./StateVector";
import { MathUtils } from "./MathUtils";
import { constants } from "./SSIE/Constants";
import { EarthPosition } from "./Wgs84";
import { TargetResults, TimeStepResults } from "./Results";

/**
 * Class organizing the high-level computation.
 */
export class Computation {
    // Time parameters.
    timeParameters : TimeParametersInfo;
    // Corrections to be performed to computations.
    corrections : CorrectionInfo;
    // Observer information.
    observer : ObserverInfo;
    // Selected targets.
    targetList : Target[];
    // Time correlation.
    timeCorrelation : TimeCorrelation;
    // Solar System Integration Engine (SSIE).
    engine : Engine;    

    /**
     * Public constructor.
     * 
     * @param {ComputationInfo} info 
     *      Configuration defining the computation.
     */
    constructor(info : ComputationInfo) {
        this.timeParameters = info.timeParameters;
        this.corrections = info.corrections;
        this.observer = info.observer;
        this.targetList = info.targetList;

        this.timeCorrelation = new TimeCorrelation();
        this.engine = new Engine();
    }

    /**
     * Perform computation for all time steps and targets.
     */
    compute() : TimeStepResults[] {
        const timeSteps : TimeParametersInfo = TimeParameters.convertToJulianList(this.timeParameters);
        const timeStepsJulian : number[] = <number[]> timeSteps.listJulian;

        const results : TimeStepResults[] = [];

        for (let indTimestep = 0; indTimestep < timeStepsJulian.length; indTimestep++) {
            const timeStamp : TimeStamp = new TimeStamp(TimeFormat.FORMAT_JULIAN, 
                this.timeParameters.convention, timeStepsJulian[indTimestep]);

            const timeStepResults : TimeStepResults = this.computeTimeStep(timeStamp);
            results.push(timeStepResults);
        }

        return results;
    }

    /**
     * Compute single time step and all targets.
     * 
     * @param {TimeStamp} timeStamp
     *      Time stamp. 
     * @returns {TimeStepResults} Results for all targets for the given time step.
     */
    computeTimeStep(timeStamp : TimeStamp) : TimeStepResults {
        // Perform time correlations and EOP interpolation.
        const eopParams : EopParams = EopComputation.computeEopData(timeStamp, this.timeCorrelation);
        // We integrate the Solar System regardless of target type. Note that SSIE implements
        // a cache so that the integration is done exactly once for each unique time stamp.
        const integrationState : IntegrationState = this.engine.get(eopParams.timeStampTdb.getJulian());
        // Compute solar system parameters.
        const solarParams : SolarParams = EopComputation.computeSolarData(timeStamp, integrationState);

        const targets : Target[] = [];
        const results : TargetResults[] = [];

        for (let indTarget = 0; indTarget < this.targetList.length; indTarget++) {
            const target : Target = this.targetList[indTarget];

            const targetResults : TargetResults = this.computeTarget(timeStamp, target, eopParams, 
                solarParams, integrationState);

                targets.push(target);
                results.push(targetResults);
        }

        return {
            timeStamp : timeStamp,
            targets : targets,
            results : results
        };
    }

    /**
     * Compute single time step for a single target.
     * 
     * @param {TimeStamp} timeStamp
     *      Time stamp. 
     * @param {Target} target
     *      The target. 
     * @param {EopParams} eopParams
     *      The EOP.
     * @param {SolarParams} solarParams
     *      The solar system parameters.
     * @param {IntegrationState} state 
     *      The integration state of the solar system.
     * @return {TargetResults} Target results for a single time step.
     */
    computeTarget(timeStamp : TimeStamp, target : Target, eopParams : EopParams,
        solarParams : SolarParams, state : IntegrationState) : TargetResults {

        const frameConversions : FrameConversions = new FrameConversions(
            eopParams, <EarthPosition> this.observer.earthPos, solarParams
        );

        const stateVectorRaw : StateVector = this.computeStateVector(timeStamp, target, eopParams, 
            solarParams, state);
        const stateMapRaw : Map<FrameCenter, Map<FrameOrientation, StateVector>> = 
            frameConversions.getAll(stateVectorRaw);



        const stateVectorObs : StateVector = this.observer.state;

        const targetObs : StateVector | undefined = stateMapRaw.get(this.observer.state.frameCenter)
            ?.get(this.observer.state.frameOrientation);
        if (targetObs === undefined) {
            throw Error('foo');
        }

        // Speed of light m/s.
        const c = 299792458;
        const distance : number = MathUtils.norm(MathUtils.vecDiff(
            stateVectorRaw.position, targetObs.position
        ));
        const lightTimeDays = distance / (c * 86400);
        const timeStampCorrected : TimeStamp = new TimeStamp(TimeFormat.FORMAT_JULIAN, 
            timeStamp.getConvention(), timeStamp.getJulian() - lightTimeDays);

        const integrationState : IntegrationState = this.engine.get(timeStampCorrected.getJulian());

        const stateMapCorrected : Map<FrameCenter, Map<FrameOrientation, StateVector>> = 
            frameConversions.getAll(stateVectorRaw);

        //const targetObs : StateVector = (Map<FrameOrientation, StateVector> stateMapRaw.get(this.observer.state.frameCenter)?
        //).get(this.observer.state.frameOrientation);

/*
        // Fill results by converting the state vector to every frame.
        if (stateVector != null) {
            const targetResults : TargetResults = {
                stateMapRaw : frameConversions.getAll(stateVector)
            }
            return targetResults;
        } else {
            throw Error("Target type " + target.type + " not implemented.");
        }*/

        return {
            stateMapRaw : stateMapRaw,
            stateMapLightTime : stateMapCorrected
        };
    }

    /**
     * Compute a state vector for a single target.
     * 
     * @param {TimeStamp} timeStamp
     *      Time stamp. 
     * @param {Target} target
     *      The target. 
     * @param {EopParams} eopParams
     *      The EOP.
     * @param {SolarParams} solarParams
     *      The solar system parameters.
     * @param {IntegrationState} state 
     *      The integration state of the solar system.
     * @return {TargetResults} Target results for a single time step.
     */
    computeStateVector(timeStamp : TimeStamp, target : Target, eopParams : EopParams,
        solarParams : SolarParams, state : IntegrationState) : StateVector {
            let stateVector : StateVector | null = null;
    
            // First compute a state vector for the target.
            switch (target.type) {
                case TargetType.SSIE:
                    // Integrate to the target time.
                    stateVector = this.ssieToStateVector(timeStamp, state, target.refNumber);
                    break;
                case TargetType.STAR_HIPPARCHUS:
                    break;
                case TargetType.SATELLITE_SGP4:
                    break;
            }
            if (stateVector != null) {
                return stateVector;
            } else {
                throw Error("Target type " + target.type + " not implemented.");
            }
    }

    /**
     * Transform integration state for a SSIE body to a state vector.
     * 
     * @param {TimeStamp} timeStamp
     *      Time stamp used for the computation. 
     * @param {IntegrationState} state
     *      SSIE IntegrationState. 
     * @param {number} indBody
     *      Index of the SSIE body. 
     */
    ssieToStateVector(timeStamp : TimeStamp, state : IntegrationState, indBody : number) : StateVector {
        // To create Heliocentric positions, we need to compute the difference to the position and
        // velocity of the Sun and transform the units to m and m/s.
        const secondsPerDay = 86400.0;
        const auMeters = constants.au * 1000.0;

        const posTarget : number[] = MathUtils.vecMul(
            MathUtils.vecDiff(state.pointMasses[indBody].r, state.pointMasses[0].r), auMeters);
        const velTarget : number[] = MathUtils.vecMul(
            MathUtils.vecDiff(state.pointMasses[indBody].v, state.pointMasses[0].v), auMeters / secondsPerDay);

        return {
            frameCenter : FrameCenter.HELIOCENTER,
            frameOrientation : FrameOrientation.J2000_EQ,
            position : posTarget, 
            velocity : velTarget,
            timeStamp : timeStamp
        }
    }
}