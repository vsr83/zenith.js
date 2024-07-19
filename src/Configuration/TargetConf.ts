import { Hipparcos } from "../Hipparcos";
import { IntegrationState } from "../SSIE/Integration";
import { JPLData } from "../SSIE/JPLData";
import { PointMassState } from "../SSIE/PointMass";

/**
 * Target type.
 */
export enum TargetType {
    SSIE            = 'SSIE',
    STAR_HIPPARCHUS = 'STAR_HIPPARCHUS',
    SATELLITE_SGP4  = 'SATELLITE_SGP4'
}

/**
 * Target metadata for post-processing.
 */
export interface TargetMetadata {
    // Diameter (m).
    diameter : number; 
    // Polar radius (m).
    polarRadius : number;
    // Equatorial radius (m).
    eqRadius : number;
}

/**
 * Class representing a reference to target computation.
 */
export interface Target {
    // Name of the target.
    name : string;

    // Target type.
    type : TargetType;

    // Unique identifier.
    uuid : string;

    // Description.
    description : string;

    // Reference string given to the specific computational tool.
    refString : string;

    // Reference number given to tht specific computational tool.
    refNumber : number;

    // Optional metadata for post-processing computations.
    metadata? : TargetMetadata;
}

export const targetList : Target[] = [];
export const targetMap : Map<string, number> = new Map<string, number>();

// Insert target to a list.
function insertTarget(target : Target) {
    targetList.push(target);
    targetMap.set(target.uuid, targetList.length - 1);
}

/**
 * Add JPL targets for the SSIE.
 */
function addJplTargets() {
    const initialState : IntegrationState = JPLData.getState(0);
    const pointMassState : PointMassState[] = initialState.pointMasses;

    const desc : string = "Target used by the Solar System Integration Engine (SSIE)";
    
    for (let indPointMass = 0; indPointMass < pointMassState.length; indPointMass++) {
        const name = pointMassState[indPointMass].name;    
    
        insertTarget({name : name, type : TargetType.SSIE, uuid : name + "_SSIE",
        description : desc, refString : name, refNumber : targetList.length - 1});
    }
}

/**
 * Add Hipparcos targets.
 */
function addHipparcosTargets() {
    const hipparcosList : string[] = Hipparcos.hipparcosFind("");
    console.log(hipparcosList);

    const desc : string = "Target imported from the Hipparcos catalogue.";

    for (let indTarget = 0; indTarget < hipparcosList.length; indTarget++) {
        const targetName : string = hipparcosList[indTarget];

        insertTarget({name : targetName, type : TargetType.STAR_HIPPARCHUS, 
            uuid : targetName + "_HIP",
            description : desc, refString : targetName, refNumber : indTarget});
    }
}

addJplTargets();
addHipparcosTargets();

targetList[<number> targetMap.get("Sun_SSIE")].metadata     = {diameter : 1.3927e9,  eqRadius : 696350000,polarRadius : 696350000};
targetList[<number> targetMap.get("Mercury_SSIE")].metadata = {diameter : 4881060,   eqRadius : 2440530,  polarRadius : 2438260};
targetList[<number> targetMap.get("Venus_SSIE")].metadata   = {diameter : 12104000,  eqRadius : 6051800,  polarRadius : 6051800};
targetList[<number> targetMap.get("Earth_SSIE")].metadata   = {diameter : 12742000,  eqRadius : 6378137,  polarRadius : 6356752};
targetList[<number> targetMap.get("Moon_SSIE")].metadata    = {diameter : 3474206,   eqRadius : 1738139,  polarRadius : 1735972};
targetList[<number> targetMap.get("Mars_SSIE")].metadata    = {diameter : 6792380,   eqRadius : 3396190,  polarRadius : 3376200};
targetList[<number> targetMap.get("Jupiter_SSIE")].metadata = {diameter : 139820000, eqRadius : 71492000, polarRadius : 66854000};
targetList[<number> targetMap.get("Saturn_SSIE")].metadata  = {diameter : 116460000, eqRadius : 60268000, polarRadius : 54364000};
targetList[<number> targetMap.get("Uranus_SSIE")].metadata  = {diameter : 50724000,  eqRadius : 25559000, polarRadius : 24973000};
targetList[<number> targetMap.get("Neptune_SSIE")].metadata = {diameter : 49244000,  eqRadius : 24764000, polarRadius : 24341000};
targetList[<number> targetMap.get("Pluto_SSIE")].metadata   = {diameter : 2376600,   eqRadius : 1188000,  polarRadius : 1188000};

console.log(targetList);
console.log(targetMap);
