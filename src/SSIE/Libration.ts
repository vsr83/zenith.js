import { constants } from "./Constants";

/**
 * Interface describing the state of libration.
 */
export interface LibrationState {
    // The clockwise angle along the xy-plane to the line of nodes from 
    // the x-axis (rad).
    phi    : number;
    // Clockwise inclination of the body equator (rad).
    theta  : number;
    // The clockwise angle from the node to the prime meridian along the 
    // body equator (rad).
    psi    : number;
    // Time derivative of phi (rad/d).
    phi1   : number;
    // Time derivative of theta (rad/d).
    theta1 : number;
    // Time derivative of psi (rad/d).
    psi1   : number; 
}

/**
 * Interface for the output from libration computations.
 */
export interface LibrationOutput {
    // Second time derivative of phi (rad/d^2).
    phi2   : number;
    // Second time derivative of theta (rad/d^2).
    theta2 : number;
    // Second time derivative of psi (rad/d^2).
    psi2   : number;
};

/**
 * Principal moments of inertia for the Moon per unit mass (au^2).
 * The moment of inertia factors C/MR^2 are dimensionless. For example, [4]
 * gives C/MR^2 = 0.3905 +- 0.0023. The lunar radius in Table 4 of [4] is
 * 1738 km = 1.1617812e-05 au. Thereafter, thee principal moment of inertia
 * per unit mass C/M = 0.3905 * (1.1617812e-05^2) au^2 = 5.2707e-11 au^2.
 */
export interface MoonInertia {
    A : number;
    B : number; 
    C : number;
    betaL : number;
    gammaL : number;
};

/**
 * Class containing static methods for the computation of libration.
 */
export class Libration {
    /**
     * Compute the second derivatives for the Moon libration angles.
     * 
     * This method computes the expression in equation (3) of [1] or (8.6)-(8.8) 
     * in [2].
     * 
     * The method fills the fields phi2, theta2 and psi2 (rad/d^2).
     * 
     * REFERENCES: 
     *  [1] Newhall, Standish, Williams - DE 102: a numerically integrated
     *  ephemeris of the Moon and planets spanning forty-four centuries,
     *  Astronomy and Astrophysics, 125, 150-167, 1983.
     *  [2] Urban, Seidelmann - Explanatory Supplement to the Astronomical
     *  Almanac, 3rd edition, University Science Books, 2013.
     *  [3] Steve Moshier, DE118i available at 
     *  http://www.moshier.net/de118i-2.zip
     *  [4] Ferrari et. al. - Geophysical Parameters of the Earth-Moon System,
     *  Journal of Geophysical Research, 1980.
     * 
     * @param {LibrationState} librationState 
     *      Libration state with the fields phi, phi1, theta, theta1, psi, psi1 
     *      (rad or rad/day).
     * @param {number[]} N 
     *      Torque per unit mass in body coordinates.
     */
    static librationMoon(state : LibrationState, N : number[]) : LibrationOutput{
        const inertiaMoon = constants.inertiaMoon;

        const {phi, theta, psi, phi1, theta1, psi1} = state;

        // Angular velocity vector.
        const omegaX = phi1 * Math.sin(theta) * Math.sin(psi) + theta1 * Math.cos(psi);
        const omegaY = phi1 * Math.sin(theta) * Math.cos(psi) - theta1 * Math.sin(psi);
        const omegaZ = phi1 * Math.cos(theta) + psi1;

        // Differential equations for the angular velocity from Euler's equations.
        const omegaX1 =  omegaY * omegaZ * (inertiaMoon.gammaL - inertiaMoon.betaL) 
                    / (1 - inertiaMoon.betaL * inertiaMoon.gammaL) + N[0] / inertiaMoon.A;
        const omegaY1 =  omegaZ * omegaX * inertiaMoon.betaL + N[1] / inertiaMoon.B;
        const omegaZ1 = -omegaX * omegaY * inertiaMoon.gammaL + N[2] / inertiaMoon.C;

        // Differential equations for the three Euler angles.
        const phi2 = (omegaX1 * Math.sin(psi) + omegaY1 * Math.cos(psi) 
                + theta1 * (psi1 - phi1 * Math.cos(theta))) / Math.sin(theta);
        const theta2 = omegaX1 * Math.cos(psi) - omegaY1 * Math.sin(psi) 
                    - phi1 * psi1 * Math.sin(theta);
        const psi2 = omegaZ1 - phi2 * Math.cos(theta) + phi1 * theta1 * Math.sin(theta);

        return {phi2 : phi2, theta2 : theta2, psi2 : psi2};
    }
};