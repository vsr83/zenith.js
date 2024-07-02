import { LibrationState, MoonInertia } from "../SSIE/Libration";
import { IntegrationState } from "../SSIE/Integration";
import { PointMassState } from "../SSIE/PointMass";

// Astronomical unit (km).
const au = 149597870.691;

// From DE421 obtained using the python package jplephem.
const librationInitial : LibrationState = {
    phi    : 5.128132058714363e-03,
    phi1   : 1.165507165777481e-04,
    theta  : 3.823932005230066e-01,
    theta1 : 1.461912823858170e-05,
    psi    : 1.294168056057082e+00,
    psi1   : 2.298367282420818e-01
};

// Principal moments of inertia for the Moon per unit mass (au^2).
// The moment of inertia factors C/MR^2 are dimensionless. For example, [4]
// gives C/MR^2 = 0.3905 +- 0.0023. The lunar radius in Table 4 of [4] is
// 1738 km = 1.1617812e-05 au. Thereafter, thee principal moment of inertia
// per unit mass C/M = 0.3905 * (1.1617812e-05^2) au^2 = 5.2707e-11 au^2.
const inertiaMoon : MoonInertia = {
    A : 5.2699461151199766018387453E-11,
    B : 5.2711485389894113965222358E-11,
    C : 5.2732758299330413853212309E-11,
    betaL : 6.316867734679800e-04,
    gammaL : 2.280221835939711e-04
};

/**
 * Initial state of objects at epoch.
 */
const objectsInitial : PointMassState[] = [
    {
        name : "Sun",
        mu : 2.959122082855911e-04,
        r  : [0.004502510267338, 0.000767075375770, 0.000266057691688],
        v  : [-0.035174580914658e-5, 0.517762858492630e-5, 0.222910271134566e-5]
    },
    {
        name : "Mercury",
        mu : 4.912500194824559e-11,
        r  : [0.361762718034225, -0.090781972621708, -0.085714974035992],
        v  : [0.003367493963235, 0.024894520558457, 0.012946300394857]
    },
    {
        name : "Venus",
        mu : 7.243452332680141e-10,
        r  : [0.612751942019959, -0.348365370464534, -0.195278287180387],
        v  : [0.010952068440445,  0.015617684258434,  0.006331105708522]
    },
    {
        name : "Earth",
        mu : 8.887692446750799e-10,
        r  : [0.120527235324218,  -0.925814239715091,  -0.401527016250346],
        v  : [0.016803964781901,   0.001750343790512,   0.000759242530584]
    },
    {
        name : "Moon",
        mu : 1.093189462305851e-11,
        r  : [0.119719057983365,  -0.927808869705390,  -0.402614278932212],
        v  : [0.017405049598487,   0.001582898323347,   0.000673680390844]
    },
    {
        name : "Mars",
        mu : 9.549548829827684e-11,
        r : [-0.110186075103234, -1.327599450903800, -0.605889141362437],
        v : [ 0.014481653062556,  0.000242463081796, -0.000281520722303]
    },
    {
        name : "Jupiter",
        mu : 2.825345825239843e-07,
        r  : [-5.379706767375737,  -0.830481311638832, -0.224829061010041],
        v  : [ 0.001092012658240,  -0.006518116477461, -0.002820783031830]
    },
    {
        name : "Saturn",
        mu : 8.459705993418360e-08,
        r  : [ 7.894390671857393, 4.596478065058391, 1.558695851205089],
        v  : [-0.003217556521666, 0.004335810340742, 0.001928646314749]
    },
    {
        name : "Uranus",
        mu : 1.292026564974666e-08,
        r  : [-18.265403545325100, -1.161956689138341, -0.250105437331929],
        v  : [0.000221190755635, -0.003762474772090, -0.001651014943529]
    },
    {
        name : "Neptune",
        mu : 1.524357347892686e-08,
        r  : [-16.055037505790200, -23.942192276077712, -9.400157386764722],
        v  : [0.002642770077387, -0.001498312385224, -0.000679041984533]
    },
    {
        name : "Pluto",
        mu : 2.175096464904175e-12,
        r  : [-30.483312970162260, -0.872409037876984, 8.911571443040605],
        v  : [0.000322207385086, -0.003143576124413, -0.001077949572518]
    }
];

/**
 * Initial condition for the integration.
 */
export const stateInitial : IntegrationState = {
    // Start date 1969-Jun-28 00:00:00.0000
    JTepoch : 2440400.50,
    deltaT : 0,
    pointMasses : objectsInitial,
    libration : librationInitial
};

// An object containins all constants used in the computation.
export const constants  = {
    // Astronomical unit (km)
    au : au, 
    // Speed of light (au/d).
    c : 173.144632720536344565, 
    c2 : 173.144632720536344565 ** 2,
    // Gauss' (gravitational) constant from Table 8.4 in [1].
    k : 0.01720209895,
    // Equatorial radius of the Moon (km).
    aMoon : 1738 / au,
    // Equatorial radius of the Earth (km).
    aEarth : 6378.1363 / au,
    inertiaMoon : inertiaMoon,
    // Angle between the bulge and the Earth-Moon line. 0.04635 rad in [1].
    phase : 4.0700012e-2,
    // Potential love number for the Earth [2]. In [1], the value is 0.29.
    love : 0.29,
    // Zonal harmonics J_2, J_3 and J_4 in Earth's potential.
    Je : [
        0.00108262545, 
        -0.00000253241, 
        -0.000001616
    ],
    // Zonal harmonics J_2, J_3, J_4, J_5 and J_6 in Moon's potential.
    Jm : [
        2.0321568464952570E-04, 
        8.4597026974594570E-06,
        -9.7044138365700000E-06,
        7.4221608384052890E-07,
        -1.3767531350969900E-05 
    ],
    // Tesseral harmonics in Moons potential.
    CSnm : [
        [2, 2,  2.230351309e-5,    0.0],
        [3, 1,  2.8480741195592860E-05,  5.8915551555318640E-06],
        [3, 2,  4.8449420619770600E-06,  1.6844743962783900E-06],
        [3, 3,  1.6756178134114570E-06, -2.4742714379805760E-07],
        [4, 1, -5.7048697319733210E-06,  1.5789202789245720E-06],
        [4, 2, -1.5912271792977430E-06, -1.5153915796731720E-06],
        [4, 3, -8.0678881596778210E-08, -8.0349266627431070E-07],
        [4, 4, -1.2692158612216040E-07,  8.2964257754075220E-08]
    ],
};