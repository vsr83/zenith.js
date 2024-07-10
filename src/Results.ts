
import { FrameCenter, FrameOrientation } from "./Frames";
import { StateVector } from "./StateVector";
import { TimeStamp } from "./TimeStamp";
import { Target } from "./Configuration/TargetConf";

/**
 * Computation results for single target for a single time step.
 */
export interface TargetResults {
    // Map that associates a state vector to each pair (FrameCenter, FrameOrientation).
    // The positions and velocities are raw without any corrections of any kind.
    stateMapRaw : Map<FrameCenter, Map<FrameOrientation, StateVector>>;

    // State map with positions and velocities corrected for light time.
    stateMapLightTime : Map<FrameCenter, Map<FrameOrientation, StateVector>>;

    // State map with positions and velocities corrected for light time and aberration.
    stateMapAberrationCla : Map<FrameCenter, Map<FrameOrientation, StateVector>>;
    stateMapAberrationRel : Map<FrameCenter, Map<FrameOrientation, StateVector>>;
    //stateMapAberration : Map<FrameCenter, Map<FrameOrientation, StateVector>>;
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
