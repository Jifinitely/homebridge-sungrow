# homebridge-sungrow

Homebridge plugin for Sungrow SG5K-D inverters.

## Installation

```bash
npm install -g homebridge-sungrow
```

## Configuration

Add to your Homebridge `config.json`:

```json
{
  "platforms": [
    {
      "platform": "Sungrow",
      "name": "Sungrow Inverter",
      "host": "<inverter_ip>",
      "port": 502,
      "unitId": 1,
      "pollInterval": 10000
    }
  ]
}
```

## Usage

After restarting Homebridge, you’ll see two new sensors in HomeKit:
- **PV Power**: Current solar output in Watts
- **Grid Import**: Daily grid import in kWh

Enjoy monitoring your solar system in HomeKit!