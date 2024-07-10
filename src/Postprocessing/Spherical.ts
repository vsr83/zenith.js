export interface SphericalAngles {
    // Astrometric coordinates (ICRF) corrected for light-time delay and aberration.
    raIcrf : number, 
    declIcrf : number,
    // 
    raApparent : number,
    declApparent : number,
}