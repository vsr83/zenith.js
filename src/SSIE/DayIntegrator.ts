import { Integration, IntegrationConf, IntegrationState, IntegrationMethod } from "./Integration";
import { JPLData } from "./JPLData";

type BufferMap = {
    [key : number]: IntegrationState;
}

/**
 * Class implementing of the day buffer.
 */
export class DayIntegrator {
    // Integration state.
    public state: IntegrationState;
    // Julian day of the last used initial condition.
    private JDinit : number;
    // Integration configuration.
    private integrationConf : IntegrationConf;
    // Direction of the last integration.
    private lastDirection : number;
    // Number of days after previous initialization.
    private numDaysAfterInitial : number
    // Buffer used to retrieve previously computed states.
    private buffer : BufferMap;

    /**
     * Public constructor.
     * 
     * @param {IntegrationConf} confIn 
     */
    constructor(confIn : IntegrationConf) {
        this.integrationConf = confIn;
        this.JDinit = -1;
        this.lastDirection = 0;
        this.numDaysAfterInitial = 0;
        this.buffer = {};
    }

    /**
     * Integrate to a full day.
     * 
     * @param {number} fullJD 
     *      
     * @returns {IntegrationState} 
     */
    public get(fullJD : number) : IntegrationState {
        if (fullJD != Math.round(fullJD)) {
            throw new Error(fullJD + " not an integer!");
        }

        if (this.JDinit == -1 || Math.abs(fullJD - this.JDinit) > 350.0 || 
            this.numDaysAfterInitial > 365) {
            // First request or the requested time is almost a year away from the 
            // initial condition.

            //console.log("Initialize initial condition " + fullJD);

            this.state = this.fromInitialCondition(fullJD),
            this.JDinit = fullJD;
            this.numDaysAfterInitial = 0;
            this.buffer = {};

            const stateOut = JSON.parse(JSON.stringify(this.state));
            this.buffer[fullJD] = stateOut;

            return stateOut;
        }

        // If the state is in the buffer, skip computation.
        if (fullJD in this.buffer) {
            return this.buffer[fullJD]; 
        }

        // JTepoch should be an integer with the deltaT combined from the previous
        // integration.
        const numDays = fullJD - this.state.JTepoch;

        if (numDays == 0) {
            return JSON.parse(JSON.stringify(this.state));
        }

        this.numDaysAfterInitial += Math.abs(numDays);

        // If the integration changes direction, we must reset the buffer for the 
        // Adams integrator.
        if (Math.sign(numDays) != this.lastDirection) {
            this.state.F = [];
        }

        this.lastDirection = Math.sign(numDays);

        // Integrate from initial condition to the closest full Julian day.
        const integration : Integration = new Integration();
        integration.initialize(this.state, this.integrationConf);
        integration.getIntegrationConf().stepSize = 
            Math.sign(numDays) * Math.abs(integration.getIntegrationConf().stepSize);
        const stepsPerDay = Math.round(Math.abs(1.0 / this.integrationConf.stepSize));

        let stateOut;
        for (let indDay = 0; indDay < Math.abs(numDays); indDay++) {
            integration.integrateSteps(stepsPerDay);

            this.state = integration.getIntegrationState();
            // The result Julian time is always an integer. However, the sum below
            // may lead to floating point errors.
            this.state.JTepoch = Math.round(this.state.JTepoch + this.state.deltaT);
            this.state.deltaT = 0;
            stateOut = JSON.parse(JSON.stringify(this.state));
            this.buffer[fullJD] = stateOut;
        }

        return stateOut;
    }

    /**
     * Integration from an initial condition to closest full Julian day.
     * 
     * @param {number} JD
     *      The Julian day. 
     */
    public fromInitialCondition(JD : number) : IntegrationState {
        // Index of the closest full Julian day.
        const closestFullJD    = Math.min(Math.max(Math.round(JD), JPLData.getFirstJD()),
            JPLData.getLastJD());
        // Index of the closest initial condition to the full Julian day.
        const closestInitInd   = JPLData.findClosest(closestFullJD);
        const closestInitJD    = JPLData.getTdbTimestamps()[closestInitInd];
        const initialCondition = JPLData.getState(closestInitInd);

        //console.log("Closest initial condition " + closestInitJD);

        // The integrated time.
        const deltaJD = closestFullJD - closestInitJD;

        // Integrate from initial condition to the closest full Julian day.
        const integration : Integration = new Integration();
        integration.initialize(initialCondition, this.integrationConf);
        integration.getIntegrationConf().stepSize = 
            Math.abs(integration.getIntegrationConf().stepSize) * Math.sign(deltaJD);

        const numSteps = Math.round(Math.abs(deltaJD / this.integrationConf.stepSize));

        //console.log("Integrating " + numSteps + " steps");

        // Important: Initial conditions should be constructed so that there never
        // can be substep time differences.
        if (numSteps > 0) {
            integration.integrateSteps(numSteps);
            const state = integration.getIntegrationState();
            // The result Julian time is always an integer. However, the sum below
            // may lead to floating point errors.
            state.JTepoch = JD;
            state.deltaT = 0;
            // We need to reset F since the direction of the integration might change.
            state.F = [];
        } else {
            return initialCondition;
        }

        return integration.getIntegrationState();
    }    
}