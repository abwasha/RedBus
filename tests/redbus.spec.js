import { test, page } from '@playwright/test'

test('@Red Red bus challenge', async ({ page }) => {

    await page.goto('https://www.redbus.in/')
    //page.waitForLoadState('networkidle')
    await page.getByText('Date', { exact: true }).click()
    let holiday_count,monthYear,Year,Month

    let counter = 0
    const inputDate = "Sep 2024"

    const daysInMonth = new Map();

    // Add keys to the set
    const monthsWith31Days = new Set(['Jan', 'Mar', 'May', 'Jul', 'Aug', 'Oct', 'Dec']);
    const monthsWith30Days = new Set(['Apr', 'Jun', 'Sep', 'Nov']);

    // Map each key to the desired value
    monthsWith31Days.forEach(month => daysInMonth.set(month, 31));
    monthsWith30Days.forEach(month => daysInMonth.set(month, 30));
    // February is handled separately for leap years
    daysInMonth.set('Sep', 28);

    /*This is the base to calculate the first weekend. 
    As we know in the website the Week always starts on Monday.*/
    const daysOfWeek = new Map([
        ['Mon', 7],
        ['Tue', 6],
        ['Wed', 5],
        ['Thu', 4],
        ['Fri', 3],
        ['Sat', 2],
        ['Sun', 1]
    ]);   

    do {
        const websiteDateElement = await page.locator('div[class^="DayNavigator__CalendarHeader"] div:nth-child(2)');
        const websiteDate = await websiteDateElement.textContent();

        holiday_count = await (websiteDate.includes('Holiday')
            ? page.locator('.holiday_count').textContent()
            : 'No Holidays');

        [monthYear, Year, Month] = splitText(websiteDate);
        console.log(`${monthYear}---${holiday_count}`);

        // Leap Year setttings
        const daysInFeb = Year % 4 === 0 ? 29 : 28;
        daysInMonth.set('Feb', daysInFeb);

        // Get the position of the first day of the month
        const positionOfTheFirstDayOfMonth=await page.locator('div[class^="DayTilesWrapper__RowWrap"]:nth-child(2) div span').count()

        //Read the month and check the number of days in the month from the predefined Map
        const numberOfDaysInTheCurrentMonth= daysInMonth.get(Month)
        const dayOfThefirstDayOfMonth = [...daysOfWeek].find(([key, val]) => val == positionOfTheFirstDayOfMonth)[0]
        const counterToGetTheFirstDayOfTheWeekend=adjustValue(dayOfThefirstDayOfMonth,positionOfTheFirstDayOfMonth)
        /*
        Based on the the first day on the current month, I need a counter to calculate the first Saturday.
        For example, if the First day in March 2024 starts On Friday, my Counter will be calculated using the 
        daysOfWeek Map value mapped for Friday and the function adjustValue, in this case 3-2=1.
        Then addWeekednDatesToList function will basically calculate Sat and Sun and add to the Array.
        */
        const weekendList = addWeekednDatesToList(new Array(), numberOfDaysInTheCurrentMonth, counterToGetTheFirstDayOfTheWeekend)
        console.log('WeekendList for '+ monthYear+ ' is = [' +weekendList+']')

        await page.locator('div[class^="DayNavigator__CalendarHeader"] div:nth-child(3)').click();

    } while (monthYear !== inputDate)
})

function splitText(text) {
    // Regular expression to match the month and year part (e.g., "May 2024")
    const monthYearRegex = /([a-zA-Z]+)(\s)(\d{4})/;
    const monthYear = text.match(monthYearRegex);
     return [monthYear[0], monthYear[3], monthYear[1]]

}
let isFirstCall = true; // Flag to track the first call of the function for the current month

function addWeekednDatesToList(array, numberOfDaysInTheCurrentMonth, counter) {
    let firstWeekendDate = 1;
    if (counter === 6) {
        array.push(firstWeekendDate);
    }
    for (let sat = firstWeekendDate + counter; sat <= numberOfDaysInTheCurrentMonth; sat += 7) {
        const sun = sat + 1;
        array.push(sat, sun);
        firstWeekendDate = sun;
    }
    if (isFirstCall) {
        const currentDate = new Date().getDate();
        array = array.filter(day => day >= currentDate);
        isFirstCall = false; // Set isFirstCall to false after processing the first call
    }
    return array.filter(day => day <= numberOfDaysInTheCurrentMonth);
}
function adjustValue(day, value) {
    if (day === 'Sun') {
        return value + 5; // Add 5 to the value for Sunday
    } else {
        return value - 2; // Subtract 2 from the value for other days
    }
}