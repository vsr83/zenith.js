
import { FrameCenter, FrameOrientation } from "./Frames";
import { StateVector } from "./StateVector";
import { TimeStamp } from "./TimeStamp";
import { Target } from "./Configuration/TargetConf";

/**
 * Computation results for single target for a single time step.
 */
export interface TargetResults {
    // Map that associates a state vector to each pair (FrameCenter, FrameOrientation).
    stateMap : Map<FrameCenter, Map<FrameOrientation, StateVector>>;
};

/**
 * Results for a target.
 */
export interface TimeStepResults {
    // Time stamp associated to the results.
    timeStamp : TimeStamp;

    // Target info.
    targets : Target[];

    // Results for each time step.
    results : TargetResults[];
};
