const axios = require('axios');

const API_TOKEN = 'YOUR API TOKEN HERE';
const DEVICE_URL = 'YOUR DEVICE URL HERE';

const formatDateTime = (date, hours, minutes, seconds, milliseconds) => {
    date.setHours(hours, minutes, seconds, milliseconds);
    
    const padNumber = (number, length = 2) => 
        String(number).padStart(length, '0');
    
    const dateString = [
        date.getFullYear(),
        padNumber(date.getMonth() + 1),
        padNumber(date.getDate()),
    ].join('-');

    const timeString = [
        padNumber(date.getHours()),
        padNumber(date.getMinutes()),
        padNumber(date.getSeconds()),
    ].join(':');
    
    return `${dateString}T${timeString}.${padNumber(date.getMilliseconds(), 3)}`;
};

async function fetchData() {
    const now = new Date();
    const timeframeStart = formatDateTime(new Date(now), 0, 0, 0, 0);
    const timeframeEnd = formatDateTime(new Date(now), 23, 59, 59, 999);
    const fields = 'TEMPERATURE,SOIL_MOISTURE,DAYS';
    const resolution = 'raw';

    const response = await axios.get(DEVICE_URL, {
        headers: {
            'Authorization': `Token ${API_TOKEN}`,
        },
        params: {
            fields,
            resolution,
            timeframe_start: timeframeStart,
            timeframe_end: timeframeEnd,
        },
    });

    const lastCoupleEntries = response.data.slice(-6);

    // loop through lastCoupleEntries, and create a new json object. Include the first soil moisture value that is not null, and the first temperature value that is not null, and the first days value that is not null
    let combinedEntry = {
        SOIL_MOISTURE: null,
        TEMPERATURE: null,
        DAYS: null,
    };

    lastCoupleEntries.forEach(entry => {
      Object.keys(entry).forEach(key => {
        if (entry[key] !== null) {
          combinedEntry[key] = entry[key];
        }
      });
    });

    return combinedEntry;
};

// export the fetchData function
module.exports = fetchData;

async function main() {
    data = await fetchData();
    console.log(data);
}

// if this is the main module, run main()
if (require.main === module) {
    main();
}

