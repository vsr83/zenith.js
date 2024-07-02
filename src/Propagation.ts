import { TimeCorrelation } from "./TimeCorrelation";
import { TimeStamp } from "./TimeStamp";
import { StateVector } from "./StateVector";
import { MathUtils } from "./MathUtils";

/**
 * Class with static methods for propagation of state vectors.
 */
export class Propagation {
    /**
     * Propagate linear
     * 
     * @param corr 
     * @param observerInfo 
     * @param timeStamp 
     * @returns 
     */
    static propagateLinear(corr : TimeCorrelation, stateVector : StateVector, timeStamp : TimeStamp) : StateVector {
        const numSec = stateVector.timeStamp.daysTo(corr, timeStamp) * 86400;
        const pos : number[] = stateVector.position;
        const vel : number[] = stateVector.velocity;

        // Note that the following assumes units.
        return {
            frameOrientation : stateVector.frameOrientation,
            frameCenter : stateVector.frameCenter,
            position : MathUtils.linComb([1.0, numSec], [pos, vel]),
            velocity : vel,
            timeStamp : timeStamp
        };
    }

}