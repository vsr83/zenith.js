import corrData from '../data/time_correlation_data.json';
import { StateVector } from './StateVector';
import { Rotations } from './Rotations';
import { NutationData } from './Nutation';
import { MathUtils } from './MathUtils';

/**
 * Enumeration of supported frame orientations.
 */
export enum FrameOrientation {
    ORIENTATION_B1950_ECL,
    ORIENTATION_B1950_EQ,
    ORIENTATION_J2000_ECL,
    ORIENTATION_J2000_EQ,
    ORIENTATION_MOD,
    ORIENTATION_TOD,
    ORIENTATION_TEME,
    ORIENTATION_PEF,
    ORIENTATION_EFI,
    ORIENTATION_ENU,
    ORIENTATION_PERI
}

/**
 * Enumeration of supported frame centers.
 */
export enum FrameCenter {
    CENTER_HELIO,
    CENTER_SSB, 
    CENTER_GEO,
    CENTER_EMB,
    CENTER_TOPOC
}

export class FrameConversions {

    /**
     * Rotate OSV from J2000 to the Mean-of-Date (MoD) frame.
     * 
     * The implementation follows Lieske, J.  - Precession matrix based on
     * IAU/1976/ system of astronomical constants, Astronomy and Astrophysics
     * vol. 73, no. 3, Mar 1979, p.282-284.
     * 
     * @param {StateVector} osvJ2000
     *      OSV in J2000 frame.
     * @param {number} jtTdb 
     *      Julian time (TDB).
     * @returns {StateVector} OSV in MoD frame.
     */
    static rotateJ2000Mod(osvJ2000 : StateVector, jtTdb : number) : StateVector {
        // Julian centuries after J2000.0 epoch.
        const T = (jtTdb - 2451545.0) / 36525.0;
        const T2 = T*T;
        const T3 = T2*T;

        const z =      0.6406161388 * T + 3.0407777777e-04 * T2 + 5.0563888888e-06 * T3;
        const theta =  0.5567530277 * T - 1.1851388888e-04 * T2 - 1.1620277777e-05 * T3;
        const zeta =   0.6406161388 * T + 8.3855555555e-05 * T2 + 4.9994444444e-06 * T3;

        const rMod = Rotations.rotateCart3d(
                        Rotations.rotateCart2d(
                        Rotations.rotateCart3d(osvJ2000.position, -zeta), theta), -z);
        const vMod = Rotations.rotateCart3d(
                        Rotations.rotateCart2d(
                        Rotations.rotateCart3d(osvJ2000.velocity, -zeta), theta), -z);

        return {
            frameCenter : osvJ2000.frameCenter,
            frameOrientation : FrameOrientation.ORIENTATION_MOD,
            position : rMod, 
            velocity : vMod, 
            timeStamp : osvJ2000.timeStamp
        };
    }

    /**
     * Rotate OSV from the Mean-of-Date (MoD) to the J2000 frame.
     * 
     * The implementation follows Lieske, J.  - Precession matrix based on
     * IAU/1976/ system of astronomical constants, Astronomy and Astrophysics
     * vol. 73, no. 3, Mar 1979, p.282-284.
     * 
     * @param {StateVector} osvJ2000
     *      OSV in J2000 frame.
     * @param {number} jtTdb 
     *      Julian time (TDB).
     * @returns {StateVector} OSV in MoD frame.
     */
    static rotateModJ2000(osvMod : StateVector, jtTdb : number) : StateVector
    {
        // Julian centuries after J2000.0 epoch.
        const T = (jtTdb - 2451545.0) / 36525.0;
        const T2 = T*T;
        const T3 = T2*T;

        const z =      0.6406161388 * T + 3.0407777777e-04 * T2 + 5.0563888888e-06 * T3;
        const theta =  0.5567530277 * T - 1.1851388888e-04 * T2 - 1.1620277777e-05 * T3;
        const zeta =   0.6406161388 * T + 8.3855555555e-05 * T2 + 4.9994444444e-06 * T3;

        const rJ2000 = Rotations.rotateCart3d(
                       Rotations.rotateCart2d(
                       Rotations.rotateCart3d(osvMod.position, z), -theta), zeta);
        const vJ2000 = Rotations.rotateCart3d(
                       Rotations.rotateCart2d(
                       Rotations.rotateCart3d(osvMod.velocity, z), -theta), zeta);

        return {
            frameCenter : osvMod.frameCenter,
            frameOrientation : FrameOrientation.ORIENTATION_MOD,
            position : rJ2000, 
            velocity : vJ2000, 
            timeStamp : osvMod.timeStamp
        };
    }

    /**
     * Convert coordinates from Mean-of-Date (MoD) to the True-of-Date (ToD) frame.
     * 
     * @param {StateVector} osv
     *      OSV in MoD frame.
     * @param {NutationData} nutData 
     *      Nutation terms object with fields eps, deps and dpsi.
     * @returns {StateVector} OSV in ToD frame
     */
    static rotateModTod(osv : StateVector, jtTdb : number, nutData : NutationData) : StateVector
    {
        const rTod = Rotations.rotateCart1d(
                     Rotations.rotateCart3d(
                     Rotations.rotateCart1d(osv.position, nutData.eps), 
                     -nutData.dpsi), 
                     -nutData.eps - nutData.deps);
        const vTod = Rotations.rotateCart1d(
                     Rotations.rotateCart3d(
                     Rotations.rotateCart1d(osv.velocity, nutData.eps), 
                     -nutData.dpsi),
                     -nutData.eps - nutData.deps);

        return {
            frameCenter : osv.frameCenter,
            frameOrientation : FrameOrientation.ORIENTATION_TOD,
            position : rTod, 
            velocity : vTod, 
            timeStamp : osv.timeStamp
        };
    }

    /**
     * Convert coordinates from True-of-Date (ToD) to the Mean-of-Date (MoD) frame.
     * 
     * @param {StateVector} osv
     *      OSV in ToD frame.
     * @param {NutationData} nutData
     *      Nutation terms object with fields eps, deps and dpsi. 
     * @returns {StateVector} OSV in MoD frame.
     */
    static rotateTodMod(osv : StateVector, nutData : NutationData) : StateVector
    {
        const rMod = Rotations.rotateCart1d(
                     Rotations.rotateCart3d(
                     Rotations.rotateCart1d(osv.position, nutData.eps + nutData.deps), 
                     nutData.dpsi), 
                    -nutData.eps);
        const vMod = Rotations.rotateCart1d(
                     Rotations.rotateCart3d(
                     Rotations.rotateCart1d(osv.velocity, nutData.eps + nutData.deps), 
                     nutData.dpsi), 
                    -nutData.eps);

        return {
            frameCenter : osv.frameCenter,
            frameOrientation : FrameOrientation.ORIENTATION_MOD,
            position : rMod, 
            velocity : vMod, 
            timeStamp : osv.timeStamp
        };
    }


    /**
     * Convert coordinates from True-of-Date (ToD) to the Pseudo-Earth-Fixed (PEF)
     * frame.
     * 
     * @param {OsvFrame} osv
     *      OSV in ToD frame.
     * @param {NutationData} nutData 
     *      Nutation data.
     * @returns {OsvFrame} OSV in PEF frame.
     */
    static rotateTodPef(osv : StateVector, GAST : number, jtUt1 : number) : StateVector
    {
        const rPef = Rotations.rotateCart3d(osv.position, GAST);
        const vPef = Rotations.rotateCart3d(osv.position, GAST);

        // Alternative expression for the GMST is \sum_{i=0}^3 k_i MJD^i.
        const k1 = 360.985647366;
        const k2 = 2.90788e-13;
        const k3 = -5.3016e-22;
        const MJD = jtUt1 - 2451544.5;
        
        // Compute time-derivative of the GAST to convert velocities:
        const dGASTdt = (1/86400.0) * (k1 + 2*k2*MJD + 3*k3*MJD*MJD);
        vPef[0] += dGASTdt * (Math.PI/180.0) 
                 * (-MathUtils.sind(GAST) * osv.position[0] + MathUtils.cosd(GAST) * osv.position[1]);
        vPef[1] += dGASTdt * (Math.PI/180.0) 
                 * (-MathUtils.cosd(GAST) * osv.position[0] - MathUtils.sind(GAST) * osv.position[1]);

        return {frame : Frame.FRAME_PEF,
            position : rPef, velocity : vPef, timeStamp : osv.timeStamp};
    }
};