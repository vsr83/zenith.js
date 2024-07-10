import { StateVector } from "../StateVector";
import { MathUtils } from "../MathUtils";    
import { FrameCenter, FrameOrientation } from "../Frames";

// Coefficients used in the computation of the stellar aberration.
// Meeus - Astronomical Algorithms 1998, Chapter 23
const Acoeff = [
    [0,  1, 0, 0, 0,0,0,0, 0, 0,0], 
    [0,  2, 0, 0, 0,0,0,0, 0, 0,0], 
    [0,  0, 0, 1, 0,0,0,0, 0, 0,0], 
    [0,  0, 0, 0, 0,0,0,1, 0, 0,0], 
    [0,  3, 0, 0, 0,0,0,0, 0, 0,0], 
    [0,  0, 0, 0, 1,0,0,0, 0, 0,0], 
    [0,  0, 0, 0, 0,0,0,0, 0, 0,1], 
    [0,  0, 0, 0, 0,0,0,1, 0, 1,0], 
    [0,  0, 0, 2, 0,0,0,0, 0, 0,0], 
    [0,  2, 0,-1, 0,0,0,0, 0, 0,0], 
    [0,  3,-8, 3, 0,0,0,0, 0, 0,0], 
    [0,  5,-8, 3, 0,0,0,0, 0, 0,0], 
    [2, -1, 0, 0, 0,0,0,0, 0, 0,0], 
    [1,  0, 0, 0, 0,0,0,0, 0, 0,0], 
    [0,  0, 0, 0, 0,1,0,0, 0, 0,0], 
    [0,  1, 0,-2, 0,0,0,0, 0, 0,0], 
    [0,  0, 0, 0, 0,0,1,0, 0, 0,0], 
    [0,  1, 0, 1, 0,0,0,0, 0, 0,0], 
    [2, -2, 0, 0, 0,0,0,0, 0, 0,0], 
    [0,  1, 0,-1, 0,0,0,0, 0, 0,0], 
    [0,  4, 0, 0, 0,0,0,0, 0, 0,0], 
    [0,  3, 0,-2, 0,0,0,0, 0, 0,0], 
    [1, -2, 0, 0, 0,0,0,0, 0, 0,0], 
    [2, -3, 0, 0, 0,0,0,0, 0, 0,0], 
    [0,  0, 0, 0, 2,0,0,0, 0, 0,0], 
    [2, -4, 0, 0, 0,0,0,0, 0, 0,0], 
    [0,  3,-2, 0, 0,0,0,0, 0, 0,0], 
    [0,  0, 0, 0, 0,0,0,1, 2,-1,0], 
    [8,-12, 0, 0, 0,0,0,0, 0, 0,0], 
    [8,-14, 0, 0, 0,0,0,0, 0, 0,0], 
    [0,  0, 2, 0, 0,0,0,0, 0, 0,0], 
    [3, -4, 0, 0, 0,0,0,0, 0, 0,0], 
    [0,  2, 0,-2, 0,0,0,0, 0, 0,0], 
    [3, -3, 0, 0, 0,0,0,0, 0, 0,0], 
    [0,  2,-2, 0, 0,0,0,0, 0, 0,0], 
    [0,  0, 0, 0, 0,0,0,1,-2 ,0,0]];
    
    // Coefficients for the computation of the velocity of the Earth.
    // Meeus - Astronomical Algorithms 1998, Chapter 23
    const xCoeff = [
    [-1719914,  -2, -25,   0], 
    [6434, 141, 28007, -107], 
    [715,   0,   0,   0], 
    [715,   0,   0,   0], 
    [486,  -5, -236,  -4], 
    [159,   0,   0,   0], 
    [0,   0,   0,   0], 
    [39,   0,   0,   0], 
    [33,   0, -10,   0], 
    [31,   0,   1,   0], 
    [8,   0, -28,   0], 
    [8,   0, -28,   0], 
    [21,   0,   0,   0], 
    [-19,   0,   0,   0], 
    [17,   0,   0,   0], 
    [16,   0,   0,   0], 
    [16,   0,   0,   0], 
    [11,   0,  -1,   0], 
    [0,   0, -11,   0], 
    [-11,   0,  -2,   0], 
    [-7,   0,  -8,   0], 
    [-10,   0,   0,   0], 
    [-9,   0,   0,   0], 
    [-9,   0,   0,   0], 
    [0,   0,  -9,   0], 
    [0,   0,  -9,   0], 
    [8,   0,   0,   0], 
    [8,   0,   0,   0], 
    [-4,   0,  -7,   0], 
    [-4,   0,  -7,   0], 
    [-6,   0,  -5,   0], 
    [-1,   0,  -1,   0], 
    [4,   0,  -6,   0], 
    [0,   0,  -7,   0], 
    [5,   0,  -5,   0], 
    [5,   0,   0,   0]];
    
    const yCoeff = [
    [25, -13, 1578089, 156], 
    [25697, -95, -5904, -130], 
    [6,   0, -657,   0], 
    [0,   0, -656,   0], 
    [-216,  -4, -446,   5], 
    [2,   0, -147,   0], 
    [0,   0,  26,   0], 
    [0,   0, -36,   0], 
    [-9,   0, -30,   0], 
    [1,   0, -28,   0], 
    [25,   0,   8,   0], 
    [-25,   0,  -8,   0], 
    [0,   0, -19,   0], 
    [0,   0,  17,   0], 
    [0,   0, -16,   0], 
    [0,   0,  15,   0], 
    [1,   0, -15,   0], 
    [-1,   0, -10,   0], 
    [-10,   0,   0,   0], 
    [-2,   0,   9,   0], 
    [-8,   0,   6,   0], 
    [0,   0,   9,   0], 
    [0,   0,  -9,   0], 
    [0,   0,  -8,   0], 
    [-8,   0,   0,   0], 
    [8,   0,   0,   0], 
    [0,   0,  -8,   0], 
    [0,   0,  -7,   0], 
    [-6,   0,   4,   0], 
    [6,   0,  -4,   0], 
    [-4,   0,   5,   0], 
    [-2,   0,  -7,   0], 
    [-5,   0,  -4,   0], 
    [-6,   0,   0,   0], 
    [-4,   0,  -5,   0], 
    [0,   0,  -5,   0]];
    
    const zCoeff = [
    [10,  32, 684185, -358], 
    [11141, -48, -2559, -55], 
    [-15,   0, -282,   0], 
    [0,   0, -285,   0], 
    [-94,   0, -193,   0], 
    [-6,   0, -61,   0], 
    [0,   0, -59,   0], 
    [0,   0, -16,   0], 
    [-5,   0, -13,   0], 
    [0,   0, -12,   0], 
    [11,   0,   3,   0], 
    [-11,   0,  -3,   0], 
    [0,   0,  -8,   0], 
    [0,   0,   8,   0], 
    [0,   0,  -7,   0], 
    [1,   0,   7,   0], 
    [-3,   0,  -6,   0], 
    [-1,   0,  -5,   0], 
    [-4,   0,   0,   0], 
    [-1,   0,   4,   0], 
    [-3,   0,   3,   0], 
    [0,   0,   4,   0], 
    [0,   0,  -4,   0], 
    [0,   0,  -4,   0], 
    [-3,   0,   0,   0], 
    [3,   0,   0,   0], 
    [0,   0,  -3,   0], 
    [0,   0,  -3,   0], 
    [-3,   0,   2,   0], 
    [3,   0,  -2,   0], 
    [-2,   0,   2,   0], 
    [1,   0,  -4,   0], 
    [-2,   0,  -2,   0], 
    [-3,   0,   0,   0], 
    [-2,   0,  -2,   0], 
    [0,   0,  -2,   0]];

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

    /**
     * Apply stellar and diurnal aberration to the position vector of J2000 OSV.
     * 
     * @param {OsvFrame} osvTargetJ2000 
     *      Target in J2000 frame.
     * @param {OsvFrame} osvEarthJ2000 
     *      The OSV for the Earth in equatorial J2000 heliocentric frame. If diurnal
     *      aberration is included, this should be position of the observer
     *      on Earth.
     */
    static aberrationStellar(osvTargetJ2000 : StateVector, osvEarthJ2000 : StateVector) : StateVector
    {
        const rJ2000 = osvTargetJ2000.position;
        const dist = MathUtils.norm(rJ2000);
        const RA0 = MathUtils.atan2d(rJ2000[1], rJ2000[0]);
        const decl0 = MathUtils.asind(rJ2000[2]/dist);

        const au = 149597870700;
        // From m/s to 10e-8 au/day;
        const factor = 86164.0905 * 1e8 / au;

        const vX = osvEarthJ2000.velocity[0] * factor;
        const vY = osvEarthJ2000.velocity[1] * factor;
        const vZ = osvEarthJ2000.velocity[2] * factor;

        // Velocity of light in au/day.
        const c = 17314463350;
        
        // Updates to the RA and decl due to aberration.
        const delta_RA = (180/Math.PI) * (vY*MathUtils.cosd(RA0) - vX*MathUtils.sind(RA0))
                       / (c * MathUtils.cosd(decl0));
        const delta_decl = - (180/Math.PI) * ((vX*MathUtils.cosd(RA0) + vY*MathUtils.sind(RA0))
                         * MathUtils.sind(decl0) - vZ * MathUtils.cosd(decl0)) / c;
        
        // Update RA, decl and position.
        const RA = RA0 + delta_RA;
        const decl = decl0 + delta_decl;

        // TBD: Should we also apply similar correction to the velocity?
        const rJ2000Updated = [dist * MathUtils.cosd(RA) * MathUtils.cosd(decl), 
                               dist * MathUtils.sind(RA) * MathUtils.cosd(decl),
                               dist * MathUtils.sind(decl)];

        return {
            frameCenter : FrameCenter.BODY_CENTER,
            frameOrientation : FrameOrientation.J2000_EQ,
            position : rJ2000Updated,
            velocity : osvTargetJ2000.velocity,
            timeStamp : osvTargetJ2000.timeStamp
        };
    }

    /**
     * Compute stellar aberration in Cartesian coordinates.
     * 
     * @param {*} JT 
     *      Julian time used to compute the velocity of Earth.
     * @param {*} rJ2000 
     *      Position in J2000 without stellar aberration.
     * @param {*} dVJ2000 
     *      Velocity in the J2000 frame to be added to the velocity of the center
     *      of the Earth. If undefined, the value is set to zero.
     */
    static aberrationStellarCart(JT : number, rJ2000 : number[], dVJ2000 : number[])
    {
        const dist = MathUtils.norm(rJ2000);
        const RA0 = MathUtils.atan2d(rJ2000[1], rJ2000[0]);
        const decl0 = MathUtils.asind(rJ2000[2]/dist);
        let {RA, decl} = Aberration.aberrationStellarSph(JT, RA0, decl0, dVJ2000);
    
        console.log(rJ2000);
        rJ2000 = [dist * MathUtils.cosd(RA) * MathUtils.cosd(decl), 
                  dist * MathUtils.sind(RA) * MathUtils.cosd(decl),
                  dist * MathUtils.sind(decl)];
                  console.log(rJ2000);
                  return rJ2000;
    }
    
    /**
     * Compute stellar aberration in spherical coordinates with the Ron-Vondrak 
     * expression.
     * See Meeus - Astronomical Algorithms 1998, Chapter 23.
     * 
     * @param {*} JT 
     *      Julian time used to compute the velocity of Earth.
     * @param {*} RA 
     *      Right ascension (degrees).
     * @param {*} decl 
     *      Declination (degrees).
     * @param {*} dvJ2000 
     *      Velocity in the J2000 frame to be added to the velocity of the center
     *      of the Earth. If undefined, the value is set to zero.
     * @returns Object with RA and decl fields containing the stellar aberration.
     */
    static aberrationStellarSph(JT: number, RA: number, decl: number, dvJ2000: number[])
    {
        if (dvJ2000 === undefined)
        {
            dvJ2000 = [0, 0, 0];
        }
    
        // Number of Julian centuries from J2000: 
        const T = (JT - 2451545.0)/36525.0;
    
        const L2 = 3.1761467 + 1021.3285546 * T;
        const L3 = 1.7534703 +  628.3075849 * T;
        const L4 = 6.2034809 +  334.0612431 * T;
        const L5 = 0.5995465 +   52.9690965 * T;
        const L6 = 0.8740168 +   21.3299095 * T;
        const L7 = 5.4812939 +    7.4781599 * T;
        const L8 = 5.3118863 +    3.8133036 * T;
        const Ld = 3.8103444 + 8399.6847337 * T;
        const D  = 5.1984667 + 7771.3771486 * T;
        const Md = 2.3555559 + 8328.6914289 * T;
        const F  = 1.6279052 + 8433.4661601 * T;
        
        const numCoeff = xCoeff.length;
        const Amul = [L2, L3, L4, L5, L6, L7, L8, Ld, D, Md, F];
        
        let vX = 0.0;
        let vY = 0.0;
        let vZ = 0.0;
    
        for (let indCoeff = 0; indCoeff < numCoeff; indCoeff++)
        {
            let A = 0;
            for (let indA = 0; indA < Amul.length; indA++)
            {
                A += Amul[indA] * Acoeff[indCoeff][indA];
            }
    
            // Velocity of the center of the Earth
            vX += (xCoeff[indCoeff][0] + xCoeff[indCoeff][1] * T) * Math.sin(A) 
                + (xCoeff[indCoeff][2] + xCoeff[indCoeff][3] * T) * Math.cos(A);
            vY += (yCoeff[indCoeff][0] + yCoeff[indCoeff][1] * T) * Math.sin(A) 
                + (yCoeff[indCoeff][2] + yCoeff[indCoeff][3] * T) * Math.cos(A);
            vZ += (zCoeff[indCoeff][0] + zCoeff[indCoeff][1] * T) * Math.sin(A) 
                + (zCoeff[indCoeff][2] + zCoeff[indCoeff][3] * T) * Math.cos(A);
        }
        
        //const osvEarthEcl = vsop87('earth', JT);
        //osvEarthEcl.JT = JT;
        //const osvEarthJ2000 = coordEclEq(osvEarthEcl);
        //console.log(vX);
    
        const au = 149597870700;
        // From m/s to 10e-8 au/day;
        const factor = 86164.0905 * 1e8 / au;
        //console.log(vX + " " + vY + " " + vZ);
    
        //vX = osvEarthJ2000.v[0] * factor;
        //vY = osvEarthJ2000.v[1] * factor;
        //vZ = osvEarthJ2000.v[2] * factor;
        //console.log(vX + " " + vY + " " + vZ);
        
        vX += factor * dvJ2000[0];
        vY += factor * dvJ2000[1];
        vZ += factor * dvJ2000[2];
        
        // Velocity of light in au/day.
        const c = 17314463350;
        
        const delta_RA = (180/Math.PI) * (vY*MathUtils.cosd(RA) - vX*MathUtils.sind(RA))/(c * MathUtils.cosd(decl));
        const delta_decl = - (180/Math.PI) * ((vX*MathUtils.cosd(RA) + vY*MathUtils.sind(RA))*MathUtils.sind(decl) - vZ * MathUtils.cosd(decl)) / c;
        
        RA = RA + delta_RA;
        decl = decl + delta_decl;
    
        return {RA : RA, decl : decl};
    }    
}