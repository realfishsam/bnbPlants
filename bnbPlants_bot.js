// Importing the necessary library
const TelegramBot = require('node-telegram-bot-api');

// Initialize the bot token
const token = 'YOUR BOT TOKEN HERE';

// Create a bot instance and set polling as true to fetch new updates
const bot = new TelegramBot(token, {polling: true});

// Initialize plant status
let status = {
  moisture: '70%',
  temperature: '24C',
  daysUntilWatering: 3,
};

// Set default update interval in hours
let updateInterval = 24;

// Initialize chatId
let chatId;

// Event listener for "/status" command
bot.onText(/\/status/, (msg) => {
  // Store the chat ID 
  chatId = msg.chat.id;
  
  // Format the status message
  const statusText = `Moisture: ${status.moisture}\nTemperature: ${status.temperature}\nEstimated days until watering: ${status.daysUntilWatering}`;
  
  // Send the status message to the user
  bot.sendMessage(chatId, statusText);
});

// Event listener for "/interval" command with no arguments
bot.onText(/\/interval$/, (msg) => {
  // Store the chat ID 
  const chatId = msg.chat.id;
  
  // Prompt user to enter a number after the command
  bot.sendMessage(chatId, 'Please enter a number after the command, e.g. "/interval 24"');
});

// Event listener for "/interval" command with one or more arguments
bot.onText(/\/interval (.+)/, (msg, match) => {
  // Store the chat ID 
  chatId = msg.chat.id;

  // Extract the input from the user
  const resp = match[1];

  // Validate the input number and set the update interval if it's within a reasonable range
  if (!isNaN(resp) && isFinite(resp) && resp >= 0.25 && resp <= 168) {
    updateInterval = resp;
    const intervalMessage = resp == 1 ? 'Update interval set to every hour' : `Update interval set to every ${resp} hours`;
    bot.sendMessage(chatId, intervalMessage);
  } else {
    // Prompt user to enter a valid number if input is not within the range
    bot.sendMessage(chatId, 'Please enter a valid number between 0.25 and 168 for the update interval (in hours)');
  }
});

// Event listener for "/help" command
bot.onText(/\/help/, (msg) => {
  // Store the chat ID
  chatId = msg.chat.id;

  // Send a list of available commands to the user
  bot.sendMessage(chatId, 'Commands:\n/status - Get the current status of the plant\n/interval - Set the update interval (in hours)');
});

// Event listener for "/start" command
bot.onText(/\/start/, (msg) => {
  // Store the chat ID
  chatId = msg.chat.id;

  // Welcome the user and send a list of available commands
  bot.sendMessage(chatId, 'Welcome to the BnB Plants Bot!');
  bot.sendMessage(chatId, 'Commands:\n/status - Get the current status of the plant\n/interval - Set the update interval (in hours)\n/help - Get a list of commands');
});

// Function to send updates to the user every X hours
setInterval(() => {
  // Check if chat ID exists
  if (chatId) {
    // Format the status message
    const statusText = `Moisture: ${status.moisture}\nTemperature: ${status.temperature}\nEstimated days until watering: ${status.daysUntilWatering}`;
    
    // Send the status message to the user
    bot.sendMessage(chatId, statusText);
  }
}, updateInterval * 60 * 60 * 1000); // Convert updateInterval from hours to milliseconds
