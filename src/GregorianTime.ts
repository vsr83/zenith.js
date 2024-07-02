

/**
 * Class for performing operations on Gregorian times.
 */
export class GregorianTime {
    year : number;
    month : number; 
    mday : number; 
    hour : number;
    minute : number; 
    second : number;

    /**
     * Public constructor.
     * 
     * @param {number} year 
     *      Year.
     * @param {number} month 
     *      Month (1-12).
     * @param {number} mday
     *      Day of the month. 
     * @param {number} hour 
     *      Hour (0-23).
     * @param {number} minute
     *      Minute (0-59). 
     * @param {number} second
     *      Fractional second (0-60). 
     */
    public constructor(year : number, month : number, mday : number, 
        hour : number, minute : number, second : number) {
        this.year = year;
        this.month = month;
        this.mday = mday;
        this.hour = hour;
        this.minute = minute;
        this.second = second;
    }

    /**
     * Check whether the year of Gregorian time corresponds to a leap year.
     * 
     * @returns {boolean} Boolean value indicating leap year.
     */
    public isLeap() : boolean {
        if (this.year % 4 == 0) {
            if (this.year % 100 == 0 && this.year % 400 != 0) {
                return false;
            }  else {
                return true;
            }
        }
        return false;
    }

    /**
     * Add years to a Gregorian time.
     * 
     * @param {number} numYears
     *      Number of years to add. 
     */
    public addYears(numYears : number) {
        this.year += numYears;
    }

    /**
     * Add months to a Gregorian time.
     * 
     * @param {number} numMonths
     *      Number of months to add. 
     */
    public addMonths(numMonths : number) {
        // This should work independently of the sign of numMonths:
        // If numMonths = - this.month, this.month + numMonths - 1 = -1.
        const numYears = Math.floor((this.month + numMonths - 1) / 12);
        numMonths -= numYears * 12;

        this.addYears(numYears);
        this.month += numMonths;
    }

    /**
     * Add days to a Gregorian time.
     * 
     * @param {number} numDays
     *      Number of days to add. 
     */
    public addDays(numDays : number) {
        //                           1   2   3   4   5   6   7   8   9  10  11  12    
        const numDaysPerMonth = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

        if (numDays > 0) {
            while (numDays > 0) {
                const year = this.year;
                let daysInCurrentMonth = numDaysPerMonth[this.month];
                if (this.month == 2 && this.isLeap()) {
                    daysInCurrentMonth++;
                }

                if (numDays + this.mday > daysInCurrentMonth) {
                    this.addMonths(1);
                    numDays -= daysInCurrentMonth;
                } else {
                    this.mday += numDays;
                    numDays = 0;
                }
            }
        } else if (numDays < 0) {
            while (numDays < 0) {
                if (this.mday + numDays < 1) {
                    if (this.month > 1) {
                        let daysInPreviousMonth = numDaysPerMonth[this.month - 1];
                        if (this.month == 3 && this.isLeap()) {
                            daysInPreviousMonth++;
                        }
                        numDays += this.mday;
                        this.mday = daysInPreviousMonth;
                        this.month--;
                    } else {
                        let daysInPreviousMonth = numDaysPerMonth[12];
                        numDays += this.mday;
                        this.mday = daysInPreviousMonth;
                        this.year--;
                        this.month = 12;
                    }
                } else {
                    this.mday += numDays;
                    numDays = 0;
                }
            }
        }
    }

    /**
     * Add hours to a Gregorian time.
     * 
     * @param {number} numHours
     *      Number of hours to add. 
     */
    public addHours(numHours : number) {
        const numDays = Math.floor((this.hour + numHours) / 24);
        numHours -= numDays * 24;

        this.addDays(numDays);
        this.hour += numHours;
    }

    /**
     * Add minutes to a Gregorian time.
     * 
     * @param {number} numMinutes
     *      Number of minutes to add. 
     */
    public addMinutes(numMinutes : number) {
        const numHours = Math.floor((this.minute + numMinutes) / 60);
        numMinutes -= numHours * 60;

        this.addHours(numHours);
        this.minute += numMinutes;
    }

    /**
     * Add seconds to a Gregorian time.
     * 
     * @param {number} numSeconds 
     *      Number of seconds to add.
     */
    public addSeconds(numSeconds : number) {
        const numMinutes = Math.floor((this.second + numSeconds) / 60);
        numSeconds -= numMinutes * 60;

        this.addMinutes(numMinutes);
        this.second += numSeconds;
    }

    /**
     * Add milliseconds to a Gregorian time.
     * 
     * @param {number} numMillis 
     *      Number of milliseconds to add.
     */
    public addMillis(numMillis : number) {
        const numSeconds = Math.floor(numMillis / 1000);
        numMillis -= numSeconds * 1000;

        this.addSeconds(numSeconds);
        this.second += numMillis / 1000.0;
    }

    /**
     * Check whether Gregorian time if after a target time.
     * 
     * @param {GregorianTime} target
     *      Target Gregorian time. 
     * @returns {boolean} Flag indicating whether time is after target.
     */
    public isAfter(target : GregorianTime) : boolean {
        if (this.year > target.year) {
            return true;
        } else if (this.year < target.year) {
            return false;
        }

        // source.year == target.year
        if (this.month > target.month) {
            return true;
        } else if (this.month < target.month) {
            return false;
        }

        // source.month == target.month
        if (this.mday > target.mday) {
            return true;
        } else if (this.mday < target.mday) {
            return false;
        }

        // source.mday == target.mday
        if (this.hour > target.hour) {
            return true;
        } else if (this.hour < target.hour) {
            return false;
        }

        // source.hour == target.hour
        if (this.minute > target.minute) {
            return true;
        } else if (this.minute < target.minute) {
            return false;
        }

        // source.minute == target.minute
        if (this.second > target.second) {
            return true;
        } else if (this.second < target.second) {
            return false;
        }

        return false;
    }
}