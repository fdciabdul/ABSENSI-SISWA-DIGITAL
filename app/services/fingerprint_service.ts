//@ts-nocheck
import ZKLib from 'zklib-js'
import FingerprintDevice from '#models/fingerprint_device'
import Student from '#models/student'
import Attendance from '#models/attendance'
import DeviceLog from '#models/device_log'
import { DateTime } from 'luxon'

export default class FingerprintService {
  private zkInstance: any
  private device: FingerprintDevice

  constructor(device: FingerprintDevice) {
    this.device = device
    this.zkInstance = new ZKLib(device.ipAddress, device.port, 5200, 5000)
  }

  async connect(): Promise<boolean> {
    try {
      await this.zkInstance.createSocket()
      await this.updateDeviceStatus(true)
      await this.logActivity('info', 'Device connected successfully')
      return true
    } catch (error) {
      await this.updateDeviceStatus(false)
      await this.logActivity('error', `Connection failed: ${error.message}`)
      return false
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.zkInstance.disconnect()
      await this.updateDeviceStatus(false)
      await this.logActivity('info', 'Device disconnected')
    } catch (error) {
      await this.logActivity('error', `Disconnect failed: ${error.message}`)
    }
  }

  async getDeviceInfo(): Promise<any> {
    try {
      const info = await this.zkInstance.getInfo()
      await this.logActivity('info', 'Device info retrieved', info)
      return info
    } catch (error) {
      await this.logActivity('error', `Failed to get device info: ${error.message}`)
      throw error
    }
  }

  async syncUsers(): Promise<void> {
    try {
      const students = await Student.query()
        .where('isActive', true)
        .preload('fingerprints')

      for (const student of students) {
        if (student.fingerprints.length > 0) {
          await this.zkInstance.setUser(
            student.id,
            student.studentId,
            student.name,
            '123456', // default password
            0, // role
            0  // card number
          )
        }
      }

      await this.logActivity('info', `Synced ${students.length} users to device`)
    } catch (error) {
      await this.logActivity('error', `User sync failed: ${error.message}`)
      throw error
    }
  }

  async getAttendanceLogs(): Promise<any[]> {
    try {
      const logs = await this.zkInstance.getAttendances()
      await this.logActivity('info', `Retrieved ${logs.length} attendance logs`)
      return logs
    } catch (error) {
      await this.logActivity('error', `Failed to get attendance logs: ${error.message}`)
      throw error
    }
  }

  async startRealTimeMonitoring(): Promise<void> {
    try {
      await this.zkInstance.getRealTimeLogs(async (data: any) => {
        await this.processRealTimeAttendance(data)
      })
      await this.logActivity('info', 'Real-time monitoring started')
    } catch (error) {
      await this.logActivity('error', `Real-time monitoring failed: ${error.message}`)
      throw error
    }
  }

  private async processRealTimeAttendance(data: any): Promise<void> {
    try {
      const student = await Student.query()
        .where('studentId', data.deviceUserId)
        .orWhere('id', data.deviceUserId)
        .first()

      if (!student) {
        await this.logActivity('warning', `Unknown user attendance: ${data.deviceUserId}`)
        return
      }

      const attendanceDate = DateTime.fromJSDate(data.recordTime)
      const today = DateTime.now().startOf('day')

      // Check if attendance already exists for today
      const existingAttendance = await Attendance.query()
        .where('studentId', student.id)
        .where('attendanceDate', '>=', today.toSQL())
        .where('attendanceDate', '<', today.plus({ days: 1 }).toSQL())
        .first()

      if (existingAttendance) {
        // Update checkout time if it's a checkout
        existingAttendance.checkOutTime = attendanceDate
        await existingAttendance.save()
      } else {
        // Create new attendance record
        await Attendance.create({
          studentId: student.id,
          deviceId: this.device.id,
          status: this.determineAttendanceStatus(attendanceDate),
          checkInTime: attendanceDate,
          attendanceDate: today,
          isManualEntry: false
        })
      }

      await this.logActivity('info', `Attendance recorded for ${student.name}`, {
        studentId: student.studentId,
        time: attendanceDate.toISO()
      })

    } catch (error) {
      await this.logActivity('error', `Failed to process attendance: ${error.message}`)
    }
  }

  private determineAttendanceStatus(checkInTime: DateTime): string {
    const hour = checkInTime.hour
    const minute = checkInTime.minute

    // School starts at 07:00
    if (hour < 7 || (hour === 7 && minute <= 0)) {
      return 'present'
    } else if (hour === 7 && minute <= 15) {
      return 'present' // grace period
    } else if (hour === 7 && minute <= 30) {
      return 'late'
    } else {
      return 'late'
    }
  }

  async clearAttendanceLogs(): Promise<void> {
    try {
      await this.zkInstance.clearAttendanceLog()
      await this.logActivity('info', 'Attendance logs cleared from device')
    } catch (error) {
      await this.logActivity('error', `Failed to clear logs: ${error.message}`)
      throw error
    }
  }

  async setDeviceTime(): Promise<void> {
    try {
      const currentTime = await this.zkInstance.getTime()
      await this.logActivity('info', `Device time: ${currentTime}`)
    } catch (error) {
      await this.logActivity('error', `Failed to get/set device time: ${error.message}`)
      throw error
    }
  }

  private async updateDeviceStatus(isOnline: boolean): Promise<void> {
    this.device.isOnline = isOnline
    this.device.lastSyncAt = DateTime.now()
    await this.device.save()
  }

  private async logActivity(level: string, message: string, metadata?: any): Promise<void> {
    await DeviceLog.create({
      deviceId: this.device.id,
      action: 'fingerprint_operation',
      message,
      level,
      metadata
    })
  }
}