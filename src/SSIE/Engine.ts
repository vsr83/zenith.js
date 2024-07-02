import { DayIntegrator } from "./DayIntegrator";
import { Integration, IntegrationConf, IntegrationState, IntegrationMethod } from "./Integration";
import { JPLData } from "./JPLData";

/**
 * The implementation of the integration engine.
 */
export class Engine {
    // Day integrator.
    private dayIntegrator : DayIntegrator;
 
    // Integration configuration for sub-day integration.
    private integrationConfSubday : IntegrationConf;

    // Integration configuration for day integrator.
    private integrationConfDay : IntegrationConf;

    /**
     * Public constructor.
     * 
     * @param {EngineConf} confIn
     *      Engine configuration. 
     */
    constructor() {
        this.integrationConfDay  = {
            integrationMethod : IntegrationMethod.ADAMS8,
            stepSize : 0.1,
            withRelativity : true,
            withFigure : true,
            figIndSun : 0,
            figIndEarth : 3,
            figIndMoon : 4
        };
        this.integrationConfSubday  = {
            integrationMethod : IntegrationMethod.RK4,
            stepSize : 0.05,
            withRelativity : false,
            withFigure : false,
            figIndSun : 0,
            figIndEarth : 3,
            figIndMoon : 4
        };
        this.dayIntegrator = new DayIntegrator(this.integrationConfDay);
    }

    /**
     * Integrate to Julian time.
     * 
     * @param {number} JD 
     *      Julian Time (TDB).
     */
    get(JD : number) : IntegrationState {
        if (JD < JPLData.getFirstJD() || JD > JPLData.getLastJD()) {
            throw new Error('Parameter out of range!');
        }
        const closestFullJD = Math.round(JD);
        const stateDay = this.dayIntegrator.get(closestFullJD);
        const deltaJD = JD - closestFullJD;

        // If the integration time is 0.1 ms, do not integrate.
        if (Math.abs(deltaJD) < 1.0 / 86400.0e4) {
            return stateDay;
        }
        const integrationConf : IntegrationConf = JSON.parse(JSON.stringify(
            this.integrationConfSubday));
        integrationConf.stepSize = Math.sign(deltaJD) * Math.abs(integrationConf.stepSize);
        const numStepsCoarse = Math.floor(Math.abs(deltaJD / integrationConf.stepSize));
        const integration = new Integration();
        integration.initialize(stateDay, integrationConf);
        integration.integrateSteps(numStepsCoarse);
        
        const deltaJDfine = deltaJD - integration.getIntegrationState().deltaT;
        if (Math.abs(deltaJDfine) > 1.0 / 86400.0e4) {
            integrationConf.stepSize = deltaJDfine;
            integration.initialize(integration.getIntegrationState(), integrationConf);
            integration.integrateSteps(1);
        }
        return JSON.parse(JSON.stringify(integration.getIntegrationState()));
    }
}