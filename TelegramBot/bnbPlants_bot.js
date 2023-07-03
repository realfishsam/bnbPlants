// Import required libraries
const TelegramBot = require('node-telegram-bot-api');
const fetchData = require('./cake.js');

// Set up the bot token
const TOKEN = 'YOUR TOKEN HERE';
const bot = new TelegramBot(TOKEN, {polling: true});

let updateInterval = 24;

// Define chatId, intervalId and checkWateringId
let chatId;
let intervalId;
let checkWateringId;

// Counter to check the number of times the plant needed watering consecutively
let wateringCount = 0;

// Function to fetch and deliver status
async function sendStatus() {
    fetchData().then((data) => {
        console.log("Data received from Datacake: ", data);
        data.TEMPERATURE = Math.round(data.TEMPERATURE * 10) / 10;
        data.SOIL_MOISTURE = Math.round( (data.SOIL_MOISTURE / 2000) * 100) ;

        const statusText = `🌫️ Moisture: ${data.SOIL_MOISTURE}%\n🌡️ Temperature: ${data.TEMPERATURE}°C\n🚰 Water in: ${data.DAYS} days`;
        bot.sendMessage(chatId, statusText);
        const seeMoreMessage = `See more at https://app.datacake.de/dashboard/d/de83fefc-12d6-4ee9-87cc-da17489cd981`;
        bot.sendMessage(chatId, seeMoreMessage);
    });
}

// Function to check if plant needs watering and send reminder message if it does
async function checkWateringStatus() {
    fetchData().then((data) => {
      console.log("Checking watering status...")
        if (data.DAYS === 0) {
            console.log("Uh oh, plant needs watering! 🌵" + `Moisture: ${data.moisture / 2000}`);
            wateringCount++;

            if (wateringCount === 5) {
               console.log("Sending reminder message...");
                bot.sendMessage(chatId, "Your plant is parched! 🌵 Please hydrate 💦 it as soon as possible!");
            }
        } else {
            console.log("Plant is fine! 🌱")
            wateringCount = 0; // reset counter if not at zero
        }
    });
}

// Function to fetch and send status at regular intervals
function startUpdateInterval() {
    // Reset the preceding interval if it's present
    if (intervalId) {
        clearInterval(intervalId);
    }

    intervalId = setInterval(sendStatus, updateInterval * 3600000); // Convert updateInterval from hours to milliseconds
}

// Function to check watering status every 10 minutes
function startCheckWateringInterval() {
    // Reset the preceding interval if it's present
    if (checkWateringId) {
        clearInterval(checkWateringId);
    }

    checkWateringId = setInterval(checkWateringStatus, (10 / 3) * 60000); // 3.33... minutes in milliseconds
}

// Event handlers for commands
bot.onText(/\/status/, (msg) => {
  chatId = msg.chat.id;
  sendStatus();
});

bot.onText(/\/interval$/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Specify a number following the command, like "/interval 24"');
});

bot.onText(/\/interval (.+)/, (msg, match) => {
  chatId = msg.chat.id;
  const resp = match[1];
  if (!isNaN(resp) && isFinite(resp) && resp >= 0.25 && resp <= 168) {
    updateInterval = resp;
    const intervalMessage = resp == 1 ? 'Update interval set to each hour' : `Update interval set to every ${resp} hours`;
    bot.sendMessage(chatId, intervalMessage);
    startUpdateInterval(); // Reset the update interval using the new value
  } else {
    bot.sendMessage(chatId, 'Enter a valid number between 0.25 and 168 for the update interval (in hours)');
  }
});

bot.onText(/\/help/, (msg) => {
  chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Commands:\n/status - Get current plant status\n/interval - Set update interval (in hours)');
});

bot.onText(/\/start/, (msg) => {
  chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Welcome to BnB Plants Bot!');
  bot.sendMessage(chatId, 'Commands:\n/status - Get current plant status\n/interval - Set update interval (in hours)\n/help - Get command list');
  startUpdateInterval(); // Begin the update interval when the bot initiates
  startCheckWateringInterval(); // Begin the watering check interval when the bot initiates
});
