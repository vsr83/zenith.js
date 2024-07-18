import { StateVector } from "../StateVector";
import { MathUtils } from "../MathUtils";
import { SolarParams } from "../EopParams";
import { FrameCenter, FrameConversions } from "../Frames";
import { ObserverInfo } from "../Configuration/ObserverConf";
import { constants } from "../SSIE/Constants";

/**
 * Class with static methods for handling of gravitational deflection.
 */
export class GravDeflection {
    /**
     * Compute gravitational deflection in an inertial frame. 
     * 
     * REFERENCES:
     * [1] Urban, Seidelmann - Explanatory Supplement to the Astronomical
     * Almanac, 3rd edition, University Science Books, 2013.
     * 
     * @param {StateVector} osvTarget 
     *      State vector for the target.
     * @param {SolarParams} solarParams
     *      Solar System parameters.
     * @param {ObserverInfo} observerInfo
     *      Observer info.
     * @param {FrameConversions} frameConversions
     *      Object for frame conversions.
     * @returns {StateVector} State vector for the target including gravitational deflection.
     */
    static gravDeflection(osvTarget : StateVector, solarParams : SolarParams, 
        observerInfo : ObserverInfo, frameConversions : FrameConversions) : StateVector {
        
        // Convert all state vectors to the frame of the observer.
        let targetState : StateVector = frameConversions.translateTo(osvTarget, 
            observerInfo.state.frameCenter);
        targetState = frameConversions.rotateTo(targetState, observerInfo.state.frameOrientation);

        let solarState : StateVector = {
            frameCenter : FrameCenter.HELIOCENTER,
            frameOrientation : observerInfo.state.frameOrientation,
            position : [0, 0, 0],
            velocity : [0, 0, 0],
            timeStamp : observerInfo.state.timeStamp
        };
        solarState = frameConversions.translateTo(solarState, observerInfo.state.frameCenter);

        // See. Figure 7.4 in [1].
        const e : number[] = MathUtils.vecDiff(observerInfo.state.position, solarState.position);
        const q : number[] = MathUtils.vecDiff(targetState.position, solarState.position);
        const p : number[] = MathUtils.vecDiff(targetState.position, observerInfo.state.position);
        const eUnit : number[] = MathUtils.normalize(e);
        const qUnit : number[] = MathUtils.normalize(q);
        const pUnit : number[] = MathUtils.normalize(p);

        // Speed of light (m/s).
        const c = 299792458;
        // Astronomical unit (m).
        const au = 149597870700;
        // Light time per unit distance.
        const tauA = au / c;
        // Distance to target in au.
        const E = MathUtils.norm(e) / au;
        const muc2 = (constants.k * tauA / 86400) ** 2;
        // (7.64)
        const g1 = 2 * muc2 / E;
        const g2 = 1 + MathUtils.dot(qUnit, eUnit);

        // (7.63) Correction to the direction.
        const p1Unit = MathUtils.normalize(MathUtils.linComb(
            [1, (g1 / g2) * MathUtils.dot(pUnit, qUnit), -(g1 / g2) * MathUtils.dot(eUnit, pUnit)],
            [pUnit, eUnit, qUnit]
        ));
        const p1 = MathUtils.vecMul(p1Unit, MathUtils.norm(p));

        let corrected : StateVector = {
            frameCenter : observerInfo.state.frameCenter,
            frameOrientation : observerInfo.state.frameOrientation,
            position : MathUtils.vecSum(observerInfo.state.position, p1),
            velocity : targetState.velocity,
            timeStamp : targetState.timeStamp
        }

        // The D in [1] can be verified by summing the two S-T-O and S-O-T elongation
        // angles. The dphi can be checked against Table 7.4 in [1].

        //const psi = MathUtils.acosd(MathUtils.dot(eUnit, qUnit));
        //const D = 180 - psi;
        //const dphi = MathUtils.acosd(MathUtils.dot(p1Unit, pUnit));
        //console.log("D " + D + " dphi " + dphi * 3600);

        corrected = frameConversions.rotateTo(corrected, osvTarget.frameOrientation);
        return frameConversions.translateTo(corrected, osvTarget.frameCenter);
    }
}