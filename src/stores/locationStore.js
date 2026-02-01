import { defineStore } from 'pinia'
import { ref } from 'vue'

const calculateDist = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export const useLocationStore = defineStore('location', () => {
  const coords = ref({ latitude: null, longitude: null })
  const accuracy = ref(Infinity)
  const isReady = ref(false)
  const isLoading = ref(false)
  const satelliteReady = ref(false)
  const permissionDenied = ref(false)
  const gpsTurnedOff = ref(false)
  const isFakeGps = ref(false)
  const signalSource = ref('Mencari...')

  let watchIdLow = null
  let watchIdHigh = null
  let heartbeatId = null
  let lastTimestamp = 0

  const startTracking = () => {
    if (!navigator.geolocation) return
    if (watchIdLow || watchIdHigh) return

    permissionDenied.value = false
    gpsTurnedOff.value = false
    isFakeGps.value = false
    satelliteReady.value = false
    signalSource.value = 'Mencari...'
    accuracy.value = Infinity

    if (!coords.value.latitude) {
      isLoading.value = true
    }

    console.log('🚀 Memulai Tracking Agresif...')

    // === TEKNIK 1: RELAY ===
    watchIdLow = navigator.geolocation.watchPosition(
      (pos) => {
        processSignal(pos, 'wifi')
        stopHeartbeat()
        triggerSatellite()
      },
      (err) => handleGeoError(err),
      { enableHighAccuracy: false, maximumAge: 0, timeout: 5000 },
    )

    // === TEKNIK 2: HEARTBEAT (PACU JANTUNG) ===
    if (heartbeatId) clearInterval(heartbeatId)

    heartbeatId = setInterval(() => {
      if (isReady.value) {
        stopHeartbeat()
        return
      }

      console.log('💓 Heartbeat: Mengecek lokasi ulang...')
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          console.log('⚡ Heartbeat Berhasil!')
          processSignal(pos, 'pulse')
          stopHeartbeat()
          triggerSatellite()
        },
        (err) => {
          console.log('Heartbeat miss waiting...')
        },
        { maximumAge: 0, timeout: 1500, enableHighAccuracy: false },
      )
    }, 2000)
  }

  const stopHeartbeat = () => {
    if (heartbeatId) {
      clearInterval(heartbeatId)
      heartbeatId = null
    }
  }

  // === TAHAP 2: SATELIT (BACKGROUND) ===
  const triggerSatellite = () => {
    if (watchIdHigh) return

    console.log('🛰️ Trigger Satelit Background...')
    watchIdHigh = navigator.geolocation.watchPosition(
      (pos) => processSignal(pos, 'satelit'),
      (err) => console.warn('Satelit wait:', err.message),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    )
  }

  const processSignal = (pos, source) => {
    if (source !== 'cache') {
      if (detectFakeGps(pos)) {
        isFakeGps.value = true
        return
      }
    }
    isFakeGps.value = false

    const newAccuracy = Math.round(pos.coords.accuracy)
    const currentAccuracy = accuracy.value
    const currentSource = signalSource.value

    let shouldUpdate = false

    if (isLoading.value) {
      shouldUpdate = true
    } else if (currentSource === 'Pre-Load' && source !== 'cache') {
      shouldUpdate = true
    } else if (source !== 'cache') {
      if (newAccuracy <= currentAccuracy) {
        shouldUpdate = true
      }
    }

    if (shouldUpdate) {
      updateState(pos, source, newAccuracy)
    }
  }

  const detectFakeGps = (pos) => {
    const now = Date.now()
    if (pos.timestamp < now - 60000 && accuracy.value !== Infinity) return true

    if (coords.value.latitude && lastTimestamp > 0) {
      const timeDiff = (now - lastTimestamp) / 1000
      const dist = calculateDist(
        coords.value.latitude,
        coords.value.longitude,
        pos.coords.latitude,
        pos.coords.longitude,
      )
      if (timeDiff > 0 && dist / timeDiff > 300) {
        return true
      }
    }
    lastTimestamp = now
    return false
  }

  const updateState = (pos, source, newAcc) => {
    const { latitude, longitude } = pos.coords

    coords.value = { latitude, longitude }
    accuracy.value = newAcc

    if (source === 'pulse') {
      signalSource.value = 'wifi'
    } else {
      signalSource.value = source
    }

    if (source === 'satelit' && newAcc < 50) {
      satelliteReady.value = true
    }

    gpsTurnedOff.value = false
    isLoading.value = false
    isReady.value = true

    stopHeartbeat()
  }

  const handleGeoError = (err) => {
    if (err.code === 1) {
      permissionDenied.value = true
      isLoading.value = false
      stopHeartbeat()
    } else if (err.code === 2) {
      if (!isReady.value) {
        gpsTurnedOff.value = true
        isLoading.value = false
      }
    }
  }

  const stopTracking = () => {
    if (watchIdLow) {
      navigator.geolocation.clearWatch(watchIdLow)
      watchIdLow = null
    }
    if (watchIdHigh) {
      navigator.geolocation.clearWatch(watchIdHigh)
      watchIdHigh = null
    }
    stopHeartbeat()
    signalSource.value = 'Mencari...'
  }

  return {
    coords,
    accuracy,
    isReady,
    isLoading,
    permissionDenied,
    gpsTurnedOff,
    isFakeGps,
    signalSource,
    satelliteReady,
    startTracking,
    stopTracking,
  }
})
