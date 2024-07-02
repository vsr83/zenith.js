/**
 * Target type.
 */
export enum TargetType {
    PLANET_JPL      = 'PLANET_JPL',
    MOON_JPL        = 'MOON_JPL',
    STAR_HIPPARCHUS = 'STAR_HIPPARCHUS',
    SATELLITE_SGP4  = 'SATELLITE_SGP4'
}

/**
 * Class representing targets.
 */
export class Target {
    // Name of the target.
    private name : string;

    // Target type.
    private type : TargetType;

    // Unique identifier.
    uuid : string;
}