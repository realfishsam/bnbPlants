# bnbPlants
Say goodbye to dry plants and hello to bnbPlants: the witty, moisture-measuring marvel that keeps your green companions hydrated! bnbPlants measures soil moisture, offers a dashboard, and sends witty reminders to water your plants.

# Introduction
Discover the fascinating world of IoT with "bnbPlants," a project that originated during the summer course at Linnaeus University in 2023. This system effectively measures soil moisture and temperature, and intelligently predicts the watering needs of your plants. The Raspberry Pi Pico serves as the core component, ensuring optimal growth and hydration for every plant in your garden.

# Objective
The "bnbPlants" project arose from a challenge faced by my mother in caring for the plants at our family's Airbnb property during the off-season summer months. Uncertain watering schedules led to stress and inefficiency. To tackle this issue, "bnbPlants" introduces a soil moisture system that not only monitors soil conditions and temperature but also predicts when the next watering is required. The project includes a user-friendly online dashboard, accessible at any time and from anywhere, providing real-time updates on the plants' needs. Additionally, it will send notifications via Telegram to the user when it's time to water the plants, making the task of plant care effortless and precise even for non-tech savvy individuals.

# Materials
|Item|Cost (Sek)|
|:----:|:----:|
|[Raspberry Pi Pico WH](https://www.electrokit.com/produkt/raspberry-pi-pico-wh/)|99.19-109.00|
|Pico Power Supply|tbt|
|[Breadboard (270 connections)](https://www.electrokit.com/produkt/kopplingsdack-270-anslutningar/)|26.10-29.00|
|[Adafruit STEMMA Soil Sensor](https://www.electrokit.com/produkt/jordfuktighetssensor-kapacitiv-i2c/)|115.00|
|[JST PH 2mm 4-Pin to Female Socket Cable](https://www.electrokit.com/en/product/kabel-med-jst-ph-4-pol-hona-0-64mm-stift-200mm/)|24.00|

**Note:**
If you feel confident in your soldering skills, you can readily substitute the Raspberry Pi Pico WH, which comes with pre-soldered headers, with the Raspberry Pi Pico W, which does not have pre-soldered headers, as they are essentially the same.

# Putting It All Together

## Hardware

### Wiring 
<img src="Pi Soil_bb.png"
     alt="Markdown Monster icon" />

## Software
### Sensor and Pico Software
Crafting the software was a bit tricky with Adafruit's somewhat unclear [datasheet](https://learn.adafruit.com/adafruit-stemma-soil-sensor-i2c-capacitive-moisture-sensor/overview). While they did offer sample code for CircuitPython, there was no MicroPython version. The CircuitPython code hinted at a seesaw import: `from adafruit_seesaw.seesaw import Seesaw`. A bit of digging in [Adafruit's GitHub](https://github.com/adafruit) led me to [seesaw.py](https://github.com/adafruit/Adafruit_CircuitPython_seesaw/blob/main/adafruit_seesaw/seesaw.py). I pulled key addresses from there and built a custom class:
```
# Seesaw soil sensor
class Seesaw:
    def __init__(self, i2c, addr=0x36):
        self.i2c = i2c
        self.addr = addr
        self.temp = bytearray(4)
        self.moist = bytearray(2)

    def get_temp(self):
        # Send request to get temperature (command 0x04)
        self.i2c.writeto(self.addr, bytes([0x00, 0x04]))
        time.sleep(0.1)  # Delay for conversion
        self.i2c.readfrom_into(self.addr, self.temp)
        return 0.00001525878 * ((self.temp[0] & 0x3F) << 24 | self.temp[1] << 16 | self.temp[2] << 8 | self.temp[3])

    def get_moisture(self):
        # Send request to get moisture (command 0x0F)
        self.i2c.writeto(self.addr, bytes([0x0F, 0x10]))
        time.sleep(0.1)  # Delay for conversion
        self.i2c.readfrom_into(self.addr, self.moist)
        return (self.moist[0] << 8 | self.moist[1])
```

After setting up, I ran the code like this:
```
i2c = I2C(1, scl=Pin(15), sda=Pin(14))

ss = Seesaw(i2c)

while True:
    temp = ss.get_temp()
    moist = ss.get_moisture()

    print(f"temp: {temp}  moisture: {moist}")
    time.sleep(1)
```

It outputted proper data points:
|temp|moisture|
|:----:|:----:|
|35.21363|452|
|35.21363|468|
|35.21363|466|
|35.41015|462|
|35.10925|433|

The only remaining tasks are to store the data and find a way to inform the user about it.

### Telegram Bot
To create a Telegram Bot, follow these steps:

1. Sign up for Telegram.
2. Message BotFather with the "/start" command and follow his instructions.
3. Write the bot. I used JavaScript, my preferred language.

```
// Importing the necessary library
const TelegramBot = require('node-telegram-bot-api');

// replace the value below with the Telegram token you received from the BotFather
const token = 'YOUR_TELEGRAM_BOT_TOKEN';

// Create a bot instance and set polling as true to fetch new updates
const bot = new TelegramBot(token, {polling: true});

// Initialize plant status, this is dummy data:
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
```


