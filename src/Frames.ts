import corrData from '../data/time_correlation_data.json';
import { StateVector } from './StateVector';
import { Rotations } from './Rotations';
import { Nutation, NutationData } from './Nutation';
import { MathUtils } from './MathUtils';
import { EarthPosition, Wgs84 } from './Wgs84';
import { TimeStamp } from './TimeStamp';
import { TimeConvention } from './TimeCorrelation';
import { EopParams, SolarParams } from './EopParams';

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
    HELIOCENTER = 'HELIO',
    // Solar System Barycenter.
    SSB = 'SSB', 
    // Geocenter.
    BODY_CENTER = 'BODY_CENTER',
    // Earth-Moon Barycenter.
    PLANET_BARY = 'EMB',
    // Topocentric.
    PLANET_TOPO = 'TOPOC'
}

const transMap : Map<FrameCenter, Map<FrameCenter, FrameCenter[]>> = 
             new Map<FrameCenter, Map<FrameCenter, FrameCenter[]>>();
const mainTransSeq : FrameCenter[] = [
    FrameCenter.SSB,
    FrameCenter.HELIOCENTER,
    FrameCenter.PLANET_BARY,
    FrameCenter.BODY_CENTER,
    FrameCenter.PLANET_TOPO
];

const transSsb   : Map<FrameCenter, FrameCenter[]> = new Map<FrameCenter, FrameCenter[]>();
transMap.set(FrameCenter.SSB, transSsb);
transSsb.set(FrameCenter.SSB,   mainTransSeq.slice(1, 1));
transSsb.set(FrameCenter.HELIOCENTER, mainTransSeq.slice(1, 2));
transSsb.set(FrameCenter.PLANET_BARY,   mainTransSeq.slice(1, 3));
transSsb.set(FrameCenter.BODY_CENTER,   mainTransSeq.slice(1, 4));
transSsb.set(FrameCenter.PLANET_TOPO, mainTransSeq.slice(1, 5));

const transHelio : Map<FrameCenter, FrameCenter[]> = new Map<FrameCenter, FrameCenter[]>();
transMap.set(FrameCenter.HELIOCENTER, transHelio);
transHelio.set(FrameCenter.SSB,   mainTransSeq.slice(0, 1).reverse());
transHelio.set(FrameCenter.HELIOCENTER, []);
transHelio.set(FrameCenter.PLANET_BARY, mainTransSeq.slice(2, 3));
transHelio.set(FrameCenter.BODY_CENTER, mainTransSeq.slice(2, 4));
transHelio.set(FrameCenter.PLANET_TOPO, mainTransSeq.slice(2, 5));

const transEmb   : Map<FrameCenter, FrameCenter[]> = new Map<FrameCenter, FrameCenter[]>();
transMap.set(FrameCenter.PLANET_BARY, transEmb);
transEmb.set(FrameCenter.SSB,   mainTransSeq.slice(0, 2).reverse());
transEmb.set(FrameCenter.HELIOCENTER, mainTransSeq.slice(1, 2).reverse());
transEmb.set(FrameCenter.PLANET_BARY,   []);
transEmb.set(FrameCenter.BODY_CENTER,   mainTransSeq.slice(3, 4));
transEmb.set(FrameCenter.PLANET_TOPO, mainTransSeq.slice(3, 5));

const transGeo   : Map<FrameCenter, FrameCenter[]> = new Map<FrameCenter, FrameCenter[]>();
transMap.set(FrameCenter.BODY_CENTER, transGeo);
transGeo.set(FrameCenter.SSB,   mainTransSeq.slice(0, 3).reverse());
transGeo.set(FrameCenter.HELIOCENTER, mainTransSeq.slice(1, 3).reverse());
transGeo.set(FrameCenter.PLANET_BARY,   mainTransSeq.slice(2, 3).reverse());
transGeo.set(FrameCenter.BODY_CENTER,   []);
transGeo.set(FrameCenter.PLANET_TOPO, mainTransSeq.slice(4, 5));

const transTopo  : Map<FrameCenter, FrameCenter[]> = new Map<FrameCenter, FrameCenter[]>();
transMap.set(FrameCenter.PLANET_TOPO, transTopo);
transTopo.set(FrameCenter.SSB,   mainTransSeq.slice(0, 4).reverse());
transTopo.set(FrameCenter.HELIOCENTER, mainTransSeq.slice(1, 4).reverse());
transTopo.set(FrameCenter.PLANET_BARY,   mainTransSeq.slice(2, 4).reverse());
transTopo.set(FrameCenter.BODY_CENTER,   mainTransSeq.slice(3, 4).reverse());
transTopo.set(FrameCenter.PLANET_TOPO, []);

//console.log(transMap);

/**
 * Map associating time stamp to different conventions.
 */
const rotateMap : Map<FrameOrientation, Map<FrameOrientation, FrameOrientation[]>> = 
              new Map<FrameOrientation, Map<FrameOrientation, FrameOrientation[]>>();

const mainRotSeq : FrameOrientation[] = [
    FrameOrientation.J2000_ECL,
    FrameOrientation.J2000_EQ,
    FrameOrientation.MOD,
    FrameOrientation.TOD,
    FrameOrientation.PEF,
    FrameOrientation.EFI,
    FrameOrientation.ENU
];


const rotJ2000Ecl : Map<FrameOrientation, FrameOrientation[]> = new Map<FrameOrientation, FrameOrientation[]>();
rotateMap.set(FrameOrientation.J2000_ECL, rotJ2000Ecl);
rotJ2000Ecl.set(FrameOrientation.J2000_ECL, []);
rotJ2000Ecl.set(FrameOrientation.J2000_EQ,  mainRotSeq.slice(1, 2));
rotJ2000Ecl.set(FrameOrientation.MOD,       mainRotSeq.slice(1, 3));
rotJ2000Ecl.set(FrameOrientation.TOD,       mainRotSeq.slice(1, 4));
rotJ2000Ecl.set(FrameOrientation.PEF,       mainRotSeq.slice(1, 5));
rotJ2000Ecl.set(FrameOrientation.EFI,       mainRotSeq.slice(1, 6));
rotJ2000Ecl.set(FrameOrientation.ENU,       mainRotSeq.slice(1, 7));
rotJ2000Ecl.set(FrameOrientation.TEME,      mainRotSeq.slice(1, 4).concat([FrameOrientation.TEME]));


const rotJ2000 : Map<FrameOrientation, FrameOrientation[]> = new Map<FrameOrientation, FrameOrientation[]>();
rotateMap.set(FrameOrientation.J2000_EQ, rotJ2000);
rotJ2000.set(FrameOrientation.J2000_ECL, mainRotSeq.slice(0, 1));
rotJ2000.set(FrameOrientation.J2000_EQ,  []);
rotJ2000.set(FrameOrientation.MOD,       mainRotSeq.slice(2, 3));
rotJ2000.set(FrameOrientation.TOD,       mainRotSeq.slice(2, 4));
rotJ2000.set(FrameOrientation.PEF,       mainRotSeq.slice(2, 5));
rotJ2000.set(FrameOrientation.EFI,       mainRotSeq.slice(2, 6));
rotJ2000.set(FrameOrientation.ENU,       mainRotSeq.slice(2, 7));
rotJ2000.set(FrameOrientation.TEME,      mainRotSeq.slice(2, 4).concat([FrameOrientation.TEME]));

const rotMoD : Map<FrameOrientation, FrameOrientation[]> = new Map<FrameOrientation, FrameOrientation[]>();
rotateMap.set(FrameOrientation.MOD, rotMoD);
rotMoD.set(FrameOrientation.J2000_ECL, mainRotSeq.slice(0, 2).reverse());
rotMoD.set(FrameOrientation.J2000_EQ,  mainRotSeq.slice(1, 2).reverse());
rotMoD.set(FrameOrientation.MOD,       []);
rotMoD.set(FrameOrientation.TOD,       mainRotSeq.slice(3, 4));
rotMoD.set(FrameOrientation.PEF,       mainRotSeq.slice(3, 5));
rotMoD.set(FrameOrientation.EFI,       mainRotSeq.slice(3, 6));
rotMoD.set(FrameOrientation.ENU,       mainRotSeq.slice(3, 7));
rotMoD.set(FrameOrientation.TEME,      mainRotSeq.slice(3, 4).concat([FrameOrientation.TEME]));

const rotToD : Map<FrameOrientation, FrameOrientation[]> = new Map<FrameOrientation, FrameOrientation[]>();
rotateMap.set(FrameOrientation.TOD, rotToD);
rotToD.set(FrameOrientation.J2000_ECL, mainRotSeq.slice(0, 3).reverse());
rotToD.set(FrameOrientation.J2000_EQ,  mainRotSeq.slice(1, 3).reverse());
rotToD.set(FrameOrientation.MOD,       mainRotSeq.slice(2, 3).reverse());
rotToD.set(FrameOrientation.TOD,       []);
rotToD.set(FrameOrientation.PEF,       mainRotSeq.slice(4, 5));
rotToD.set(FrameOrientation.EFI,       mainRotSeq.slice(4, 6));
rotToD.set(FrameOrientation.ENU,       mainRotSeq.slice(4, 7));
rotToD.set(FrameOrientation.TEME,      [FrameOrientation.TEME]);

const rotTeme : Map<FrameOrientation, FrameOrientation[]> = new Map<FrameOrientation, FrameOrientation[]>();
rotateMap.set(FrameOrientation.TEME, rotTeme);
rotTeme.set(FrameOrientation.J2000_ECL, [FrameOrientation.TOD].concat(mainRotSeq.slice(0, 3).reverse()));
rotTeme.set(FrameOrientation.J2000_EQ,  [FrameOrientation.TOD].concat(mainRotSeq.slice(1, 3).reverse()));
rotTeme.set(FrameOrientation.MOD,       [FrameOrientation.TOD].concat(mainRotSeq.slice(2, 3).reverse()));
rotTeme.set(FrameOrientation.TOD,       [FrameOrientation.TOD]);
rotTeme.set(FrameOrientation.PEF,       [FrameOrientation.TOD].concat(mainRotSeq.slice(4, 5)));
rotTeme.set(FrameOrientation.EFI,       [FrameOrientation.TOD].concat(mainRotSeq.slice(4, 6)));
rotTeme.set(FrameOrientation.ENU,       [FrameOrientation.TOD].concat(mainRotSeq.slice(4, 7)));
rotTeme.set(FrameOrientation.TEME,      []);

const rotPef : Map<FrameOrientation, FrameOrientation[]> = new Map<FrameOrientation, FrameOrientation[]>();
rotateMap.set(FrameOrientation.PEF, rotPef);
rotPef.set(FrameOrientation.J2000_ECL, mainRotSeq.slice(0, 4).reverse());
rotPef.set(FrameOrientation.J2000_EQ,  mainRotSeq.slice(1, 4).reverse());
rotPef.set(FrameOrientation.MOD,       mainRotSeq.slice(2, 4).reverse());
rotPef.set(FrameOrientation.TOD,       mainRotSeq.slice(3, 4).reverse());
rotPef.set(FrameOrientation.PEF,       []);
rotPef.set(FrameOrientation.EFI,       mainRotSeq.slice(5, 6));
rotPef.set(FrameOrientation.ENU,       mainRotSeq.slice(5, 7));
rotPef.set(FrameOrientation.TEME,      mainRotSeq.slice(3, 4).reverse().concat([FrameOrientation.TEME]));

const rotEfi : Map<FrameOrientation, FrameOrientation[]> = new Map<FrameOrientation, FrameOrientation[]>();
rotateMap.set(FrameOrientation.EFI, rotEfi);
rotEfi.set(FrameOrientation.J2000_ECL, mainRotSeq.slice(0, 5).reverse());
rotEfi.set(FrameOrientation.J2000_EQ,  mainRotSeq.slice(1, 5).reverse());
rotEfi.set(FrameOrientation.MOD,       mainRotSeq.slice(2, 5).reverse());
rotEfi.set(FrameOrientation.TOD,       mainRotSeq.slice(3, 5).reverse());
rotEfi.set(FrameOrientation.PEF,       mainRotSeq.slice(4, 5).reverse());
rotEfi.set(FrameOrientation.EFI,       []);
rotEfi.set(FrameOrientation.ENU,       mainRotSeq.slice(6, 7));
rotEfi.set(FrameOrientation.TEME,      mainRotSeq.slice(3, 5).reverse().concat([FrameOrientation.TEME]));

const rotEnu : Map<FrameOrientation, FrameOrientation[]> = new Map<FrameOrientation, FrameOrientation[]>();
rotateMap.set(FrameOrientation.ENU, rotEnu);
rotEnu.set(FrameOrientation.J2000_ECL, mainRotSeq.slice(0, 6).reverse());
rotEnu.set(FrameOrientation.J2000_EQ,  mainRotSeq.slice(1, 6).reverse());
rotEnu.set(FrameOrientation.MOD,       mainRotSeq.slice(2, 6).reverse());
rotEnu.set(FrameOrientation.TOD,       mainRotSeq.slice(3, 6).reverse());
rotEnu.set(FrameOrientation.PEF,       mainRotSeq.slice(4, 6).reverse());
rotEnu.set(FrameOrientation.EFI,       mainRotSeq.slice(5, 6).reverse());
rotEnu.set(FrameOrientation.ENU,       []);
rotEnu.set(FrameOrientation.TEME,      mainRotSeq.slice(3, 6).reverse().concat([FrameOrientation.TEME]));

/**
 * Class implementing conversion between frames via translations and rotations.
 */
export class FrameConversions {
    // Earth Orientation Parameters.
    private eopParams : EopParams;

    // Solar System parameters.
    private solarParams : SolarParams;

    // Observer position for topocentric frames.
    private observerPosition : EarthPosition | null;

    /**
     * Public constructor.
     * 
     * @param {EopParams} eopParams 
     *      Earth orientation parameters used for transformations.
     * @param {EarthPosition | null} observerPosition 
     *      Observer position.
     * @param {SolarParams} solarParams 
     *      Solar system parameters.
     * 
     */
    public constructor(eopParams : EopParams, observerPosition : EarthPosition | null,
        solarParams : SolarParams) {
        this.eopParams = eopParams;
        this.observerPosition = observerPosition;
        this.solarParams = solarParams;
    }

    /**
     * Set observer position.
     * 
     * @param {EarthPosition} observerPosition 
     *      Observer position.
     */
    public setObserverPosition(observerPosition : EarthPosition) {
        this.observerPosition = observerPosition;
    }

    /**
     * Translate state vector to a center.
     * 
     * @param {StateVector} osvIn 
     *      Input state vector.
     * @param {FrameCenter} targetCenter 
     *      Target center.
     */
    public translateTo(osvIn : StateVector, targetCenter : FrameCenter) : StateVector {
        let sourceCenter : FrameCenter = osvIn.frameCenter;
        const sequence : FrameCenter[] = <FrameCenter[]> transMap.get(sourceCenter)?.get(targetCenter);
        let osvOut : StateVector = osvIn;

        for (let indTrans = 0; indTrans < sequence.length; indTrans++) {
            const target : FrameCenter = sequence[indTrans];

            const sourceOrientation : FrameOrientation = osvOut.frameOrientation;

            switch(sourceCenter) {
                case FrameCenter.SSB:
                    if (target == FrameCenter.HELIOCENTER) {
                        osvOut = this.rotateTo(osvOut, FrameOrientation.J2000_EQ);
                        osvOut = FrameConversions.translateSsbHel(osvOut, this.solarParams);
                        osvOut = this.rotateTo(osvOut, sourceOrientation);
                    }
                    break;
                case FrameCenter.HELIOCENTER:
                    if (target == FrameCenter.SSB) {
                        osvOut = this.rotateTo(osvOut, FrameOrientation.J2000_EQ);
                        osvOut = FrameConversions.translateHelSsb(osvOut, this.solarParams);
                        osvOut = this.rotateTo(osvOut, sourceOrientation);                        
                    } else if (target == FrameCenter.PLANET_BARY) {
                        osvOut = this.rotateTo(osvOut, FrameOrientation.J2000_EQ);
                        osvOut = FrameConversions.translateHelBary(osvOut, this.solarParams);
                        osvOut = this.rotateTo(osvOut, sourceOrientation);                        
                    }
                    break;
                case FrameCenter.PLANET_BARY:
                    if (target == FrameCenter.HELIOCENTER) {
                        osvOut = this.rotateTo(osvOut, FrameOrientation.J2000_EQ);
                        osvOut = FrameConversions.translateBaryHel(osvOut, this.solarParams);
                        osvOut = this.rotateTo(osvOut, sourceOrientation);
                    } else if (target == FrameCenter.BODY_CENTER) {
                        osvOut = this.rotateTo(osvOut, FrameOrientation.J2000_EQ);
                        osvOut = FrameConversions.translateBaryGeo(osvOut, this.solarParams);
                        osvOut = this.rotateTo(osvOut, sourceOrientation);                        
                    }
                    break;
                case FrameCenter.BODY_CENTER:
                    if (target == FrameCenter.PLANET_BARY) {
                        osvOut = this.rotateTo(osvOut, FrameOrientation.J2000_EQ);
                        osvOut = FrameConversions.translateGeoBary(osvOut, this.solarParams);
                        osvOut = this.rotateTo(osvOut, sourceOrientation);                                                
                    } else if (target == FrameCenter.PLANET_TOPO) {
                        osvOut = this.rotateTo(osvOut, FrameOrientation.EFI);
                        osvOut = FrameConversions.translateGeoTopoEfi(osvOut, <EarthPosition> this.observerPosition);
                        osvOut = this.rotateTo(osvOut, sourceOrientation);
                    }
                    break;
                case FrameCenter.PLANET_TOPO:
                    if (target == FrameCenter.BODY_CENTER) {
                        osvOut = this.rotateTo(osvOut, FrameOrientation.EFI);
                        osvOut = FrameConversions.translateTopoGeoEfi(osvOut, <EarthPosition> this.observerPosition);
                        osvOut = this.rotateTo(osvOut, sourceOrientation);                        
                    } 
                    break;
            }
            sourceCenter = target;
        }
        return osvOut;
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
        const sequence : FrameOrientation[] = <FrameOrientation[]> rotateMap.get(sourceFrame)?.get(targetFrame);

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
                        osvOut = FrameConversions.rotateEclEq(osvOut);
                    } 
                    break;
                case FrameOrientation.J2000_EQ:
                    if (target == FrameOrientation.J2000_ECL) {
                        osvOut = FrameConversions.rotateEqEcl(osvOut);
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
                        osvOut = FrameConversions.rotateModTod(osvOut, this.eopParams.nutationParams);
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
                        osvOut = FrameConversions.rotateTodTeme(osvOut, this.eopParams.nutationParams);
                    }
                    break;
                case FrameOrientation.TEME:
                    if (target == FrameOrientation.TOD) {
                        osvOut = FrameConversions.rotateTemeTod(osvOut, this.eopParams.nutationParams);
                    }
                    break;
                case FrameOrientation.PEF:
                    if (target == FrameOrientation.TOD) {
                        osvOut = FrameConversions.rotatePefTod(osvOut, this.eopParams.GAST, 
                            this.eopParams.timeStampUt1.getJulian());
                    } else if (target == FrameOrientation.EFI) {
                        osvOut = FrameConversions.rotatePefEfi(osvOut, this.eopParams.polarDx,
                            this.eopParams.polarDy);
                    }
                    break;
                case FrameOrientation.EFI:
                    if (target == FrameOrientation.ENU) {
                        osvOut = FrameConversions.rotateEfiEnu(osvOut, <EarthPosition> this.observerPosition);
                    } else if (target == FrameOrientation.PEF) {
                        osvOut = FrameConversions.rotateEfiPef(osvOut, this.eopParams.polarDx,
                            this.eopParams.polarDy);
                    }
                    break;
                case FrameOrientation.ENU:
                    if (target == FrameOrientation.EFI) {
                        osvOut = FrameConversions.rotateEnuEfi(osvOut, <EarthPosition> this.observerPosition);
                    }
                    break;
                case FrameOrientation.PERI:
                    break;
            }
            source = target;
        }

        return osvOut;
    }

    /**
     * Create double map of state vectors for each pair of frame center and
     * frame orientation.
     * 
     * @param {StateVector} osv
     *      Input OSV. 
     * @returns {Map<FrameCenter, Map<FrameOrientation, StateVector>>} Map of
     *      state vectors.
     */
    public getAll(osv : StateVector) : Map<FrameCenter, Map<FrameOrientation, StateVector>> {
        const stateMap : Map<FrameCenter, Map<FrameOrientation, StateVector>> = 
        new Map<FrameCenter, Map<FrameOrientation, StateVector>>();
        
        for (let indTrans = 0; indTrans < mainTransSeq.length; indTrans++) {
            const target : FrameCenter = mainTransSeq[indTrans];

            const osvNew = this.translateTo(osv, target);
            stateMap.set(target, this.rotateAll(osvNew));
        }

        return stateMap;
    }

    /**
     * Rotate state vector to all target frames.
     * 
     * @param {StateVector} osv
     *     Input state. 
     * @returns {Map<FrameOrientation, StateVector>} State vector for each frame.
     */
    private rotateAll(osv : StateVector) : Map<FrameOrientation, StateVector> {
        const stateMap : Map<FrameOrientation, StateVector> = new Map<FrameOrientation, StateVector>();

        for (let indRot = 0; indRot < mainRotSeq.length; indRot++) {
            const target : FrameOrientation = mainRotSeq[indRot];
            if (target != FrameOrientation.ENU || this.observerPosition != null) {
                stateMap.set(target, this.rotateTo(osv, target));
            }
        }

        return stateMap;
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
    static translateGeoTopoEfi(osvGeoEfi : StateVector, earthPos : EarthPosition) : StateVector {
        const rEfiEarthPos = Wgs84.coordWgs84Efi(earthPos);

        return {
            frameCenter : FrameCenter.PLANET_TOPO,
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
    static translateTopoGeoEfi(osvTopoEfi : StateVector, earthPos : EarthPosition) : StateVector {
        const rEfiEarthPos = Wgs84.coordWgs84Efi(earthPos);

        return {
            frameCenter : FrameCenter.BODY_CENTER,
            frameOrientation : FrameOrientation.EFI,
            position : MathUtils.vecSum(osvTopoEfi.position, rEfiEarthPos), 
            velocity : osvTopoEfi.velocity, 
            timeStamp : osvTopoEfi.timeStamp
        };
    }

    /**
     * Translate OSV from the SSB to heliocentric location.
     * 
     * @param {StateVector} osvSsbJ2000Eq
     *      Target OSV in the SSB J2000 equatorial frame. 
     * @param {SolarParams} solarParams 
     *      Solar system parameters.
     * @returns {StateVector} Target OSV in the heliocentric J2000 equatorial frame.
     */
    static translateSsbHel(osvSsbJ2000Eq : StateVector, solarParams : SolarParams) : StateVector {
        return {
            frameCenter : FrameCenter.HELIOCENTER,
            frameOrientation : FrameOrientation.J2000_EQ,
            position : MathUtils.vecSum(osvSsbJ2000Eq.position, solarParams.ssbState.position), 
            velocity : MathUtils.vecSum(osvSsbJ2000Eq.velocity, solarParams.ssbState.velocity), 
            timeStamp : osvSsbJ2000Eq.timeStamp
        };
    }

    /**
     * Translate OSV from the heliocentric to the SSB location.
     * 
     * @param {StateVector} osvHelJ2000Eq
     *      Target OSV in the heliocentric J2000 equatorial frame. 
     * @param {SolarParams} solarParams 
     *      Solar system parameters.
     * @returns {StateVector} Target OSV in the SSB J2000 equatorial frame.
     */
    static translateHelSsb(osvSsbJ2000Eq : StateVector, solarParams : SolarParams) : StateVector {
        return {
            frameCenter : FrameCenter.SSB,
            frameOrientation : FrameOrientation.J2000_EQ,
            position : MathUtils.vecDiff(osvSsbJ2000Eq.position, solarParams.ssbState.position), 
            velocity : MathUtils.vecDiff(osvSsbJ2000Eq.velocity, solarParams.ssbState.velocity), 
            timeStamp : osvSsbJ2000Eq.timeStamp
        };
    }

    /**
     * Translate OSV from the barycentric to heliocentric location.
     * 
     * @param {StateVector} osvBaryJ2000Eq
     *      Target OSV in the SSB J2000 equatorial frame. 
     * @param {SolarParams} solarParams 
     *      Solar system parameters.
     * @returns {StateVector} Target OSV in the heliocentric J2000 equatorial frame.
     */
    static translateBaryHel(osvBaryJ2000Eq : StateVector, solarParams : SolarParams) : StateVector {
        return {
            frameCenter : FrameCenter.HELIOCENTER,
            frameOrientation : FrameOrientation.J2000_EQ,
            position : MathUtils.vecSum(osvBaryJ2000Eq.position, solarParams.embState.position), 
            velocity : MathUtils.vecSum(osvBaryJ2000Eq.velocity, solarParams.embState.velocity), 
            timeStamp : osvBaryJ2000Eq.timeStamp
        };
    }

    /**
     * Translate OSV from the heliocentric to the barycentric location.
     * 
     * @param {StateVector} osvHelJ2000Eq
     *      Target OSV in the heliocentric J2000 equatorial frame. 
     * @param {SolarParams} solarParams 
     *      Solar system parameters.
     * @returns {StateVector} Target OSV in the barycentric J2000 equatorial frame.
     */
    static translateHelBary(osvHelJ2000Eq : StateVector, solarParams : SolarParams) : StateVector {
        return {
            frameCenter : FrameCenter.PLANET_BARY,
            frameOrientation : FrameOrientation.J2000_EQ,
            position : MathUtils.vecDiff(osvHelJ2000Eq.position, solarParams.embState.position), 
            velocity : MathUtils.vecDiff(osvHelJ2000Eq.velocity, solarParams.embState.velocity), 
            timeStamp : osvHelJ2000Eq.timeStamp
        };
    }

    /**
     * Translate OSV from the barycentric to geocentric location.
     * 
     * @param {StateVector} osvBaryJ2000Eq
     *      Target OSV in the SSB J2000 equatorial frame. 
     * @param {SolarParams} solarParams 
     *      Solar system parameters.
     * @returns {StateVector} Target OSV in the geocentric J2000 equatorial frame.
     */
    static translateBaryGeo(osvBaryJ2000Eq : StateVector, solarParams : SolarParams) : StateVector {
        return {
            frameCenter : FrameCenter.BODY_CENTER,
            frameOrientation : FrameOrientation.J2000_EQ,
            position : MathUtils.vecDiff(
                MathUtils.vecSum(osvBaryJ2000Eq.position, solarParams.embState.position),
                solarParams.geoState.position), 
            velocity : MathUtils.vecDiff(
                MathUtils.vecSum(osvBaryJ2000Eq.velocity, solarParams.embState.velocity),
                solarParams.geoState.velocity),
            timeStamp : osvBaryJ2000Eq.timeStamp
        };
    }

    /**
     * Translate OSV from the geocentric to the barycentric location.
     * 
     * @param {StateVector} osvGeoJ2000Eq
     *      Target OSV in the geocentric J2000 equatorial frame. 
     * @param {SolarParams} solarParams 
     *      Solar system parameters.
     * @returns {StateVector} Target OSV in the barycentric J2000 equatorial frame.
     */
    static translateGeoBary(osvGeoJ2000Eq : StateVector, solarParams : SolarParams) : StateVector {
        return {
            frameCenter : FrameCenter.PLANET_BARY,
            frameOrientation : FrameOrientation.J2000_EQ,
            position : MathUtils.vecDiff(MathUtils.vecSum(solarParams.geoState.position, osvGeoJ2000Eq.position), 
                solarParams.embState.position), 
            velocity : MathUtils.vecDiff(MathUtils.vecSum(solarParams.geoState.velocity, osvGeoJ2000Eq.velocity), 
                solarParams.embState.velocity), 
            timeStamp : osvGeoJ2000Eq.timeStamp
        };
    }


    /**
     * Rotate OSV from mean equatorial to ecliptic frame.
     * 
     * @param {StateVector} osvJ2000Eq 
     *      Target OSV in the equatorial J2000 frame.
     * @returns {StateVector} Target OSV in the J2000 ecliptic frame.
     */
    static rotateEclEq(osvJ2000Eq : StateVector) : StateVector {
        // Mean obiquity of the ecliptic at the J2000 epoch.
        // Since the obliquity is at a specific epoch, it is a constant.
        // The value is from 2010 version of the Astronomical Almanac p. B52.
        const eps = 23.439279444444445;
        const rEq = Rotations.rotateCart1d(osvJ2000Eq.position, -eps);

        // The change in eps is less than arcminute in century. Thus, the influence to the
        // velocity of objects in the solar system is small.
        const vEq = Rotations.rotateCart1d(osvJ2000Eq.velocity, -eps);

        return {
            frameCenter : osvJ2000Eq.frameCenter,
            frameOrientation : FrameOrientation.J2000_EQ,
            position : rEq, 
            velocity : vEq, 
            timeStamp : osvJ2000Eq.timeStamp
        };
    }

    /**
     * Rotate OSV from mean equatorial to ecliptic frame.
     * 
     * @param {StateVector} osvJ2000Ecl
     *      Target OSV in the ecliptic J2000 frame.
     * @returns {StateVector} Target OSV in the J2000 equatorial frame.
     */
    static rotateEqEcl(osvJ2000Ecl : StateVector) : StateVector {
        // Mean obiquity of the ecliptic at the J2000 epoch.
        // Since the obliquity is at a specific epoch, it is a constant.
        // The value is from 2010 version of the Astronomical Almanac p. B52.
        const eps = 23.439279444444445;
        const rEq = Rotations.rotateCart1d(osvJ2000Ecl.position, eps);
        // The change in eps is less than arcminute in century. Thus, the influence to the
        // velocity of objects in the solar system is small.
        const vEq = Rotations.rotateCart1d(osvJ2000Ecl.velocity, eps);

        return {
            frameCenter : osvJ2000Ecl.frameCenter,
            frameOrientation : FrameOrientation.J2000_ECL,
            position : rEq, 
            velocity : vEq, 
            timeStamp : osvJ2000Ecl.timeStamp
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
    static rotateModTod(osv : StateVector, nutData : NutationData) : StateVector
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
        const vPef = Rotations.rotateCart3d(osv.velocity, GAST);

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
    static rotatePefEfi(osv : StateVector, dx : number, dy : number) : StateVector {
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
    static rotateEfiPef(osv : StateVector, dx : number, dy : number) : StateVector {
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

    /**
     * Rotate OSV from EFI to the East-North-Up (ENU) frame. Note that the coordinate
     * center is not translated.
     * 
     * @param {StateVector} osv
     *      OSV in EFI frame.
     * @param {EarthPosition} earthPos
     *      Observer position.
     * @returns {OsvFrame} OSV in ENU frame.
     */
    static rotateEfiEnu(osv : StateVector, earthPos : EarthPosition) : StateVector
    {
        const rEnu = Rotations.rotateCart1d(
                    Rotations.rotateCart3d(
                    osv.position, 90 + earthPos.lon), 
                    90 - earthPos.lat);
        const vEnu = Rotations.rotateCart1d(
                    Rotations.rotateCart3d(
                    osv.velocity, 90 + earthPos.lon), 90 - earthPos.lat);

        return {
            frameCenter : osv.frameCenter,
            frameOrientation : FrameOrientation.ENU,
            position : rEnu, 
            velocity : vEnu, 
            timeStamp : osv.timeStamp
        };
    }
   
    /**
     * Rotate OSV from the East-North-Up (ENU) to EFI frame. Note that the coordinate
     * center is not translated.
     * 
     * References:
     * [1] Vallado, Crawford, Hujsak - Revisiting Spacetrack Report #3, 
     * American Institute of Aeronautics and Astronautics, AIAA 2006-6753,  
     * 2006.
     * [2] E. Suirana, J. Zoronoza, M. Hernandez-Pajares - GNSS Data Processing -
     * Volume I: Fundamentals and Algorithms, ESA 2013.     
     *  
     * @param {StateVector} osv
     *      OSV in ENU frame.
     * @param {EarthPosition} earthPos
     *      Observer position.
     * @returns {OsvFrame} OSV in EFI frame.
     */
    static rotateEnuEfi(osv : StateVector, earthPos : EarthPosition) : StateVector
    {
        const rObs = Wgs84.coordWgs84Efi(earthPos);
        const rEfi = Rotations.rotateCart3d(
                     Rotations.rotateCart1d(osv.position, earthPos.lat - 90), 
                     -90 - earthPos.lon);
        const vEfi = Rotations.rotateCart3d(
                     Rotations.rotateCart1d(osv.velocity, earthPos.lat - 90), 
                     -90 - earthPos.lon);

        return {
            frameCenter : osv.frameCenter,
            frameOrientation : FrameOrientation.EFI,
            position : rEfi, 
            velocity : vEfi, 
            timeStamp : osv.timeStamp
        };
    }

    /**
     * Rotate OSV from True Equator, Mean Equinox (TEME) frame to the True-of-Date (ToD)
     * frame.
     * 
     * @param {StateVector} osv 
     *      OSV in TEME frame.
     * @param {NutationData} nutParams 
     *      Nutation parameters.
     * @returns {StateVector} OSV in ToD frame.
     */
    static rotateTemeTod(osv : StateVector, nutParams : NutationData) : StateVector {
        // GAST82 = Eqe82 + GMST82
        // Eqe82 = GAST82 - GMST82 = nutParams.dpsi * cosd(nutParams.eps)
        const Eqe82 = nutParams.dpsi * MathUtils.cosd(nutParams.eps); 
        const rTod = Rotations.rotateCart3d(osv.position, -Eqe82);
        const vTod = Rotations.rotateCart3d(osv.velocity, -Eqe82);

        return {
            frameCenter : osv.frameCenter,
            frameOrientation : FrameOrientation.TOD,
            position : rTod, 
            velocity : vTod, 
            timeStamp : osv.timeStamp
        };
    }

    /**
     * Rotate OSV from True-of-Date (ToD) frame to the True Equator, Mean Equinox (TEME) 
     * frame.
     * 
     * @param {StateVector} osv 
     *      OSV in ToD frame.
     * @param {NutationData} nutParams 
     *      Nutation parameters.
     * @returns {StateVector} OSV in TEME frame.
     */
    static rotateTodTeme(osv : StateVector, nutParams : NutationData) : StateVector {
        // GAST82 = Eqe82 + GMST82
        // Eqe82 = GAST82 - GMST82 = nutParams.dpsi * cosd(nutParams.eps)
        const Eqe82 = nutParams.dpsi * MathUtils.cosd(nutParams.eps); 
        const rTeme = Rotations.rotateCart3d(osv.position, Eqe82);
        const vTeme = Rotations.rotateCart3d(osv.velocity, Eqe82);

        return {
            frameCenter : osv.frameCenter,
            frameOrientation : FrameOrientation.TEME,
            position : rTeme, 
            velocity : vTeme, 
            timeStamp : osv.timeStamp
        };
    }
};