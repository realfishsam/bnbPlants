from machine import I2C, Pin
import time
import urequests as requests
import network

SSID = "YOUR SSID HERE"
PASSWORD = "YOUR WIFI PASSWORD HERE"

def connect(ssid, password):
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    wlan.connect(ssid, password)

    i = 0
    while wlan.isconnected() == False:
        print("Connecting to Wi-Fi. Attempt: " + str(i), end="\r")
        i += 1
        time.sleep(1)
    
    print("Connected to Wi-Fi\n")

connect(SSID, PASSWORD)

i2c = I2C(1, scl=Pin(15), sda=Pin(14))  # Default I2C bus on Raspberry Pi Pico

class Seesaw:
    def __init__(self, i2c, addr=0x36):
        self.i2c = i2c
        self.addr = addr
        self.temp = bytearray(4)
        self.moist = bytearray(2)

    def get_temp(self):
        self.i2c.writeto(self.addr, bytes([0x00, 0x04]))
        time.sleep(0.1)  
        self.i2c.readfrom_into(self.addr, self.temp)
        return 0.00001525878 * ((self.temp[0] & 0x3F) << 24 | self.temp[1] << 16 | self.temp[2] << 8 | self.temp[3])

    def get_moisture(self):
        self.i2c.writeto(self.addr, bytes([0x0F, 0x10]))
        time.sleep(0.1) 
        self.i2c.readfrom_into(self.addr, self.moist)
        return (self.moist[0] << 8 | self.moist[1])

ss = Seesaw(i2c)

def create_json(serial, temperature, moisture, days):
    data = {
        "serial": serial,
        "data": {
            "TEMPERATURE": temperature,
            "SOIL_MOISTURE": moisture,
            "DAYS": days,
        },
    }
    return data

def post_data(url, headers, data):
    response = requests.post(url, json=data, headers=headers)
    print(str(response.status_code) + " " + str(response.text) + "\n")

API_URL = "YOUR API URL HERE"
API_DEVICE = "YOUR DEVICE ID HERE"
HEADERS = {
    "Content-Type": "application/json",
}

wlan = network.WLAN(network.STA_IF)

while True:
    try:
        if not wlan.isconnected():
            connect(SSID, PASSWORD)  # Try to reconnect if connection is lost

        temp = ss.get_temp()
        moist = ss.get_moisture()

        print("temp: " + str(temp) + "  moisture: " + str(moist))

        days = (moist - 850) / 83.33 
        days = round(days * 2) / 2 

        if days < 0:
            days = 0
        elif days > 3:
            days = 3

        data = create_json(API_DEVICE, temp, moist, days)

        post_data(API_URL, HEADERS, data)
        
        i = 172.8
        while i > 0:
            print("Sleeping for " + str(i) + " seconds", end="\r")
            i = round(i -0.1, 1)
            time.sleep(0.1)                
    
    except Exception as e:
        print(e)
        time.sleep(1)
