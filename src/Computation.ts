import { CorrectionInfo } from "./Configuration/CorrectionConf";
import { ObserverInfo } from "./Configuration/ObserverConf";
import { Target, TargetType } from "./Configuration/TargetConf";
import { TimeParameters, TimeParametersInfo } from "./Configuration/TimeParameterConf";
import { ComputationInfo } from "./Configuration/ComputationConf";
import { TimeStamp, TimeFormat } from "./TimeStamp";
import { TimeConvention, TimeCorrelation } from "./TimeCorrelation";
import { FrameCenter, FrameOrientation, FrameConversions } from "./Frames";
import { EopComputation, EopParams } from "./EopParams";
import { Engine } from "./SSIE/Engine";
import { IntegrationState } from "./SSIE/Integration";
import { StateVector } from "./StateVector";
import { MathUtils } from "./MathUtils";
import { constants } from "./SSIE/Constants";

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
    compute() {
        const timeSteps : TimeParametersInfo = TimeParameters.convertToJulianList(this.timeParameters);
        const timeStepsJulian : number[] = <number[]> timeSteps.listJulian;

        for (let indTimestep = 0; indTimestep < timeStepsJulian.length; indTimestep++) {
            const timeStamp : TimeStamp = new TimeStamp(TimeFormat.FORMAT_JULIAN, 
                this.timeParameters.convention, timeStepsJulian[indTimestep]);

            this.computeTimeStep(timeStamp);
        }

    }

    /**
     * Compute single time step and all targets.
     * 
     * @param {TimeStamp} timeStamp
     *      Time stamp. 
     */
    computeTimeStep(timeStamp : TimeStamp) {
        // Perform time correlations and EOP interpolation.
        const eopParams : EopParams = EopComputation.computeEopData(timeStamp, this.timeCorrelation);

        for (let indTarget = 0; indTarget < this.targetList.length; indTarget++) {
            const target : Target = this.targetList[indTarget];

            this.computeTarget(timeStamp, target, eopParams);
        }
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
     */
    computeTarget(timeStamp : TimeStamp, target : Target, eopParams : EopParams) {
        let stateVector : StateVector;

        // We integrate the Solar System regardless of target type. Note that SSIE implements
        // a cache so that the integration is done exactly once for each unique time stamp.
        const state : IntegrationState = this.engine.get(eopParams.timeStampTdb.getJulian());

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