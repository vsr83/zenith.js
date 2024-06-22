import corrData from '../data/time_correlation_data.json';
import { StateVector } from './StateVector';
import { Rotations } from './Rotations';
import { NutationData } from './Nutation';
import { MathUtils } from './MathUtils';
import { EarthPosition, Wgs84 } from './Wgs84';
import { TimeStamp } from './TimeStamp';
import { TimeConvention } from './TimeCorrelation';
import { EopParams } from './EopParams';

/**
 * Enumeration of supported frame orientations.
 */
export enum FrameOrientation {
    B1950_ECL = 'B1950_ECL',
    B1950_EQ  = 'B1950_EQ',
    J2000_ECL = 'J2000_ECL',
    J2000_EQ  = 'J2000_EQ',
    MOD       = 'MoD',
    TOD       = 'ToD',
    TEME      = 'TEME',
    PEF       = 'PEF',
    EFI       = 'EFI',
    ENU       = 'ENU',
    PERI      = 'PERI'
}

/**
 * Enumeration of supported frame centers.
 */
export enum FrameCenter {
    // Heliocenter
    CENTER_HELIO,
    // Solar System Barycenter.
    CENTER_SSB, 
    // Geocenter.
    CENTER_GEO,
    // Earth-Moon Barycenter.
    CENTER_EMB,
    // Topocentric.
    CENTER_TOPOC
}

/**
 * Map associating time stamp to different conventions.
 */
const transMap : Map<FrameOrientation, Map<FrameOrientation, FrameOrientation[]>> = new Map<FrameOrientation, Map<FrameOrientation, FrameOrientation[]>>();

const mainSequence : FrameOrientation[] = [
    FrameOrientation.J2000_ECL,
    FrameOrientation.J2000_EQ,
    FrameOrientation.MOD,
    FrameOrientation.TOD,
    FrameOrientation.PEF,
    FrameOrientation.EFI,
    FrameOrientation.ENU
];


const transJ2000Ecl : Map<FrameOrientation, FrameOrientation[]> = new Map<FrameOrientation, FrameOrientation[]>();
transMap.set(FrameOrientation.J2000_ECL, transJ2000Ecl);
transJ2000Ecl.set(FrameOrientation.J2000_ECL, []);
transJ2000Ecl.set(FrameOrientation.J2000_EQ,  mainSequence.slice(1, 2));
transJ2000Ecl.set(FrameOrientation.MOD,       mainSequence.slice(1, 3));
transJ2000Ecl.set(FrameOrientation.TOD,       mainSequence.slice(1, 4));
transJ2000Ecl.set(FrameOrientation.PEF,       mainSequence.slice(1, 5));
transJ2000Ecl.set(FrameOrientation.EFI,       mainSequence.slice(1, 6));
transJ2000Ecl.set(FrameOrientation.ENU,       mainSequence.slice(1, 7));
transJ2000Ecl.set(FrameOrientation.TEME,      mainSequence.slice(1, 4).concat([FrameOrientation.TEME]));


const transJ2000 : Map<FrameOrientation, FrameOrientation[]> = new Map<FrameOrientation, FrameOrientation[]>();
transMap.set(FrameOrientation.J2000_EQ, transJ2000);
transJ2000.set(FrameOrientation.J2000_ECL, mainSequence.slice(0, 1));
transJ2000.set(FrameOrientation.J2000_EQ,  []);
transJ2000.set(FrameOrientation.MOD,       mainSequence.slice(2, 3));
transJ2000.set(FrameOrientation.TOD,       mainSequence.slice(2, 4));
transJ2000.set(FrameOrientation.PEF,       mainSequence.slice(2, 5));
transJ2000.set(FrameOrientation.EFI,       mainSequence.slice(2, 6));
transJ2000.set(FrameOrientation.ENU,       mainSequence.slice(2, 7));
transJ2000.set(FrameOrientation.TEME,      mainSequence.slice(2, 4).concat([FrameOrientation.TEME]));

const transMoD : Map<FrameOrientation, FrameOrientation[]> = new Map<FrameOrientation, FrameOrientation[]>();
transMap.set(FrameOrientation.MOD, transMoD);
transMoD.set(FrameOrientation.J2000_ECL, mainSequence.slice(0, 2).reverse());
transMoD.set(FrameOrientation.J2000_EQ,  mainSequence.slice(1, 2).reverse());
transMoD.set(FrameOrientation.MOD,       []);
transMoD.set(FrameOrientation.TOD,       mainSequence.slice(3, 4));
transMoD.set(FrameOrientation.PEF,       mainSequence.slice(3, 5));
transMoD.set(FrameOrientation.EFI,       mainSequence.slice(3, 6));
transMoD.set(FrameOrientation.ENU,       mainSequence.slice(3, 7));
transMoD.set(FrameOrientation.TEME,      mainSequence.slice(3, 4).concat([FrameOrientation.TEME]));

const transToD : Map<FrameOrientation, FrameOrientation[]> = new Map<FrameOrientation, FrameOrientation[]>();
transMap.set(FrameOrientation.TOD, transToD);
transToD.set(FrameOrientation.J2000_ECL, mainSequence.slice(0, 3).reverse());
transToD.set(FrameOrientation.J2000_EQ,  mainSequence.slice(1, 3).reverse());
transToD.set(FrameOrientation.MOD,       mainSequence.slice(2, 3).reverse());
transToD.set(FrameOrientation.TOD,       []);
transToD.set(FrameOrientation.PEF,       mainSequence.slice(4, 5));
transToD.set(FrameOrientation.EFI,       mainSequence.slice(4, 6));
transToD.set(FrameOrientation.ENU,       mainSequence.slice(4, 7));
transToD.set(FrameOrientation.TEME,      [FrameOrientation.TEME]);

const transPef : Map<FrameOrientation, FrameOrientation[]> = new Map<FrameOrientation, FrameOrientation[]>();
transMap.set(FrameOrientation.PEF, transPef);
transPef.set(FrameOrientation.J2000_ECL, mainSequence.slice(0, 4).reverse());
transPef.set(FrameOrientation.J2000_EQ,  mainSequence.slice(1, 4).reverse());
transPef.set(FrameOrientation.MOD,       mainSequence.slice(2, 4).reverse());
transPef.set(FrameOrientation.TOD,       mainSequence.slice(3, 4).reverse());
transPef.set(FrameOrientation.PEF,       []);
transPef.set(FrameOrientation.EFI,       mainSequence.slice(5, 6));
transPef.set(FrameOrientation.ENU,       mainSequence.slice(5, 7));
transPef.set(FrameOrientation.TEME,      mainSequence.slice(3, 4).reverse().concat([FrameOrientation.TEME]));

const transEfi : Map<FrameOrientation, FrameOrientation[]> = new Map<FrameOrientation, FrameOrientation[]>();
transMap.set(FrameOrientation.EFI, transEfi);
transEfi.set(FrameOrientation.J2000_ECL, mainSequence.slice(0, 5).reverse());
transEfi.set(FrameOrientation.J2000_EQ,  mainSequence.slice(1, 5).reverse());
transEfi.set(FrameOrientation.MOD,       mainSequence.slice(2, 5).reverse());
transEfi.set(FrameOrientation.TOD,       mainSequence.slice(3, 5).reverse());
transEfi.set(FrameOrientation.PEF,       mainSequence.slice(4, 5).reverse());
transEfi.set(FrameOrientation.EFI,       []);
transEfi.set(FrameOrientation.ENU,       mainSequence.slice(6, 7));
transEfi.set(FrameOrientation.TEME,      mainSequence.slice(3, 5).reverse().concat([FrameOrientation.TEME]));

const transEnu : Map<FrameOrientation, FrameOrientation[]> = new Map<FrameOrientation, FrameOrientation[]>();
transMap.set(FrameOrientation.ENU, transEnu);
transEnu.set(FrameOrientation.J2000_ECL, mainSequence.slice(0, 6).reverse());
transEnu.set(FrameOrientation.J2000_EQ,  mainSequence.slice(1, 6).reverse());
transEnu.set(FrameOrientation.MOD,       mainSequence.slice(2, 6).reverse());
transEnu.set(FrameOrientation.TOD,       mainSequence.slice(3, 6).reverse());
transEnu.set(FrameOrientation.PEF,       mainSequence.slice(4, 6).reverse());
transEnu.set(FrameOrientation.EFI,       mainSequence.slice(5, 6).reverse());
transEnu.set(FrameOrientation.ENU,       []);
transEnu.set(FrameOrientation.TEME,      mainSequence.slice(3, 6).reverse().concat([FrameOrientation.TEME]));

console.log(transMap);
console.log(transMap.get(FrameOrientation.J2000_EQ));
console.log(transMap.get(FrameOrientation.J2000_EQ)?.get(FrameOrientation.TOD));


/**
 * Class implementing conversion between frames via translations and rotations.
 */
export class FrameConversions {
    // Earth Orientation Parameters.
    private eopParams : EopParams;

    /**
     * Public constructor.
     * 
     * @param {EopParams} eopParams 
     *      Earth orientation parameters used for transformations.
     */
    public constructor(eopParams : EopParams) {
        this.eopParams = eopParams;
    }
    
    /**
     * Rotate vector to target frame.
     *       
     * J2000_ECL -- J2000_EQ -- MoD -- ToD -- PEF -- EFI -- ENU
     * 
     * @param {StateVector} osvIn
     *      Orbit state vector. 
     * @param {FrameOrientation} targetFrame 
     *      Target frame.
     * @returns {StateVector} Target OSV.
     */
    public rotateTo(osvIn : StateVector, targetFrame : FrameOrientation) : StateVector {
        const sourceFrame : FrameOrientation = osvIn.frameOrientation;
        const sequence : FrameOrientation[] = <FrameOrientation[]> transMap.get(sourceFrame)?.get(targetFrame);

        let source : FrameOrientation = sourceFrame;
        let osvOut : StateVector = osvIn;

        for (let indTrans = 0; indTrans < sequence.length; indTrans++) {
            const target : FrameOrientation = sequence[indTrans];

            switch(source) {
                case FrameOrientation.B1950_ECL:
                    break;
                case FrameOrientation.B1950_EQ:
                    break;
                case FrameOrientation.J2000_ECL:
                    if (target == FrameOrientation.J2000_EQ) {
                    } 
                    break;
                case FrameOrientation.J2000_EQ:
                    if (target == FrameOrientation.J2000_ECL) {

                    } else if (target == FrameOrientation.MOD) {
                        osvOut = FrameConversions.rotateJ2000Mod(osvOut, 
                            this.eopParams.timeStampTdb.getJulian());
                    }
                    break;
                case FrameOrientation.MOD:
                    if (target == FrameOrientation.J2000_EQ) {
                        osvOut = FrameConversions.rotateModJ2000(osvOut,
                            this.eopParams.timeStampTdb.getJulian());
                    } else if (target == FrameOrientation.TOD) {
                        osvOut = FrameConversions.rotateModTod(osvOut, 
                            this.eopParams.timeStampTdb.getJulian(), this.eopParams.nutationParams);
                    }
                    break;
                case FrameOrientation.TOD:
                    if (target == FrameOrientation.MOD) {
                        osvOut = FrameConversions.rotateTodMod(osvOut, 
                            this.eopParams.nutationParams);
                    } else if (target == FrameOrientation.PEF) {
                        osvOut = FrameConversions.rotateTodPef(osvOut, this.eopParams.GAST, 
                            this.eopParams.timeStampUt1.getJulian());
                    } else if (target == FrameOrientation.TEME) {
                        // TODO.
                    }
                    break;
                case FrameOrientation.TEME:
                    if (target == FrameOrientation.TOD) {
                        // TODO.
                    }
                    break;
                case FrameOrientation.PEF:
                    if (target == FrameOrientation.TOD) {
                        osvOut = FrameConversions.rotatePefTod(osvOut, this.eopParams.GAST, 
                            this.eopParams.timeStampUt1.getJulian());
                    } else if (target == FrameOrientation.EFI) {

                    }
                    break;
                case FrameOrientation.EFI:
                    break;
                case FrameOrientation.ENU:
                    break;
                case FrameOrientation.PERI:
                    break;
            }

            source = target;
        }

        return osvOut;
    }

    /**
     * Translate OSV from the geocenter to topocentric location.
     * 
     * @param {StateVector} osvGeoEfi
     *      Target OSV in the geocentric EFI frame. 
     * @param {EarthPosition} earthPos 
     *      Topocentric Earth position translated to.
     * @returns {StateVector} Target OSV in the topocentric EFI frame.
     */
    static translateGeoTopo(osvGeoEfi : StateVector, earthPos : EarthPosition) : StateVector {
        const rEfiEarthPos = Wgs84.coordWgs84Efi(earthPos);

        return {
            frameCenter : FrameCenter.CENTER_TOPOC,
            frameOrientation : FrameOrientation.EFI,
            position : MathUtils.vecDiff(osvGeoEfi.position, rEfiEarthPos), 
            velocity : osvGeoEfi.velocity, 
            timeStamp : osvGeoEfi.timeStamp
        };
    }

    /**
     * Translate OSV from the topocentric to geocentric location.
     * 
     * @param {StateVector} osvTopoEfi
     *      Target OSV in the topocentric EFI frame. 
     * @param {EarthPosition} earthPos 
     *      Topocentric Earth position translated to.
     * @returns {StateVector} Target OSV in the geocentric EFI frame.
     */
    static translateTopoGeo(osvTopoEfi : StateVector, earthPos : EarthPosition) : StateVector {
        const rEfiEarthPos = Wgs84.coordWgs84Efi(earthPos);

        return {
            frameCenter : FrameCenter.CENTER_TOPOC,
            frameOrientation : FrameOrientation.EFI,
            position : MathUtils.vecSum(osvTopoEfi.position, rEfiEarthPos), 
            velocity : osvTopoEfi.velocity, 
            timeStamp : osvTopoEfi.timeStamp
        };
    }

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
            frameOrientation : FrameOrientation.MOD,
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
            frameOrientation : FrameOrientation.J2000_EQ,
            position : rJ2000, 
            velocity : vJ2000, 
            timeStamp : osvMod.timeStamp
        };
    }

    /**
     * Rotate OSV from Mean-of-Date (MoD) to the True-of-Date (ToD) frame.
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
            frameOrientation : FrameOrientation.TOD,
            position : rTod, 
            velocity : vTod, 
            timeStamp : osv.timeStamp
        };
    }

    /**
     * Rotate OSV from True-of-Date (ToD) to the Mean-of-Date (MoD) frame.
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
            frameOrientation : FrameOrientation.MOD,
            position : rMod, 
            velocity : vMod, 
            timeStamp : osv.timeStamp
        };
    }


    /**
     * Rotate OSV from True-of-Date (ToD) to the Pseudo-Earth-Fixed (PEF)
     * frame.
     * 
     * @param {OsvFrame} osv
     *      OSV in ToD frame.
     * @param {number} GAST 
     *      Greewich Apparent Sidereal Time (GAST) (in degrees).
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

        return {
            frameCenter : osv.frameCenter,
            frameOrientation : FrameOrientation.PEF,
            position : rPef, 
            velocity : vPef, 
            timeStamp : osv.timeStamp
        };
    }

    /**
     * Rotate OSV from Pseudo-Earth-Fixed (PEF) to the True-of-Date (ToD)
     * frame.
     * 
     * @param {OsvFrame} osv
     *      OSV in PEF frame.
     * @param {number} GAST 
     *      Greewich Apparent Sidereal Time (GAST) (in degrees).
     * @returns {OsvFrame} OSV in ToD frame.
     */
    static rotatePefTod(osv : StateVector, GAST : number, jtUt1 : number) : StateVector
    {
        const rTod = Rotations.rotateCart3d(osv.position, -GAST);

        // Alternative expression for the GMST is \sum_{i=0}^3 k_i MJD^i.
        const k1 = 360.985647366;
        const k2 = 2.90788e-13;
        const k3 = -5.3016e-22;
        const MJD = jtUt1 - 2451544.5;
        
        // Compute time-derivative of the GAST to convert velocities:     
        const dGASTdt = (1/86400.0) * (k1 + 2*k2*MJD + 3*k3*MJD*MJD);

        let dRdt_rTod = [0, 0, 0];
        dRdt_rTod[0] = dGASTdt * (Math.PI/180.0) 
                     * (-MathUtils.sind(GAST) * rTod[0] + MathUtils.cosd(GAST) * rTod[1]); 
        dRdt_rTod[1] = dGASTdt * (Math.PI/180.0) 
                     * (-MathUtils.cosd(GAST) * rTod[0] - MathUtils.sind(GAST) * rTod[1]); 

        const vTod = Rotations.rotateCart3d([osv.velocity[0] - dRdt_rTod[0], 
                                osv.velocity[1] - dRdt_rTod[1], 
                                osv.velocity[2]], -GAST);
        return {
            frameCenter : osv.frameCenter,
            frameOrientation : FrameOrientation.TOD,
            position : rTod, 
            velocity : vTod, 
            timeStamp : osv.timeStamp
        };
    }

    /**
     * Rotate OSV from PEF to the Earth-Fixed (EFI) frame.
     * 
     * @param {StateVector} osv 
     *      OSV in PEF frame.
     * @param {number} dx 
     *      Polar motion parameter (in degrees).
     * @param {number} dy 
     *      Polar motion parameter (in degrees).
     * @returns {StateVector} OSV in EFI frame.
     */
    static coordPefEfi(osv : StateVector, dx : number, dy : number) : StateVector {
        const rEfi = Rotations.rotateCart2d(Rotations.rotateCart1d(
            osv.position, -dy), -dx);
        const vEfi = Rotations.rotateCart2d(Rotations.rotateCart1d(
            osv.velocity, -dy), -dx);

        return {
            frameCenter : osv.frameCenter,
            frameOrientation : FrameOrientation.EFI,
            position : rEfi, 
            velocity : vEfi, 
            timeStamp : osv.timeStamp
        };
    }

    /**
     * Rotate OSV from the Earth-Fixed (EFI) to the PEF frame.
     * 
     * @param {StateVector} osv 
     *      OSV in PEF frame.
     * @param {number} dx 
     *      Polar motion parameter (in degrees).
     * @param {number} dy 
     *      Polar motion parameter (in degrees).
     * @returns {StateVector} OSV in PEF frame.
     */
    static coordEfiPef(osv : StateVector, dx : number, dy : number) : StateVector {
        const rPef = Rotations.rotateCart1d(Rotations.rotateCart2d(
            osv.position, dx), dy);
        const vPef = Rotations.rotateCart1d(Rotations.rotateCart2d(
            osv.velocity, dx), dy);

        return {
            frameCenter : osv.frameCenter,
            frameOrientation : FrameOrientation.PEF,
            position : rPef, 
            velocity : vPef, 
            timeStamp : osv.timeStamp
        };
    }
};