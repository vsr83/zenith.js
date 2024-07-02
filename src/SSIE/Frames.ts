import { NutationData } from "../Nutation";
import { Rotations } from "../Rotations";

/**
 * Class implementing static methods the coordinate frame changes required 
 * by the integration.
 */
export class Frames {
    /**
     * Convert coordinates from ecliptic to equatorial system.
     * 
     * @param {number[]} rEcl
     *      Position vector in ecliptic frame. 
     * 
     * @returns {number[]} Position vector in J2000 equatorial frame.
     */
    static coordEclJ2000(rEcl : number[]) : number[]
    {
        // Mean obiquity of the ecliptic at the J2000 epoch.
        // Since the obliquity is at a specific epoch, it is a constant.
        // The value is from 2010 version of the Astronomical Almanac p. B52.
        const eps = 23.439279444444445;
        
        return Rotations.rotateCart1d(rEcl, -eps);
    }

    /**
     * Convert coordinates from equatorial J2000 to ecliptic system.
     * 
     * @param {number[]} rEq
     *      Position vector in equatorial frame.
     * @returns Position vector in ecliptic frame.
     */
    static coordJ2000Ecl(rEq : number[]) : number[]
    {
        // Mean obiquity of the ecliptic at the J2000 epoch.
        // Since the obliquity is at a specific epoch, it is a constant.
        // The value is from 2010 version of the Astronomical Almanac p. B52.
        const eps = 23.439279444444445;

        return Rotations.rotateCart1d(rEq, eps);
    }

    /**
     * Convert coordinates from J2000 (equatorial) to the Mean-of-Date (MoD) 
     * frame.
     * 
     * TODO: The application of this conversion to multiple vectors would be
     * significantly faster, if the method returned a matrix and if the matrix
     * was written below in explicit form instead of as a result of multiple
     * rotations. Moreover, the inverse matrix is just the transpose. However,
     * it is unlikely that this computation is a real bottleneck in the 
     * computation.
     * 
     * References:
     * [1]] Lieske, J.  - Precession matrix based on IAU/1976/ system of 
     * astronomical constants, Astronomy and Astrophysics vol. 73, no. 3, 
     * Mar 1979, p.282-284.
     * 
     * @param {number[]} rJ2000
     *      Position or velocity vector in J2000 frame.
     * @returns {number[]} Position or velocity in MoD frame.
     */
    static coordJ2000Mod(rJ2000 : number[], JT : number) : number[]
    {
        // Julian centuries after J2000.0 epoch.
        const T = (JT - 2451545.0) / 36525.0;
        const T2 = T*T;
        const T3 = T2*T;

        const z     = 0.6406161388 * T + 3.0407777777e-04 * T2 + 5.0563888888e-06 * T3;
        const theta = 0.5567530277 * T - 1.1851388888e-04 * T2 - 1.1620277777e-05 * T3;
        const zeta  = 0.6406161388 * T + 8.3855555555e-05 * T2 + 4.9994444444e-06 * T3;

        const rMod = Rotations.rotateCart3d(
            Rotations.rotateCart2d(
                Rotations.rotateCart3d(rJ2000, -zeta), theta), -z);

        return rMod;
    }

    /**
     * Convert coordinates from Mean-of-Date (MoD) to the J2000 (equatorial )
     * frame.
     * 
     * References:
     * [1]] Lieske, J.  - Precession matrix based on IAU/1976/ system of 
     * astronomical constants, Astronomy and Astrophysics vol. 73, no. 3, 
     * Mar 1979, p.282-284.
     * 
     * @param {number[]} rMod
     *      Position or velocity vector in MoD frame.
     * @returns {number[]} Position or velocity in J2000 frame.
     */
    static coordModJ2000(rMod : number[], JT : number) : number[]
    {
        // Julian centuries after J2000.0 epoch.
        const T = (JT - 2451545.0) / 36525.0;
        const T2 = T*T;
        const T3 = T2*T;

        const z     = 0.6406161388 * T + 3.0407777777e-04 * T2 + 5.0563888888e-06 * T3;
        const theta = 0.5567530277 * T - 1.1851388888e-04 * T2 - 1.1620277777e-05 * T3;
        const zeta  = 0.6406161388 * T + 8.3855555555e-05 * T2 + 4.9994444444e-06 * T3;

        const rJ2000 = Rotations.rotateCart3d(
            Rotations.rotateCart2d(
                Rotations.rotateCart3d(rMod, z), -theta), zeta);

        return rJ2000;
    }

    /**
     * Convert coordinates from Mean-of-Date (MoD) to the True-of-Date (ToD) frame.
     * 
     * @param {number[]} rMod
     *      Position in MoD frame.
     * @param {number} JT
     *      Julian time.
     * @param {NutationData} nutTerms 
     *      Nutation terms object with fields eps, deps and dpsi. If empty, nutation 
     *      is computed.
     * @returns Position in ToD frame.
     */
    static coordModTod(rMod : number[], JT : number, nutTerms : NutationData) : number[]
    {
        // Julian centuries after J2000.0 epoch.
        const T = (JT - 2451545.0) / 36525.0;
        return Rotations.rotateCart1d(Rotations.rotateCart3d(Rotations.rotateCart1d(
            rMod, nutTerms.eps), -nutTerms.dpsi), -nutTerms.eps - nutTerms.deps);
    }

    /**
     * Convert coordinates from True-of-Date (ToD) to the Mean-of-Date (MoD) frame.
     * 
     * @param {number[]} rTod
     *      Position in MoD frame.
     * @param {number} JT
     *      Julian time.
     * @param {NutationData} nutTerms 
     *      Nutation terms object with fields eps, deps and dpsi. If empty, nutation 
     *      is computed.
     * @returns Position in MoD frame.
     */
    static coordTodMod(rTod : number[], JT : number, nutTerms : NutationData) : number[]
    {
        // Julian centuries after J2000.0 epoch.
        const T = (JT - 2451545.0) / 36525.0;

        return Rotations.rotateCart1d(Rotations.rotateCart3d(Rotations.rotateCart1d(
            rTod, nutTerms.eps + nutTerms.deps), nutTerms.dpsi), -nutTerms.eps);
    }

    /**
     * Transform position from J2000 to body coordinates.
     * 
     * REFERENCES: 
     *  [1] Newhall, Standish, Williams - DE 102: a numerically integrated
     *  ephemeris of the Moon and planets spanning forty-four centuries,
     *  Astronomy and Astrophysics, 125, 150-167, 1983.
     * 
     * @param {number[]} r   The position vector in J2000 (equatorial) coordinates.
     * @param {number} phi The clockwise angle along the xy-plane to the line of 
     *                nodes from the x axis (radians)
     * @param {number} theta The clockwise inclination of the body equator (radians).
     * @param {number} psi The clockwise angle from the node to the prime meridian
     *                along the body equator (radians).
     * @returns {number[]} Position in body coordinates.
     */
    static coordJ2000Body(rJ2000 : number[], phi : number, theta : number, psi : number) 
        : number[]{
        return Rotations.rotateCart3(
            Rotations.rotateCart1(
                Rotations.rotateCart3(rJ2000, phi), theta), psi);
    }

    /**
     * Transform position body coordinates to J2000 frame.
     * 
     * REFERENCES: 
     *  [1] Newhall, Standish, Williams - DE 102: a numerically integrated
     *  ephemeris of the Moon and planets spanning forty-four centuries,
     *  Astronomy and Astrophysics, 125, 150-167, 1983.
     * 
     * @param {number[]} r   The position vector in body coordinates.
     * @param {number} phi The clockwise angle along the xy-plane to the line of 
     *                nodes from the x axis (radians)
     * @param {number} theta The clockwise inclination of the body equator (radians).
     * @param {number} psi The clockwise angle from the node to the prime meridian
     *                along the body equator (radians).
     * @returns {number[]} Position non-body coordinates.
     */
    static coordBodyJ2000(rBody : number[], phi : number, theta : number, 
        psi : number) : number[] {
        return Rotations.rotateCart3(
            Rotations.rotateCart1(
                Rotations.rotateCart3(rBody, -psi), -theta), -phi);
    }
}