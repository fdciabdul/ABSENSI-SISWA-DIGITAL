import { BaseSeeder } from '@adonisjs/lucid/seeders'
import FingerprintDevice from '#models/fingerprint_device'

export default class extends BaseSeeder {
  async run() {
    await FingerprintDevice.createMany([
      {
        deviceName: 'Main Gate Scanner',
        serialNumber: 'FP001',
        ipAddress: '192.168.1.100',
        port: 4370,
        location: 'Main Entrance',
        isOnline: true,
        deviceModel: 'ZKTeco F18',
        firmwareVersion: '1.2.3',
        isActive: true
      },
      {
        deviceName: 'Classroom Block A Scanner',
        serialNumber: 'FP002',
        ipAddress: '192.168.1.101',
        port: 4370,
        location: 'Block A Entrance',
        isOnline: false,
        deviceModel: 'ZKTeco F18',
        firmwareVersion: '1.2.3',
        isActive: true
      },
      {
        deviceName: 'Library Scanner',
        serialNumber: 'FP003',
        ipAddress: '192.168.1.102',
        port: 4370,
        location: 'Library Entrance',
        isOnline: true,
        deviceModel: 'ZKTeco F19',
        firmwareVersion: '1.3.1',
        isActive: true
      }
    ])
  }
}