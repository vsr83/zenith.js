import corrData from '../data/time_correlation_data.json';

/**
 * Enumeration of supported frame orientations.
 */
export enum FrameOrientation {
    ORIENTATION_J2000,
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

};