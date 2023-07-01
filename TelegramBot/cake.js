const axios = require('axios');


const API_TOKEN = 'YOUR TOKEN HERE';
const DEVICE_URL = 'https://api.datacake.co/v1/devices/' + 'YOUR DEVIDE ID HERE' + '/historic_data/';

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
    const fields = 'TEMPERATURE,SOIL_MOISTURE';
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

    const lastTwoEntries = response.data.slice(-2);

    const combinedEntry = {
        time: lastTwoEntries[0].time,
        SOIL_MOISTURE: lastTwoEntries[0].SOIL_MOISTURE || lastTwoEntries[1].SOIL_MOISTURE,
        TEMPERATURE: lastTwoEntries[0].TEMPERATURE || lastTwoEntries[1].TEMPERATURE,
    };

    return combinedEntry;
};

// export the fetchData function
module.exports = fetchData;

async function main() {
    data = await fetchData();
    console.log(data);
}
