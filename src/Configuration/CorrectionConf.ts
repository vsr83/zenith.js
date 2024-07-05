/**
 * Refraction model.
 */
export enum RefractionModel {
    NO_CORRECTION = "NO_CORRECTION",
    SAMUELSSON    = "SAMUELSSON"
}

/**
 * Correction type.
 */
export enum CorrectionType {
    REFRACTION         = "REFRACTION",
    LIGHT_TIME         = "LIGHT_TIME",
    PROPER_MOTION      = "PROPER_MOTION",
    STELLAR_ABERRATION = "STELLAR_ABERRATION",
    DIURNAL_ABBERATION = "DIURNAL_ABERRATION",
    STELLAR_PARALLAX   = "STELLAR_PARALLAX"
}

/**
 * Refraction parameters.
 */
export interface RefractionParams {
    // Refraction model.
    refractionModel : RefractionModel;
    // Parameters for Samuelsson model.
    samuelssonTemperature? : number; 
    samuelssonPressure? : number;
}

/**
 * Overall correction parameters.
 */
export interface CorrectionInfo {
    // List of corrections to be applied
    corrections : CorrectionType[];

    // Refraction parameters.
    refractionParams : RefractionParams;
}