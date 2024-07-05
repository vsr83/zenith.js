import { CorrectionInfo } from "./CorrectionConf";
import { ObserverInfo } from "./ObserverConf";
import { Target } from "./TargetConf";
import { TimeParametersInfo } from "./TimeParameterConf";

/**
 * Interface defining the computation to be performed.
 */
export interface ComputationInfo {
    // Time parameters.
    timeParameters : TimeParametersInfo;
    // Corrections to be performed to computations.
    corrections : CorrectionInfo;
    // Observer information.
    observer : ObserverInfo;
    // Selected targets.
    targetList : Target[];
}