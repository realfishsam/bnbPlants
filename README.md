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
|Pico Power Supply|N/A|
|Breadboard (tbt)|tbt|
|[Soil Moisture Sensor](https://www.electrokit.com/produkt/jordfuktighetssensor-kapacitiv-i2c/)|115.00|
|Jumper Cables (quantity)|N/A|

**Note:**
If you feel confident in your soldering skills, you can readily substitute the Raspberry Pi Pico WH, which comes with pre-soldered headers, with the Raspberry Pi Pico W, which does not have pre-soldered headers, as they are essentially the same.

# Putting It All Together

## Hardware

### Wiring 
<img src="Pi Soil_bb.png"
     alt="Markdown Monster icon" />

## Software
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

so all that's left is data visualization.
