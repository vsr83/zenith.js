import hipparcosData from '../data/hipparcos_reduced.json';
import {MathUtils} from './MathUtils';
import { TimeStamp } from './TimeStamp';

const hipparcosIndToName : string[] = [];
for (const [key, value] of Object.entries(hipparcosData))
{
    hipparcosIndToName[value.id] = key; 
}

/**
 * Raw position output from Hipparcos data w.r.t. the J2000 frame translated
 * to the heliocenter.
 */
export interface HipparcosOut
{
    RA : number; 
    DE : number; 
    mag : number;
}

/**
 * Interface representing a Hipparcos entry before and after proper motion 
 * adjustment.
 */
export interface HipparcosEntry
{
    id : number;
    RA : number;
    DE : number;
    Plx : number;
    RA_delta : number;
    DE_delta : number;
    mag : number;
    constellation : string;
    radVel : number | null;
}

/**
 * Class implementing static methods for the Hipparcos catalog.
 */
export class Hipparcos
{
    /**
     * Find objects from the reduced Hipparcos catalog.
     * 
     * @param {string} searchKey 
     *      Key used in matching the Hipparcos designation.
     * @returns {string[]} List of matching stars. 
     */
    static hipparcosFind(searchKey : string) : string[]
    {
        const results : string [] = [];

        Object.keys(hipparcosData).forEach(function(starName : string){
            if (starName.includes(searchKey))
            {
                results.push(starName);
            }
        });

        return results;
    }

    /**
     * Get Hipparcos position and magnitude data.
     * 
     * @param {string} designation 
     *      Designation of the object.
     * @param {number} jtTdb
     *      Julian time (TDB).
     * @param {number[] | undefined} getPos
     *      Position of the 
     * @returns {HipparcosOut} Object with fields RA, DE and mag representing the
     *      position in heliocentric J2000 frame.
     */
    static hipparcosGet(designation : string, jtTdb : number, geoPos : number[] | undefined) : HipparcosOut
    {
        // The star RA and DE coordinates are defined with respect to the J1991.25 epoch
        // and must be adjusted based on the proper motion of the star. It is unclear whether
        // the following method is correct.
        const epochJ1991_25 = 2448349.0625;
        // Julian days after the epoch.
        const deltaJT = jtTdb - epochJ1991_25;

        const hipData : {[index : string] : HipparcosEntry} = hipparcosData;
        let starData = this.properMotion(hipData[designation], jtTdb);
        if (geoPos != undefined) {
            //starData = this.annualParallax(starData, geoPos);
        }

        return {RA : starData.RA, DE : starData.DE, mag : starData.mag};
    }

    /**
     * Propagate Hipparcos data from the J1991.25 epoch. This also accounts for 
     * the proper motion of the star.
     * 
     * @param {HipparcosEntry} starDataJ1991
     *      Object representing Hipparcos data for a star with J1991.25 epoch. 
     * @param {number} JTtdb 
     *      The new epoch for star data.
     * @returns Hipparcos star data propagated into a new epoch.
     */
    static properMotion(starDataJ1991 : HipparcosEntry, JTtdb : number) : HipparcosEntry
    {
        // The implementation follows sections 1.2.8, 1.5.4 and 1.5.5 of
        // [1] The Hipparcos and Tycho Catalogues - Volume I - Introduction and Guide 
        // to the Data, ESA 1997
        // available from https://www.cosmos.esa.int/documents/532822/552851/vol1_all.pdf
        // See also:
        // https://gea.esac.esa.int/archive/documentation/GDR2/Data_processing/chap_cu3ast/sec_cu3ast_intro/ssec_cu3ast_intro_tansforms.html
        // and the reference implementation at:
        // http://cdsarc.u-strasbg.fr/ftp/cats/aliases/H/Hipparcos/version_cd/src/pos_prop.c

        // Equation 1.2.3 in [1] - Definition of the J1991.25 Epoch. The date is TT
        // but in discussion of proper motion conversion between time standards is 
        // not necessary since the movements per year are in the order of mas.
        const JDref = 2448349.0625;

        // Years after J1991.25 Epoch.
        const tau = (JTtdb - JDref) / 365.25;

        // Right-ascension
        const alpha0 = MathUtils.deg2Rad(starDataJ1991.RA);
        const delta0 = MathUtils.deg2Rad(starDataJ1991.DE);
        // Trigonometric parallax at t0 [mas -> rad].
        const par0 = MathUtils.deg2Rad(starDataJ1991.Plx / (3600.0 * 1000.0));
        // Proper motion in R.A., multiplied by cos(Dec), at t0 [mas/yr -> deg/yr].
        const pma0 = MathUtils.deg2Rad(starDataJ1991.RA_delta / (3600.0 * 1000.0));
        // Proper motion in Dec at t0 [mas/yr -> deg/yr].
        const pmd0 = MathUtils.deg2Rad(starDataJ1991.DE_delta / (3600.0 * 1000.0));
        // Normalized radial velocity at t0 [km/s -> mas/yr].
        let rad0 : number = 0;
        if (starDataJ1991.radVel != null) {
            rad0 = starDataJ1991.radVel * starDataJ1991.Plx / 4.740470446
        }
        const zeta0 = MathUtils.deg2Rad(rad0 / (3600.0 * 1000.0)); 

        // Orthogonal unit vectors (see Figure 1.2.3 in [1]):
        const p0 = [-Math.sin(alpha0), Math.cos(alpha0), 0];
        const q0 = [-Math.sin(delta0) * Math.cos(alpha0), 
                    -Math.sin(delta0) * Math.sin(alpha0), 
                    Math.cos(delta0)];
        const r0 = [Math.cos(delta0) * Math.cos(alpha0),
                    Math.cos(delta0) * Math.sin(alpha0),
                    Math.sin(delta0)];

        // Proper motion vector 
        const pmv0 = MathUtils.linComb([pma0, pmd0], [p0, q0]);
        
        // Auxiliary quantities
        const tau2 = tau*tau;
        const pm02 = pma0*pma0 + pmd0*pmd0;
        const w = 1.0 + zeta0 * tau;
        const f2 = 1.0 / (1.0 + 2.0 * zeta0 * tau + (pm02 + zeta0*zeta0) * tau2);
        const f = Math.sqrt(f2);
        const f3 = f2 * f;
        const f4 = f2 * f2;

        // The position vector at t
        const r = MathUtils.linComb([w*f, tau*f], [r0, pmv0]);
        // Trigonometric parallax at t
        let par = par0 * f;
        // Proper motion vector.
        const pmv = MathUtils.linComb([w*f3, -pm02*tau*f3], [pmv0, r0]);
        // Normalized radial velocity.
        const zeta = (zeta0 + (pm02 + zeta0*zeta0) * tau) * f2;

        const xy = Math.sqrt(r[0]*r[0] + r[1]*r[1]);
        const eps = 1.0e-9;

        // New transverse unit vectors.
        let p = [0, 1, 0];
        if (xy >= eps)
        {
            p = [-r[1]/xy, r[0]/xy, 0];
        }
        const q = MathUtils.cross(r, p);

        let alpha = Math.atan2(-p[0], p[1]);
        if (alpha < 0.0) 
        {
            alpha += 2.0 * Math.PI;
        }
        let delta = Math.atan2(r[2], xy);

        // Compute transverse components of proper motion.
        let pma = MathUtils.dot(p, pmv);
        let pmd = MathUtils.dot(q, pmv);

        // Convert to Hipparcos units:
        alpha = MathUtils.rad2Deg(alpha);
        delta = MathUtils.rad2Deg(delta);
        par = MathUtils.rad2Deg(par) * (3600.0 * 1000.0);
        pma = MathUtils.rad2Deg(pma) * (3600.0 * 1000.0);
        pmd = MathUtils.rad2Deg(pmd) * (3600.0 * 1000.0);

        const rad = MathUtils.rad2Deg(zeta) * (3600.0 * 1000.0); 
        const radVel = rad * 4.740470446 / par;

        return {
            id : starDataJ1991.id, 
            RA : alpha, 
            DE : delta, 
            Plx : par,
            RA_delta : pma,
            DE_delta : pmd, 
            mag : starDataJ1991.mag, 
            constellation : starDataJ1991.constellation,
            radVel : radVel
        };
    }

    /**
     * Apply annual parallax to the Hipparcos entry.
     * 
     * @param {HipparcosEntry} hipData 
     *      Hipparcos data.
     * @param {number[]} earthPosEqMeters 
     *      Heliocentric Earth position in meters.
     * @returns {HipparcosEntry} Updated Hipparcos entry.
     */
    static annualParallax(hipData : HipparcosEntry, earthPosEqMeters : number[]) : HipparcosEntry {
        // This computation is based on the section 7.2.2.3 of
        // Urban, Seidelmann - Explanatory Supplement to the Astronomcal Almanac
        // 3rd Edition, 2012.

        const Plx = hipData.Plx / (3600.0 * 1000.0);

        // Astronomical unit.
        const auMeters = 1.495978707e11;
        // Position in astronomical units.
        const earthPos = MathUtils.vecMul(earthPosEqMeters, 1 / auMeters);

        // (7.37): 
        const RA = hipData.RA + Plx 
                * (earthPos[0] * MathUtils.sind(hipData.RA) - earthPos[1] * MathUtils.cosd(hipData.RA))
                / MathUtils.cosd(hipData.DE);
        const DE = hipData.DE + Plx 
                * (earthPos[0] * MathUtils.cosd(hipData.RA) * MathUtils.sind(hipData.DE) 
                +  earthPos[1] * MathUtils.sind(hipData.RA) * MathUtils.sind(hipData.DE) 
                -  earthPos[2] * MathUtils.cosd(hipData.DE));

        return {
            id : hipData.id, 
            RA : RA, 
            DE : DE, 
            Plx : hipData.Plx,
            RA_delta : hipData.RA_delta,
            DE_delta : hipData.DE_delta, 
            mag : hipData.mag, 
            constellation : hipData.constellation,
            radVel : hipData.radVel
        };
    }
}