export type WearableReading = {
  metric: 'heart_rate' | 'spo2' | 'body_temperature'
  value: number
  unit: 'bpm' | '%' | '°C'
  source: string
  receivedAt: string
}

export type WearableSnapshot = {
  status: 'not-connected' | 'searching' | 'connecting' | 'connected' | 'error'
  deviceId: string | null
  deviceName: string | null
  batteryPercent: number | null
  heartRate: WearableReading | null
  heartRateHistory: WearableReading[]
  measurementHistory: WearableReading[]
  oxygenSaturation: WearableReading | null
  bodyTemperature: WearableReading | null
  error: string | null
}

type BluetoothCharacteristic = EventTarget & {
  value?: DataView
  properties?: { read: boolean; notify: boolean; indicate: boolean }
  startNotifications(): Promise<BluetoothCharacteristic>
  readValue(): Promise<DataView>
}

type BluetoothService = {
  getCharacteristic(id: string): Promise<BluetoothCharacteristic>
}

type BluetoothServer = {
  connect(): Promise<BluetoothServer>
  getPrimaryService(id: string): Promise<BluetoothService>
}

type BluetoothDevice = EventTarget & {
  id: string
  name?: string
  gatt?: BluetoothServer & { connected: boolean; disconnect(): void }
}

type BluetoothApi = {
  requestDevice(options: { acceptAllDevices: true; optionalServices: string[] }): Promise<BluetoothDevice>
}

const initialSnapshot: WearableSnapshot = {
  status: 'not-connected',
  deviceId: null,
  deviceName: null,
  batteryPercent: null,
  heartRate: null,
  heartRateHistory: [],
  measurementHistory: [],
  oxygenSaturation: null,
  bodyTemperature: null,
  error: null,
}

const storageKey = 'ruralcare.wearable.readings'

function isWearableReading(value: unknown): value is WearableReading {
  if (!value || typeof value !== 'object') return false
  const reading = value as Partial<WearableReading>
  return (reading.metric === 'heart_rate' || reading.metric === 'spo2' || reading.metric === 'body_temperature')
    && Number.isFinite(reading.value)
    && (reading.unit === 'bpm' || reading.unit === '%' || reading.unit === '°C')
    && typeof reading.source === 'string'
    && typeof reading.receivedAt === 'string'
}

function sortReadingsByTime(readings: WearableReading[]) {
  return [...readings].sort((a, b) => new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime())
}

function loadStoredReadings(): Pick<WearableSnapshot, 'heartRate' | 'heartRateHistory' | 'measurementHistory' | 'oxygenSaturation' | 'bodyTemperature'> {
  const emptyReadings = { heartRate: null, heartRateHistory: [], measurementHistory: [], oxygenSaturation: null, bodyTemperature: null }
  if (typeof window === 'undefined') return emptyReadings
  try {
    const stored = window.localStorage.getItem(storageKey)
    if (!stored) return emptyReadings

    const parsed: unknown = JSON.parse(stored)
    if (!parsed || typeof parsed !== 'object') return emptyReadings
    const data = parsed as { heartRate?: unknown; heartRateHistory?: unknown; measurementHistory?: unknown; oxygenSaturation?: unknown; bodyTemperature?: unknown }
    const allReadings = Array.isArray(data.measurementHistory)
      ? data.measurementHistory.filter(isWearableReading)
      : Array.isArray(data.heartRateHistory)
        ? data.heartRateHistory.filter(isWearableReading)
        : []
    const sortedReadings = sortReadingsByTime(allReadings)
    const heartRateHistory = sortedReadings.filter((reading) => reading.metric === 'heart_rate')
    const heartRate = isWearableReading(data.heartRate)
      ? data.heartRate
      : heartRateHistory[heartRateHistory.length - 1] ?? null

    return {
      heartRate: heartRate?.metric === 'heart_rate' ? heartRate : null,
      heartRateHistory,
      measurementHistory: sortedReadings,
      oxygenSaturation: sortedReadings.filter((reading) => reading.metric === 'spo2').at(-1) ?? (isWearableReading(data.oxygenSaturation) && data.oxygenSaturation.metric === 'spo2' ? data.oxygenSaturation : null),
      bodyTemperature: sortedReadings.filter((reading) => reading.metric === 'body_temperature').at(-1) ?? (isWearableReading(data.bodyTemperature) && data.bodyTemperature.metric === 'body_temperature' ? data.bodyTemperature : null),
    }
  } catch {
    return emptyReadings
  }
}

function decodeSfloat(value: number) {
  let mantissa = value & 0x0fff
  if (mantissa & 0x0800) mantissa -= 0x1000
  let exponent = (value >> 12) & 0x0f
  if (exponent & 0x08) exponent -= 0x10
  return mantissa * 10 ** exponent
}

export class WearableService {
  private snapshot: WearableSnapshot = { ...initialSnapshot, ...loadStoredReadings() }
  private device: BluetoothDevice | null = null
  private heartRateCharacteristic: BluetoothCharacteristic | null = null
  private batteryCharacteristic: BluetoothCharacteristic | null = null
  private listeners = new Set<(snapshot: WearableSnapshot) => void>()

  get currentSnapshot() {
    return this.snapshot
  }

  get bluetoothSupported() {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator
  }

  subscribe(listener: (snapshot: WearableSnapshot) => void) {
    this.listeners.add(listener)
    listener(this.snapshot)
    return () => this.listeners.delete(listener)
  }

  async connect() {
    const bluetooth = (navigator as Navigator & { bluetooth?: BluetoothApi }).bluetooth
    if (!bluetooth) {
      this.update({ status: 'error', error: 'Web Bluetooth is unsupported in this browser. Use a compatible browser on localhost or HTTPS.' })
      return
    }

    this.update({ ...this.snapshot, status: 'searching', batteryPercent: null, error: null })
    let connectionStage: 'device selection' | 'GATT connection' | 'heart-rate service' = 'device selection'
    try {
      const device = await bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['heart_rate', 'battery_service', 'pulse_oximeter', 'health_thermometer'],
      })
      this.device = device
      this.update({ status: 'connecting', deviceId: device.id, deviceName: device.name ?? 'Bluetooth heart-rate device', batteryPercent: null, error: null })
      device.addEventListener('gattserverdisconnected', this.handleDisconnect)

      if (!device.gatt) throw new Error('This device does not expose Bluetooth LE health services. Being paired for audio in Windows does not make health measurements available to the browser.')
      connectionStage = 'GATT connection'
      const server = await device.gatt.connect()
      connectionStage = 'heart-rate service'
      const heartRateService = await server.getPrimaryService('heart_rate')
      const measurement = await heartRateService.getCharacteristic('heart_rate_measurement')
      this.heartRateCharacteristic = measurement
      measurement.addEventListener('characteristicvaluechanged', this.handleHeartRate)
      let heartRateNotificationsStarted = false
      try {
        await measurement.startNotifications()
        heartRateNotificationsStarted = true
      } catch (error) {
        if (!measurement.properties?.read) throw error
      }
      if (measurement.properties?.read) {
        try {
          this.handleHeartRateValue(await measurement.readValue())
        } catch {
          if (!heartRateNotificationsStarted) throw new Error('The watch exposes heart rate but does not allow reading or notifications.')
        }
      }
      await this.startOptionalNotifications(server, 'pulse_oximeter', ['plx_continuous_measurement', 'plx_spot_check_measurement'], this.handleOxygenSaturation)
      await this.startOptionalNotifications(server, 'health_thermometer', ['temperature_measurement'], this.handleBodyTemperature)

      try {
        const batteryService = await server.getPrimaryService('battery_service')
        const battery = await batteryService.getCharacteristic('battery_level')
        this.batteryCharacteristic = battery
        battery.addEventListener('characteristicvaluechanged', this.handleBatteryLevel)
        if (battery.properties?.notify || battery.properties?.indicate) {
          try {
            await battery.startNotifications()
          } catch {
            // Use a readable value if notifications are not available.
          }
        }
        if (battery.properties?.read) this.handleBatteryValue(await battery.readValue())
      } catch {
        if (!this.batteryCharacteristic) this.update({ batteryPercent: null })
      }

      this.update({ status: 'connected', error: null })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to connect to this device.'
      const errorName = error instanceof DOMException ? error.name : ''
      const unsupportedDevice = this.device && connectionStage === 'heart-rate service' && errorName === 'NotFoundError'
      const selectedName = this.device?.name ?? 'Selected device'
      const connectionMessage = errorName === 'NetworkError'
        ? `Could not open the Bluetooth LE connection to ${selectedName}. It may be connected to Windows or another app, out of range, or asleep. Disconnect it from other apps and Windows Bluetooth settings, keep it nearby and awake, then try again. Browser detail: ${message}`
        : errorName === 'NotAllowedError'
          ? `Bluetooth access to ${selectedName} was cancelled or denied. Select the device and allow access when the browser asks.`
          : errorName === 'SecurityError'
            ? `The browser blocked Bluetooth access to ${selectedName}. Open RuralCare in Chrome or Edge on localhost or HTTPS and allow Bluetooth access. Browser detail: ${message}`
            : message
      this.device?.removeEventListener('gattserverdisconnected', this.handleDisconnect)
      this.device?.gatt?.disconnect()
      this.device = null
      this.update({
        status: 'error',
        error: unsupportedDevice
          ? `${selectedName} connected, but does not expose the standard Bluetooth heart-rate service. Use a supported heart-rate device or the manufacturer's health-data bridge. Browser detail: ${message}`
          : connectionMessage,
      })
    }
  }

  disconnect() {
    this.device?.removeEventListener('gattserverdisconnected', this.handleDisconnect)
    this.device?.gatt?.disconnect()
    this.device = null
    this.heartRateCharacteristic = null
    this.batteryCharacteristic = null
    this.update({ status: 'not-connected', batteryPercent: null, error: null })
  }

  private handleDisconnect = () => {
    this.device = null
    this.heartRateCharacteristic = null
    this.batteryCharacteristic = null
    this.update({ status: 'not-connected', batteryPercent: null, error: 'Device disconnected.' })
  }

  private handleHeartRate = (event: Event) => {
    const characteristic = event.target as BluetoothCharacteristic
    if (characteristic.value) this.handleHeartRateValue(characteristic.value)
  }

  private handleHeartRateValue(data: DataView) {
    if (!data || data.byteLength < 2) return

    const flags = data.getUint8(0)
    if (flags & 0x01 && data.byteLength < 3) return
    const value = flags & 0x01 ? data.getUint16(1, true) : data.getUint8(1)
    if (!Number.isInteger(value) || value <= 0 || value > 65535) {
      this.update({ error: 'Invalid measurement received from device.' })
      return
    }

    const reading: WearableReading = {
      metric: 'heart_rate',
      value,
      unit: 'bpm',
      source: this.snapshot.deviceName ?? 'Bluetooth heart-rate device',
      receivedAt: new Date().toISOString(),
    }
    this.recordReading(reading)
  }

  private handleBatteryLevel = (event: Event) => {
    const characteristic = event.target as BluetoothCharacteristic
    if (characteristic.value) this.handleBatteryValue(characteristic.value)
  }

  private handleBatteryValue(data: DataView) {
    if (data.byteLength < 1) return
    const batteryPercent = data.getUint8(0)
    this.update({ batteryPercent: batteryPercent <= 100 ? batteryPercent : null })
  }

  async sync() {
    if (this.snapshot.status !== 'connected') return 'Connect your device before syncing measurements.'

    let refreshed = false
    if (this.heartRateCharacteristic?.properties?.read) {
      try {
        this.handleHeartRateValue(await this.heartRateCharacteristic.readValue())
        refreshed = true
      } catch {
        // A fresh notification may still arrive from a notify-only sensor.
      }
    }
    if (this.batteryCharacteristic?.properties?.read) {
      try {
        this.handleBatteryValue(await this.batteryCharacteristic.readValue())
        refreshed = true
      } catch {
        // Battery notifications may still update the displayed level.
      }
    }

    return refreshed
      ? 'Read the latest values available from the device.'
      : 'Waiting for the watch to send a measurement. Wear it snugly and keep it awake.'
  }

  private async startOptionalNotifications(server: BluetoothServer, serviceId: string, characteristicIds: string[], listener: (event: Event) => void) {
    let service: BluetoothService
    try {
      service = await server.getPrimaryService(serviceId)
    } catch {
      return
    }

    for (const characteristicId of characteristicIds) {
      try {
        const characteristic = await service.getCharacteristic(characteristicId)
        characteristic.addEventListener('characteristicvaluechanged', listener)
        await characteristic.startNotifications()
        return
      } catch {
        continue
      }
    }
  }

  private handleOxygenSaturation = (event: Event) => {
    const characteristic = event.target as BluetoothCharacteristic
    const data = characteristic.value
    if (!data || data.byteLength < 3) return

    const value = decodeSfloat(data.getUint16(1, true))
    if (!Number.isFinite(value) || value < 0 || value > 100) return

    this.recordReading({
      metric: 'spo2',
      value,
      unit: '%',
      source: this.snapshot.deviceName ?? 'Bluetooth pulse oximeter',
      receivedAt: new Date().toISOString(),
    })
  }

  private handleBodyTemperature = (event: Event) => {
    const characteristic = event.target as BluetoothCharacteristic
    const data = characteristic.value
    if (!data || data.byteLength < 5) return

    let mantissa = data.getUint8(1) | data.getUint8(2) << 8 | data.getUint8(3) << 16
    if (mantissa & 0x800000) mantissa -= 0x1000000
    const rawValue = mantissa * 10 ** data.getInt8(4)
    const value = data.getUint8(0) & 0x01 ? (rawValue - 32) * 5 / 9 : rawValue
    if (!Number.isFinite(value) || value < 25 || value > 45) return

    this.recordReading({
      metric: 'body_temperature',
      value: Number(value.toFixed(1)),
      unit: '°C',
      source: this.snapshot.deviceName ?? 'Bluetooth thermometer',
      receivedAt: new Date().toISOString(),
    })
  }

  private recordReading(reading: WearableReading) {
    const measurementHistory = sortReadingsByTime([...this.snapshot.measurementHistory, reading]).slice(-200)
    const heartRateHistory = measurementHistory.filter((entry) => entry.metric === 'heart_rate').slice(-1000)
    const heartRate = measurementHistory.filter((entry) => entry.metric === 'heart_rate').at(-1) ?? null
    const oxygenSaturation = measurementHistory.filter((entry) => entry.metric === 'spo2').at(-1) ?? null
    const bodyTemperature = measurementHistory.filter((entry) => entry.metric === 'body_temperature').at(-1) ?? null

    this.update({
      heartRate: heartRate && heartRate.metric === 'heart_rate' ? heartRate : this.snapshot.heartRate,
      heartRateHistory,
      measurementHistory,
      oxygenSaturation: oxygenSaturation && oxygenSaturation.metric === 'spo2' ? oxygenSaturation : this.snapshot.oxygenSaturation,
      bodyTemperature: bodyTemperature && bodyTemperature.metric === 'body_temperature' ? bodyTemperature : this.snapshot.bodyTemperature,
      error: null,
    })
  }

  private update(patch: Partial<WearableSnapshot>) {
    this.snapshot = { ...this.snapshot, ...patch }
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({
        heartRate: this.snapshot.heartRate,
        heartRateHistory: this.snapshot.heartRateHistory,
        measurementHistory: this.snapshot.measurementHistory,
        oxygenSaturation: this.snapshot.oxygenSaturation,
        bodyTemperature: this.snapshot.bodyTemperature,
      }))
    } catch {
      // Keep live measurements available if browser storage is unavailable.
    }
    this.listeners.forEach((listener) => listener(this.snapshot))
  }
}

export const wearableService = new WearableService()
