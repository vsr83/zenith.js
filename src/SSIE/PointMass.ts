import { MathUtils } from "../MathUtils";
import { constants } from "./Constants";

/**
 * Interface for the state of a point mass.
 */
export interface PointMassState {
    // Target name.
    name : string;
    // Standard gravitational parameter (au^3/d^2).
    mu   : number; 
    // Position vector (au).
    r    : number[];
    // Velocity vector (au/d).
    v    : number[];
};

/**
 * Class implementing static methods for computations related to point
 * masses.
 */
export class PointMass {
    /**
     * Compute the classical or relativistic barycenter for the given point 
     * masses.
     * 
     * REFERENCES: 
     * [1] Newhall, Standish, Williams - DE 102: a numerically integrated
     * ephemeris of the Moon and planets spanning forty-four centuries,
     * Astronomy and Astrophysics, 125, 150-167, 1983.
     * [2] Urban, Seidelmann - Explanatory Supplement to the Astronomical
     * Almanac, 3rd edition, University Science Books, 2013.
     * 
     * @param {PointMassState[]} pointMasses 
     *      State of all objects with fields mu, r and v.
     * @param {boolean} relavistic 
     *      Flag indicating whether to compute relativistic instead of classical 
     *      barycenter.
     * @returns Object with fields r and v for the position and velocity of the 
     *          barycenter.
     */
    static barycenter(pointMasses : PointMassState[], relavistic : boolean) {
        const numTargets = pointMasses.length;
        const c2 = constants.c2;

        // Relativistic or classical standard gravitational parameter for the 
        // evaluation of the barycenter. 
        const muStar : number[] = [];
        let muStarSum = 0;

        for (let indTarget = 0; indTarget < numTargets; indTarget++) {
            const target = pointMasses[indTarget];

            if (relavistic) {
                let tmp : number = MathUtils.norm(target.v) ** 2;
            
                for (let indSource = 0; indSource < numTargets; indSource++) {
                    if (indSource == indTarget) {
                        continue;
                    }
                    const source = pointMasses[indSource];
                    tmp = tmp - source.mu / MathUtils.norm(MathUtils.vecDiff(target.r, source.r));
                }
                tmp = 1 - tmp * 0.5 / c2;
                muStar.push(target.mu * tmp);
            } else {
                muStar.push(target.mu);
            }
            muStarSum += muStar[muStar.length - 1];
        }

        // Compute the part of the equation for barycenter not including the
        // contribution from the Sun.
        let rBary = [0, 0, 0];
        let vBary = [0, 0, 0]; 

        for (let indTarget = 0; indTarget < numTargets; indTarget++) {
            const target = pointMasses[indTarget];
            rBary = MathUtils.linComb([1, muStar[indTarget]], [rBary, target.r]);
            vBary = MathUtils.linComb([1, muStar[indTarget]], [vBary, target.v]);
        }

        rBary = MathUtils.vecMul(rBary, 1 / muStarSum);
        vBary = MathUtils.vecMul(vBary, 1 / muStarSum);

        return {r : rBary, v : vBary};
    }

    /**
     * Compute the relativistic and Newtonian parts of acceleration.
     * 
     * This routine computes the relativistic and Newtonian parts of the
     * acceleration for an arbitrary number of point-masses. The total
     * accelerations are obtained as the sum of the two vectors. The
     * computation is based on the equation (1) in [1] and (8.1) in [2].
     *
     * REFERENCES: 
     *  [1] Newhall, Standish, Williams - DE 102: a numerically integrated
     *  ephemeris of the Moon and planets spanning forty-four centuries,
     *  Astronomy and Astrophysics, 125, 150-167, 1983.
     *  [2] Urban, Seidelmann - Explanatory Supplement to the Astronomical
     *  Almanac, 3rd edition, University Science Books, 2013.
     *  [3] Steve Moshier, DE118i available at 
     *  http://www.moshier.net/de118i-2.zip
     * 
     * @param {PointMassState[]} pointMasses 
     *      Array of point masses.
     * @param {boolean} relavistic 
     *      Flag indicating whether to compute relativistic parts of the
     *      acceleration.
     * @returns {number[][]} Acceleration vector for each point mass.
     */
    static accPointMass(pointMasses : PointMassState[], relativistic : boolean) : number[][] {
        const numTargets = pointMasses.length;
        const c2 = constants.c2;

        // Compute distances and third powers of distances between every pair
        // of objects.
        const Rij : number[][] = []
        const Rij3 : number[][] = []
        for (let indTarget = 0; indTarget < numTargets; indTarget++) {
            const target : PointMassState = pointMasses[indTarget];
            const RijRow : number[] = [];
            const RijRow3 : number[] = [];
            for (let indSource = 0; indSource < numTargets; indSource++) {
                const source : PointMassState = pointMasses[indSource];
                const distance : number = MathUtils.norm(MathUtils.vecDiff(target.r, source.r));

                RijRow.push(distance);
                RijRow3.push(distance ** 3);
            }
            Rij.push(RijRow);
            Rij3.push(RijRow3);
        }

        // For numerical accuracy, it is very important to compute the relativistic 
        // acceleration separately. Otherwise, one has to do large amount of 
        // floating computations that involve adding small numbers to larger ones.

        const accNewton     : number[][] = [];
        const accRelativity : number[][] = [];
        const accSum        : number[][] = [];

        // Compute the Newtonian accelerations first.
        for (let indTarget = 0; indTarget < numTargets; indTarget++) {
            const target : PointMassState = pointMasses[indTarget];
            let accSum = [0, 0, 0];

            for (let indSource = 0; indSource < numTargets; indSource++) {
                if (indSource == indTarget) {
                    continue;
                }
                const source : PointMassState = pointMasses[indSource];

                const rTargetSource = MathUtils.vecDiff(source.r, target.r);
                const accNewton = MathUtils.vecMul(rTargetSource, 
                    source.mu / Rij3[indSource][indTarget]);
                accSum = MathUtils.vecSum(accSum, accNewton);
            }

            accNewton.push(accSum);
        }

        if (!relativistic) {
            return accNewton;
        }

        // Compute relativistic accelerations.
        for (let indTarget = 0; indTarget < numTargets; indTarget++) {
            const target : PointMassState = pointMasses[indTarget];

            let accRel = [0, 0, 0];
            if (!relativistic) {
                continue;
            }
        
            for (let indSource = 0; indSource < numTargets; indSource++) {
                if (indSource == indTarget) {
                    continue;
                }
                const source : PointMassState = pointMasses[indSource];

                const rTargetSource = MathUtils.vecDiff(source.r, target.r);
                const vTargetSource = MathUtils.vecDiff(source.v, target.v);
                const accNewtonTargetSource = MathUtils.vecMul(rTargetSource, source.mu 
                    / Rij3[indSource][indTarget]);

                // The first part of the acceleration formula involves
                // multiplication of the Newtonian acceleration.
                let newtonMult = 0.0;
                for (let indTarget2 = 0; indTarget2 < numTargets; indTarget2++) {
                    const target2 : PointMassState = pointMasses[indTarget2];

                    if (indTarget != indTarget2) {
                        newtonMult -= 4 * target2.mu / Rij[indTarget][indTarget2];
                    }

                    if (indSource != indTarget2) {
                        newtonMult -=  target2.mu / Rij[indSource][indTarget2];
                    }
                }

                const dist = Rij[indSource][indTarget];
                const dist3 = Rij3[indSource][indTarget];

                newtonMult += (MathUtils.norm(target.v) ** 2.0)
                        + 2.0 * (MathUtils.norm(source.v) ** 2.0)
                        - 4.0 * MathUtils.dot(target.v, source.v) 
                        - 1.5 * (MathUtils.dot(rTargetSource, source.v) / dist) ** 2.0
                        + 0.5 * MathUtils.dot(rTargetSource, accNewton[indSource]);
                        
                // Add the Newtonian part and the remaining terms.
                accRel = MathUtils.linComb([
                    1.0,
                    newtonMult / c2, 
                    source.mu / c2 / dist3 * MathUtils.dot(rTargetSource, 
                        MathUtils.linComb([4, -3], [target.v, source.v])),
                    3.5 / c2 * source.mu / dist ],
                    [accRel, accNewtonTargetSource, vTargetSource, accNewton[indSource]]);
                    
            }
            accRelativity.push(accRel);
        }

        for (let indTarget = 0; indTarget < numTargets; indTarget++) {
            accSum.push(MathUtils.vecSum(
                accNewton[indTarget], accRelativity[indTarget]));
        }

        return accSum;
    }
}