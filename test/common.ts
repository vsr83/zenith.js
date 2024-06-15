import {AssertionError, strict as assert} from 'assert';

/**
 * Check floating point value with tolerance.   
 * 
 * @param {number} val 
 *      The value to be checked.
 * @param {number} exp 
 *      The expected value.
 * @param {number} tol 
 *      The tolerance for the check.
 */
export function checkFloat(val : number, exp : number, tol : number)
{
    if (Math.abs(val - exp) > tol)
    {
        console.log("Value: " + val);
        console.log("Expected: " + exp);
        console.log("Error: " + Math.abs(val - exp) + " > " + tol);
    }
    assert.equal(Math.abs(val - exp) <= tol, true);
}

/**
 * Check floating point array with tolerance.   
 * 
 * @param {number []} val 
 *      The value to be checked.
 * @param {number []} exp 
 *      The expected value.
 * @param {number} tol 
 *      The tolerance for the check.
 */
export function checkFloatArray(val : number[], exp : number[], tol : number)
{
    for (let indVal = 0; indVal < val.length; indVal++)
    {
        checkFloat(val[indVal], exp[indVal], tol);
    }
}