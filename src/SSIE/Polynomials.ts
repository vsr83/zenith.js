/**
 * This class contains implementation of the computation of values and 
 * derivatives of different polynomials.
 */
export class Polynomials
{
    /**
     * Compute value of associated Legendre polynomial.
     * 
     * REFERENCES: 
     *  [1] https://en.wikipedia.org/wiki/Associated_Legendre_polynomials, 
     *  Referenced 26.3.2024.
     *  
     * @param {number} l 
     *      The degree of the polynomial.
     * @param {number} m 
     *      The order of the polynomial.
     * @param {number} x 
     *      The parameter to the polynomial 
     * @returns {number} The value.
     */
    static legendreAssoc(l : number, m : number, x : number) : number {
        switch(l) {
        case 1:
            switch(m) {
                case 0:
                    return x;
                case 1:
                    return -Math.sqrt(1 - x**2);
        }
        case 2:
            switch(m) {
                case 0:
                    return 0.5 * (3 * x**2 - 1);
                case 1:
                    return -3 * x * Math.sqrt(1 - x**2);
                case 2:
                    return 3 * (1 - x**2);
            }
        case 3:
            switch(m) {
                case 0:
                    return 0.5 * (5 * x**3 - 3 * x);
                case 1:
                    return 1.5 * (1 - 5 * x**2) * Math.sqrt(1 - x**2);
                case 2:
                    return 15 * x * (1 - x**2);
                case 3:
                    return -15 * Math.pow(1 - x**2, 1.5);
            }
        case 4:
            switch(m) {
                case 0:
                    return 0.125 * (35 * x**4 - 30 * x**2 + 3);
                case 1:
                    return -2.5 * (7 * x**3 - 3 * x) * Math.sqrt(1 - x**2);
                case 2:
                    return 7.5 * (7 * x**2 - 1) * (1 - x**2);
                case 3:
                    return -105 * x * Math.pow(1 - x**2, 1.5);
                case 4:
                    return 105 * Math.pow(1 - x**2, 2);
            }
        }

        return 0;
    }

    /**
     * Compute derivative of associated Legendre polynomial.
     * 
     * REFERENCES: 
     *  [1] https://en.wikipedia.org/wiki/Associated_Legendre_polynomials, 
     *  Referenced 26.3.2024.
     * 
     * @param {number} l 
     *      The degree of the polynomial.
     * @param {number} m 
     *      The order of the polynomial.
     * @param {number} x 
     *      The parameter to the polynomial
     * @returns {number} The value.
     */
    static legendreAssocd(l : number, m : number, x : number) : number {
        switch(l) {
        case 1:
            switch(m) {
                case 0:
                    return 1;
                case 1:
                    return x / Math.sqrt(1 - x**2);
            }
        case 2:
            switch(m) {
                case 0:
                    return 3 * x;
                case 1:
                    return -3 * Math.sqrt(1 - x**2) + 3 * x**2 / Math.sqrt(1 - x**2);
                case 2:
                    return -6 * x;
            }
        case 3:
            switch(m) {
                case 0:
                    return 7.5 * x**2 - 1.5;
                case 1:
                    return (-1.5 + 7.5 * x**2) * x / Math.sqrt(1 - x**2) 
                        - 15 * x * Math.sqrt(1 - x**2);
                case 2:
                    return 15 - 45 * x**2;
                case 3:
                    return 45 * x * Math.sqrt(1 - x**2);
            }
        case 4:
            switch(m) {
                case 0:
                    return 17.5 * x**3 - 7.5 * x;
                case 1:
                    return (17.5 * x**4 - 7.5 * x**2) / Math.sqrt(1 - x**2) 
                    - (52.5 * x * x - 7.5) * Math.sqrt(1 - x * x);
                case 2:
                    return 120 * x - 210 * x**3;
                case 3:
                    return -105 * Math.pow(1 - x**2, 1.5) + 315 * x**2 * Math.sqrt(1 - x**2);
                case 4:
                    return -420 * (x - x**3);
            }
        }

        return 0;
    }

    /**
     * Compute derivative of a Legendre polynomial.
     * 
     * REFERENCES: 
     *  [1] https://en.wikipedia.org/wiki/Legendre_polynomials, Referenced
     *  26.3.2024.
     * 
     * @param {number} n 
     *      The degree of the polynomial.
     * @param {number} x 
     *      The parameter to the polynomial.
     * @returns {number} The derivative.
     */
    static legendreDeriv(n : number, x : number) : number {
        switch(n) {
        case 0:
            return 0;
        case 1:
            return 1;
        case 2:
            return 3 * x;
        case 3:
            return 7.5 * x**2 - 1.5;
        case 4:
            return 17.5 * x**3 - 7.5 * x;
        case 5:
            return 39.375 * x**4 - 26.25 * x**2 + 1.875;
        case 6:
            return 86.625 * x**5 - 78.75 * x**3 + 13.125 * x;
        }

        return 0;
    }

    /**
     * Compute value of a Legendre polynomial.
     * 
     * REFERENCES: 
     *  [1] https://en.wikipedia.org/wiki/Legendre_polynomials, Referenced
     *  26.3.2024.
     * 
     * @param {number} n 
     *      The degree of the polynomial.
     * @param {number} x 
     *      The parameter to the polynomial.
     * @returns {number} The value.
     */
    static legendreValue(n : number, x : number) : number {
        switch(n) {
        case 0:
            return 1;
        case 1:
            return x;
        case 2:
            return 0.5 * (3 * x**2 - 1);
        case 3:
            return 0.5 * (5 * x**3 - 3 * x);
        case 4:
            return 0.125 * (35 * x**4 - 30 * x**2 + 3);
        case 5:
            return 0.125 * (63 * x**5 - 70 * x**3 + 15 * x);
        case 6:
            return 0.0625 * (231 * x**6 - 315 * x**4 + 105 * x**2 - 5);
        }
        return 0;
    }    
}