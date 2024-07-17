import { StateVector } from "../StateVector";
import { MathUtils } from "../MathUtils";    
import { FrameCenter, FrameOrientation } from "../Frames";

/**
 * Class with static methods for handling of stellar and diurnal aberration.
 */
export class Aberration
{
    /**
     * Compute relativistic stellar aberration in an inertial frame. If applied to planets, the
     * light-time correction must be performed before application.
     * 
     * REFERENCES:
     * [1] Urban, Seidelmann - Explanatory Supplement to the Astronomical
     * Almanac, 3rd edition, University Science Books, 2013.
     * 
     * @param {StateVector} osvTarget 
     *      State vector for the target.
     * @param {StateVector} osvSource 
     *      State vector for the source.
     * @returns {StateVector} State vector for the target including aberration.
     */
    static aberrationStellarRel(osvTarget : StateVector, osvSource : StateVector) : StateVector {
        if (osvTarget.frameCenter != osvSource.frameCenter || 
            osvTarget.frameOrientation != osvSource.frameOrientation) {
          //  throw new Error("Source and target state vector frames do not match!");
        }

         // Inverse of the speed of light s/m.
        const cInv = 1.0 / 299792458.0;
        const v = MathUtils.norm(osvSource.velocity);
        // Inverse of the Lorentz factor.
        const betaInv = Math.sqrt(1 - v * v * cInv * cInv);

        const magPosition : number = MathUtils.norm(osvTarget.position);
        const dirOriginal : number[] = MathUtils.vecMul(osvTarget.position, 1 / MathUtils.norm(osvTarget.position));

        // Equation (7.40) in [1].
        let dirCorrected : number[] = MathUtils.linComb(
            [betaInv,  cInv * (1 + (cInv / (1 + betaInv)) * MathUtils.dot(dirOriginal, osvSource.velocity))],
            [dirOriginal, osvSource.velocity]);
        dirCorrected = MathUtils.vecMul(dirCorrected, 1 / MathUtils.norm(dirCorrected));

        return {
            frameCenter : osvTarget.frameCenter,
            frameOrientation : osvTarget.frameOrientation,
            position : MathUtils.vecMul(dirCorrected, MathUtils.norm(osvTarget.position)),
            velocity : osvTarget.velocity,
            timeStamp : osvTarget.timeStamp
        };
    }

    /**
     * Compute classical stellar aberration in an inertial frame. If applied to planets, the
     * light-time correction must be performed first.
     * 
     * REFERENCES:
     * [1] Urban, Seidelmann - Explanatory Supplement to the Astronomical
     * Almanac, 3rd edition, University Science Books, 2013.
     * 
     * @param {StateVector} osvTarget 
     *      State vector for the target.
     * @param {StateVector} osvSource 
     *      State vector for the source.
     * @returns {StateVector} State vector for the target including aberration.
     */
    static aberrationStellarCla(osvTarget : StateVector, osvSource : StateVector) : StateVector {
        if (osvTarget.frameCenter != osvSource.frameCenter || 
            osvTarget.frameOrientation != osvSource.frameOrientation) {
           // throw new Error("Source and target state vector frames do not match!");
        }

         // Inverse of the speed of light s/m.
        const cInv = 1.0 / 299792458.0;
        const v = MathUtils.norm(osvSource.velocity);
        // Inverse of the Lorentz factor.

        const magPosition : number = MathUtils.norm(osvTarget.position);
        const dirOriginal : number[] = MathUtils.vecMul(osvTarget.position, 1 / MathUtils.norm(osvTarget.position));

        // Equation (7.38) in [1].
        let dirCorrected : number[] = MathUtils.linComb(
            [1, cInv], [dirOriginal, osvSource.velocity]);
        dirCorrected = MathUtils.vecMul(dirCorrected, 1 / MathUtils.norm(dirCorrected));

        return {
            frameCenter : osvTarget.frameCenter,
            frameOrientation : osvTarget.frameOrientation,
            position : MathUtils.vecMul(dirCorrected, MathUtils.norm(osvTarget.position)),
            velocity : osvTarget.velocity,
            timeStamp : osvTarget.timeStamp
        };
    }
}