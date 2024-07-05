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
}

const targetList : Target[] = [];
const targetMap : Map<string, number> = new Map<string, number>();

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
        description : desc, refString : name, refNumber : indPointMass});
    }
}

addJplTargets();
console.log(targetList);
console.log(targetMap);