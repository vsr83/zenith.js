import { Rotations } from "../Rotations";
import { MathUtils } from "../MathUtils";
import { Polynomials } from "./Polynomials";
import { PointMassState } from "./PointMass";
import { constants } from "./Constants";
import { Frames } from "../SSIE/Frames";
import { Libration, LibrationOutput, LibrationState } from "../SSIE/Libration";
import { Tides } from "../SSIE/Tides";
import { Nutation, NutationData } from "../Nutation";

/**
 * Output from the figure computations.
 */
export interface FigureOutput {
    // Acceleration of the Sun in the J2000 frame.
    accSJ2000 : number[]; 
    // Acceleration of the Earth in the J2000 frame.
    accEJ2000 : number[];
    // Acceleration of the Moon in the J2000 frame.
    accMJ2000 : number[];
    // Angular accelerations in the libration.
    libration : LibrationOutput
};

/**
 * Class implementing static methods for computation of figure effects.
 */
export class Figure {
    /**
     * Compute the acceleration and torque due to zonal and tesseral harmonics 
     * from an extended body.
     * 
     * This method computes the expression in equation (2) of [1] or (8.3) in
     * [2] and transforms the acceleration to body coordinates. 
     * 
     * REFERENCES: 
     *  [1] Newhall, Standish, Williams - DE 102: a numerically integrated
     *  ephemeris of the Moon and planets spanning forty-four centuries,
     *  Astronomy and Astrophysics, 125, 150-167, 1983.
     *  [2] Urban, Seidelmann - Explanatory Supplement to the Astronomical
     *  Almanac, 3rd edition, University Science Books, 2013.
     *  [3] Steve Moshier, DE118i available at 
     *  http://www.moshier.net/de118i-2.zip * 
     * 
     * @param {number[]} rPoint 
     *      The position of the point-mass w.r.t. the body center in body 
     *      coordinates (au).
     * @param {number} a 
     *      The equatorial radius of the extended body (au).
     * @param {number} mu 
     *      Standard gravitational parameter (au^3/d^2) or 1 if the results 
     *      are multiplied with -mu afterwards.
     * @param {number[]} Jn 
     *      Zonal harmonics for the extended body starting from n = 2.
     * @param {number[][]} CSnm 
     *      Tesseral harmonics in the (n, m, C_nm, Snm) row format.
     * @returns {number[]} The acceleration of the point mass in body coordinates 
     *      (au/d^2, 3).
     */
    static accBody(rPoint : number[], a : number, mu : number, Jn : number[], 
        CSnm : number[][]) : number[] {
        // Distance between center of the extended body and the point mass.
        const r = MathUtils.norm(rPoint);

        // Latitude and longitude of the point mass w.r.t. body coordinates (rad).
        const sinLat = rPoint[2] / MathUtils.norm(rPoint);
        const latPoint = Math.asin(sinLat);
        const lonPoint = Math.atan2(rPoint[1], rPoint[0]);
        const cosLat = Math.cos(latPoint);

        // Number of zonal harmonics starting from n=2.
        const numberZonal = Jn.length;
        const numberTesseral = CSnm.length;
        
        let accPointZonal = [0, 0, 0];
        let accPointTesseral = [0, 0, 0];
        let accPoint = [0, 0, 0];

        // Evaluate zonal harmonics.
        for (let indZonal = 0; indZonal < numberZonal; indZonal++) {
            const n = indZonal + 2;

            // Legendre value and derivative terms.
            const Pn    = Polynomials.legendreValue(n, sinLat);
            const PnDot = Polynomials.legendreDeriv(n, sinLat);

            accPointZonal = MathUtils.linComb([1, Jn[indZonal] * Math.pow(a/r, n)], 
                [accPointZonal, [(n + 1) * Pn, 0, -cosLat * PnDot]]);
        }
        accPointZonal = MathUtils.vecMul(accPointZonal, -mu / (r * r));

        // Evaluate tesseral harmonics.
        for (let indTesseral = 0; indTesseral < numberTesseral; indTesseral++) {
            const n    = CSnm[indTesseral][0];
            const m    = CSnm[indTesseral][1];
            const Cnm  = CSnm[indTesseral][2];
            const Snm  = CSnm[indTesseral][3];
        
            const cosMlon = Math.cos(m * lonPoint);
            const sinMlon = Math.sin(m * lonPoint);

            const Pnm    = Math.pow(-1, m) * Polynomials.legendreAssoc(n, m, sinLat);
            const PnmDot = Math.pow(-1, m) * Polynomials.legendreAssocd(n, m, sinLat);

            accPointTesseral = MathUtils.linComb([1, Math.pow(a / r, n)],
                [accPointTesseral,
                [-(n + 1)     * Pnm    * ( Cnm * cosMlon + Snm * sinMlon), 
                (m/cosLat) * Pnm    * (-Cnm * sinMlon + Snm * cosMlon), 
                cosLat     * PnmDot * ( Cnm * cosMlon + Snm * sinMlon)]]);
        }
        accPointTesseral = MathUtils.vecMul(accPointTesseral, -mu / (r * r));
        accPoint = MathUtils.linComb([1, 1], [accPointZonal, accPointTesseral]);

        return Rotations.rotateCart3(
            Rotations.rotateCart2(accPoint, latPoint), -lonPoint);
    }

    /**
     * Compute the accelerations due to Earth and Moon figure and tides.
     * 
     * This method is heavily based on the oblate method in [2].
     * 
     * REFERENCES: 
     * [1] Newhall, Standish, Williams - DE 102: a numerically integrated
     * ephemeris of the Moon and planets spanning forty-four centuries,
     * Astronomy and Astrophysics, 125, 150-167, 1983.
     * [2] Steve Moshier, DE118i available at 
     *  http://www.moshier.net/de118i-2.zip  
     * 
     * @param {LibrationState} librationState 
     *      Libration state.
     * @param {number} JT 
     *      Julian time.
     * @returns Array of accelerations (au/d^2, 3) for "Sun", "Earth", "Moon".
     */
    static accOblateness(osvSun : PointMassState, osvEarth : PointMassState, 
        osvMoon : PointMassState, librationState : LibrationState, JT : number) :
        FigureOutput {

        const rS = osvSun.r;
        const rE = osvEarth.r;
        const rM = osvMoon.r;
        const muS = osvSun.mu;
        const muE = osvEarth.mu;
        const muM = osvMoon.mu;
        const Je = constants.Je;
        const Jm = constants.Jm;
        const CSnm = constants.CSnm;

        // Parse libration angles.
        const phi    = librationState.phi;
        const theta  = librationState.theta;
        const psi    = librationState.psi;

        const nutData : NutationData = 
            Nutation.iau1980((JT - 2451545.0) / 36525.0);

        // The position of the Earth w.r.t. Moon body center in DE118/J2000 and 
        // body coordinates.
        const rEmJ2000 = MathUtils.vecDiff(rE, rM);
        const rEmBody = Frames.coordJ2000Body(rEmJ2000, phi, theta, psi);

        // Acceleration/mu and
        const accEmBodyTmp = this.accBody(rEmBody, constants.aMoon, 1, Jm, CSnm);
        // Torque per unit mass.
        const Tearth = MathUtils.cross(rEmBody, accEmBodyTmp);

        // 1. Accelerations from the interaction between the Moon figure and Earth.
        const accEmBody     = MathUtils.vecMul(accEmBodyTmp, -muM);
        const accEmJ2000Fig = Frames.coordBodyJ2000(accEmBody, phi, theta, psi);
        const accMeBody     = MathUtils.vecMul(accEmBodyTmp, muE);
        const accMeJ2000Fig = Frames.coordBodyJ2000(accMeBody, phi, theta, psi);

        const rSmJ2000 = MathUtils.vecDiff(rS, rM);
        const rSmBody  = Frames.coordJ2000Body(rSmJ2000, phi, theta, psi);
        const accSmBodyTmp = this.accBody(rSmBody, constants.aMoon, 1, Jm, CSnm);
        const Tsun = MathUtils.cross(rSmBody, accSmBodyTmp);

        // 2. Accelerations from the interaction between the Moon figure and Sun.
        const accSmBody     = MathUtils.vecMul(accSmBodyTmp, -muM);
        const accSmJ2000Fig = Frames.coordBodyJ2000(accSmBody, phi, theta, psi);
        const accMsBody     = MathUtils.vecMul(accSmBodyTmp, muS);
        const accMsJ2000Fig = Frames.coordBodyJ2000(accMsBody, phi, theta, psi);

        // 3. Libration of the Moon.

        // Compute the total torque on the Moon and the angular accelerations.
        const T = MathUtils.linComb([muE, muS], [Tearth, Tsun]);
        const libration = Libration.librationMoon(librationState, T);

        // 4. Oblateness of the Earth.

        // The position of the Moon w.r.t. Earth body center in DE118/J2000.
        const rMeJ2000 = MathUtils.vecDiff(rM, rE);

        // The position of the Sun w.r.t. Earth body center in DE118/J2000.
        const rSeJ2000 = MathUtils.vecDiff(rS, rE);

        // Transform the relative position of the Moon to the True-of-Date frame.
        const rMeTod = Frames.coordModTod(
            Frames.coordJ2000Mod(rMeJ2000, JT), JT, nutData);

        // Transform the relative position of the Sun to the True-of-Date frame.
        const rSeTod = Frames.coordModTod(
            Frames.coordJ2000Mod(rSeJ2000, JT), JT, nutData);

        const accMeTodTmp = this.accBody(rMeTod, constants.aEarth, 1, Je, []);
        const accSeTodTmp = this.accBody(rSeTod, constants.aEarth, 1, Je, []);

        const accMeTod = MathUtils.vecMul(accMeTodTmp, -muE);
        const accSeTod = MathUtils.vecMul(accSeTodTmp, -muE);
        const accEmTod = MathUtils.vecMul(accMeTodTmp, muM);
        const accEsTod = MathUtils.vecMul(accSeTodTmp, muS);

        // 5. Accelerations from the interaction between Earth tides and the Moon.
        //[acc_me_tod_tides, acc_em_tod_tides] = acc_tides(r_me_tod, mu_e, mu_m);
        const {accMeTodTides , accEmTodTides} = Tides.accTides(rMeTod, muE, muM);

        // Convert accelerations from Earth oblateness and tides to J2000 frame.
        const accMeJ2000Obl = Frames.coordModJ2000(Frames.coordTodMod(
            accMeTod, JT, nutData), JT);
        const accSeJ2000Obl = Frames.coordModJ2000(Frames.coordTodMod(
            accSeTod, JT, nutData), JT);
        const accEmJ2000Obl = Frames.coordModJ2000(Frames.coordTodMod(
            accEmTod, JT, nutData), JT);
        const accEsJ2000Obl = Frames.coordModJ2000(Frames.coordTodMod(
            accEsTod, JT, nutData), JT);
        const accMeJ2000Tides = Frames.coordModJ2000(Frames.coordTodMod(
            accMeTodTides, JT, nutData), JT);
        const accEmJ2000Tides = Frames.coordModJ2000(Frames.coordTodMod(
            accEmTodTides, JT, nutData), JT);

        const accSJ2000 = MathUtils.vecSum(accSmJ2000Fig, accSeJ2000Obl);
        const accEJ2000 = MathUtils.linComb([1, 1, 1, 1], 
            [accEsJ2000Obl, accEmJ2000Fig, accEmJ2000Obl, accEmJ2000Tides]);
        const accMJ2000 = MathUtils.linComb([1, 1, 1, 1], 
            [accMsJ2000Fig, accMeJ2000Fig, accMeJ2000Obl, accMeJ2000Tides]);

            /*
        console.log('Moon Figure <-> Earth : Earth Acceleration');
        console.log(accEmJ2000Fig);
        console.log('Moon Figure <-> Earth : Moon Acceleration');
        console.log(accMeJ2000Fig);
        console.log('Moon Figure <-> Sun : Sun Acceleration');
        console.log(accSmJ2000Fig);
        console.log('Moon Figure <-> Sun : Moon Acceleration');
        console.log(accMsJ2000Fig);
        console.log('Earth Oblateness <-> Moon : Earth Acceleration');
        console.log(accEmJ2000Obl);
        console.log('Earth Oblateness <-> Moon : Moon Acceleration');
        console.log(accMeJ2000Obl);
        console.log('Earth Oblateness <-> Sun : Earth Acceleration');
        console.log(accEsJ2000Obl);
        console.log('Earth Oblateness <-> Sun : Sun Acceleration');
        console.log(accSeJ2000Obl);
        console.log('Earth Tides <-> Moon : Earth Acceleration');
        console.log(accEmJ2000Tides);
        console.log('Earth Tides <-> Moon : Moon Acceleration');
        console.log(accMeJ2000Tides);        
        */
        return {
            accSJ2000 : accSJ2000,
            accEJ2000 : accEJ2000, 
            accMJ2000 : accMJ2000,
            libration : libration
        };
    }
}