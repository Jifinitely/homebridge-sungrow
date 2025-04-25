const { Service, Characteristic } = require('homebridge');
const ModbusRTU = require('modbus-serial');
const FakeGatoHistoryService = require('fakegato-history');

module.exports = (homebridge) => {
  homebridge.registerPlatform('homebridge-sungrow', 'Sungrow', SungrowPlatform);
};

class SungrowPlatform {
  constructor(log, config) {
    this.log = log;
    this.config = config;
    this.client = new ModbusRTU();
    this.accessories = [];

    this.host = config.host;
    this.port = config.port || 502;
    this.unitId = config.unitId || 1;
    this.interval = config.pollInterval || 10000;

    this.client.setTimeout(5000);
    this._connect();
  }

  async _connect() {
    try {
      await this.client.connectTCP(this.host, { port: this.port });
      this.client.setID(this.unitId);
      this.log(`Connected to Sungrow inverter at ${this.host}`);
      setInterval(() => this._poll(), this.interval);
    } catch (err) {
      this.log(`Connection error: ${err.message}`);
    }
  }

  async _poll() {
    try {
      const powerRegs = await this.client.readInputRegisters(5031, 2);
      const activePower = powerRegs.data[0] * 65536 + powerRegs.data[1];

      const importRegs = await this.client.readInputRegisters(5097, 2);
      const dailyImport = ((importRegs.data[0] << 16) + importRegs.data[1]) / 10;

      this.accessories.forEach((acc) => {
        acc.powerService.updateCharacteristic(Characteristic.CurrentConsumption, activePower);
        acc.importService.updateCharacteristic(Characteristic.TotalConsumption, dailyImport);
      });

      this.accessories.forEach((acc) => {
        acc.historyService.addEntry({
          time: Math.floor(Date.now() / 1000),
          power: activePower,
          import: dailyImport
        });
      });
    } catch (err) {
      this.log(`Polling error: ${err.message}`);
    }
  }

  accessories(callback) {
    const accessory = new Service.AccessoryInformation();

    const powerService = new Service.PowerMeter('PV Power');
    accessory.addService(powerService);

    const importService = new Service.PowerMeter('Grid Import');
    accessory.addService(importService);

    const historyService = new FakeGatoHistoryService('energy', accessory, {
      storage: 'fs',
      disableTimer: true
    });

    accessory.powerService = powerService;
    accessory.importService = importService;
    accessory.historyService = historyService;

    this.accessories.push(accessory);
    callback(this.accessories);
  }
}