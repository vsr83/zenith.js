import de422Data from '../../data/de422.json';
import { IntegrationState } from './Integration';

/**
 * Class for accessing the JPL data for initial conditions.
 */
export class JPLData {
    /**
     * Get the timestamps of the initial conditions.
     * 
     * @returns {number[]} Julian time (TDB) for each timestamp.
     */
    static getTdbTimestamps() : number[] {
        return de422Data.JD_list;
    }

    /**
     * Get initial condition for integration from the JPL data.
     * 
     * @param {number} index
     *      The index of the initial condition.
     * @returns {IntegrationState} The initial condition.
     */
    static getState(index : number) : IntegrationState {
        return {
            JTepoch : de422Data.JD_list[index],
            deltaT  : 0.0,
            pointMasses : de422Data.objects_list[index].point_masses,
            libration : de422Data.objects_list[index].libration
        };
    }

    /**
     * Find the index of the closest initial condition.
     * 
     * @param {number} JD 
     *      The Julian date.
     * @returns {number} The index. -1 if the list is empty.
     */
    static findClosest(JD: number) : number {
        const JDlist = de422Data.JD_list;

        let indMin = -1;
        let diffMin = Number.MAX_VALUE;

        for (let ind = 0; ind < JDlist.length; ind++) {
            const diff = Math.abs(JD - JDlist[ind]);

            if (diff < diffMin) {
                indMin = ind;
                diffMin = diff;
            }
        }
        return indMin;
    }

    /**
     * Get timestamp of the last initial condition.
     * 
     * @returns {number} The Julian time of the last initial condition.
     */
    static getLastJD() : number {
        return de422Data.JD_list[de422Data.JD_list.length - 1];
    }

    /**
     * Get timestamp of the first initial condition.
     * 
     * @returns {number} The Julian time of the first initial condition.
     */
    static getFirstJD() : number {
        return de422Data.JD_list[0];
    }
}