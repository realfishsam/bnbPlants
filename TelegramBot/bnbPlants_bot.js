// Import necessary libraries
const TelegramBot = require('node-telegram-bot-api');
const fetchData = require('./cake.js');

// Initialize the bot token
const TOKEN = 'YOUR BOT TOKEN HERE';
const bot = new TelegramBot(TOKEN, {polling: true});

let updateInterval = 24;

// Initialize chatId
let chatId;

// Function to fetch and send status
async function sendStatus() {
    fetchData().then((data) => {
        console.log("Fetched data from Datacake: ", data);
        data.TEMPERATURE = Math.round(data.TEMPERATURE * 10) / 10;
        data.SOIL_MOISTURE = Math.round( (data.SOIL_MOISTURE / 2000) * 100) ;
        const statusText = `Moisture: ${data.SOIL_MOISTURE}%\nTemperature: ${data.TEMPERATURE}°C\nWater in: ${status.daysUntilWatering} days`;
        bot.sendMessage(chatId, statusText);
    });
}

// Function to periodically fetch and send status
function startUpdateInterval() {
    setInterval(sendStatus, updateInterval * 3600000); // updateInterval is in hours, so we convert to milliseconds
}

// Event listeners for commands
bot.onText(/\/status/, (msg) => {
  chatId = msg.chat.id;
  sendStatus();
});

// user sent '/interval', but forgot to specify a number
bot.onText(/\/interval$/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Please enter a number after the command, e.g. "/interval 24"');
});

bot.onText(/\/interval (.+)/, (msg, match) => {
  chatId = msg.chat.id;
  const resp = match[1];
  if (!isNaN(resp) && isFinite(resp) && resp >= 0.25 && resp <= 168) {
    updateInterval = resp;
    const intervalMessage = resp == 1 ? 'Update interval set to every hour' : `Update interval set to every ${resp} hours`;
    bot.sendMessage(chatId, intervalMessage);
    startUpdateInterval(); // Restart the update interval with the new value
  } else {
    bot.sendMessage(chatId, 'Please enter a valid number between 0.25 and 168 for the update interval (in hours)');
  }
});

bot.onText(/\/help/, (msg) => {
  chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Commands:\n/status - Get the current status of the plant\n/interval - Set the update interval (in hours)');
});

bot.onText(/\/start/, (msg) => {
  chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Welcome to the BnB Plants Bot!');
  bot.sendMessage(chatId, 'Commands:\n/status - Get the current status of the plant\n/interval - Set the update interval (in hours)\n/help - Get a list of commands');
  startUpdateInterval(); // Start the update interval when the bot starts
});
