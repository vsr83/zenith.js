import { MathUtils } from "../MathUtils";
import { constants } from "./Constants";

/**
 * Interface for the accelerations of the Moon and the Earth due to tides.
 */
export interface AccelerationTides {
    // Acceleration of the Moon due to tides in the ToD frame.
    accMoonTod : number[];
    // Acceleration of the Earth due to tides in the ToD frame.
    accEarthTod : number[];
};

/**
 * Class implementing static methods for the computations of tides.
 */
export class Tides {
    /**
     * Compute acceleration of the Moon and the Earth due to tides.
     * 
     * [1] Newhall, Standish, Williams - DE 102: a numerically integrated
     * ephemeris of the Moon and planets spanning forty-four centuries,
     * Astronomy and Astrophysics, 125, 150-167, 1983.
     * [2] Steve Moshier, DE118i available at 
     * http://www.moshier.net/de118i-2.zip
     * 
     * @param {number[]} rMeTod 
     *      The position of the Moon w.r.t. Earth in the ToD frame (au, 3)
     * @param {number} muE 
     *      Standard gravitational parameter (au^3/d^2) for Earth.
     * @param {number} muM 
     *      Standard gravitational parameter (au^3/d^2) for Moon.
     * @returns Objects with fields accMeTodTides and accEmTodTides for the 
     *      accelerations of the Moon and the Earth (au/d^2, 3).
     */
    static accTides(rMeTod : number[], muE : number, muM : number) {
        // Distance between Earth and the Moon.
        const rEm = MathUtils.norm(rMeTod);
        const accMoon =  MathUtils.vecMul(
            [rMeTod[0] + constants.phase * rMeTod[1],
            rMeTod[1] - constants.phase * rMeTod[0],
            rMeTod[2]],     
            - (3 * constants.love * muM) * (1 + muM/muE) 
            * (constants.aEarth ** 5 / rEm ** 8));
        const accEarth = MathUtils.vecMul(accMoon, -muM / muE);

        return {accMeTodTides : accMoon, accEmTodTides : accEarth};
    }
}