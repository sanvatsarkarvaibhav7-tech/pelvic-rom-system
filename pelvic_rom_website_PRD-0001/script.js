// ===== URL PARAMETER: Get Device ID from QR Code =====
const params = new URLSearchParams(window.location.search);
const DEVICE_ID_FROM_QR = params.get("device") || null;

// State management
let state = {
  deviceId: DEVICE_ID_FROM_QR,
  patientData: null,
  sagittal: 0.0,
  frontal: 0.0,
  rotation: 0.0,
  isTracking: false,
  records: [],
  scannerActive: false,
  videoStream: null
};

// ===== QR SCANNER & DEVICE CONNECTION =====
const scannerModal = document.getElementById('scanner-modal');
const patientModal = document.getElementById('patient-modal');
const dashboardContent = document.getElementById('dashboard-content');

const btnStartScan = document.getElementById('btn-start-scan');
const btnManualDevice = document.getElementById('btn-manual-device');
const btnConfirmDevice = document.getElementById('btn-confirm-device');
const manualDeviceForm = document.getElementById('manual-device-form');
const manualDeviceInput = document.getElementById('manual-device-id');
const scannerVideo = document.getElementById('scanner-video');

// If device ID came from QR code URL, skip scanner and go straight to patient form
if (DEVICE_ID_FROM_QR) {
  setTimeout(() => {
    processDeviceId(DEVICE_ID_FROM_QR);
  }, 500);
}

// Start Camera for QR Scanning
btnStartScan.addEventListener('click', async () => {
  try {
    state.videoStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }
    });
    scannerVideo.srcObject = state.videoStream;
    state.scannerActive = true;
    btnStartScan.disabled = true;
    btnStartScan.textContent = '📹 Camera Active...';
    scanQRCode();
  } catch (err) {
    alert('Camera access denied or not available. Please enter Device ID manually.');
    manualDeviceForm.style.display = 'block';
  }
});

// Scan QR Code
function scanQRCode() {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  const scan = () => {
    if (!state.scannerActive) return;
    
    if (scannerVideo.readyState === scannerVideo.HAVE_ENOUGH_DATA) {
      canvas.width = scannerVideo.videoWidth;
      canvas.height = scannerVideo.videoHeight;
      context.drawImage(scannerVideo, 0, 0, canvas.width, canvas.height);
      
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      
      if (code) {
        state.scannerActive = false;
        if (state.videoStream) {
          state.videoStream.getTracks().forEach(track => track.stop());
        }
        
        // Extract device ID from QR code URL
        // Expected format: https://...?device=PRD-0001
        const url = new URL(code.data);
        const deviceId = url.searchParams.get('device') || code.data;
        processDeviceId(deviceId);
      }
    }
    requestAnimationFrame(scan);
  };
  scan();
}

// Manual Device ID Entry
btnManualDevice.addEventListener('click', () => {
  manualDeviceForm.style.display = manualDeviceForm.style.display === 'none' ? 'block' : 'none';
});

btnConfirmDevice.addEventListener('click', () => {
  const deviceId = manualDeviceInput.value.trim();
  if (deviceId) {
    processDeviceId(deviceId);
  } else {
    alert('Please enter a valid Device ID');
  }
});

// Process Device ID and Move to Patient Registration
function processDeviceId(deviceId) {
  state.deviceId = deviceId;
  
  // Update device display
  document.getElementById('device-id-display').textContent = deviceId;
  document.getElementById('device-status-text').textContent = 'Connected: ' + deviceId;
  document.getElementById('device-status').style.background = '#10b981';
  
  // Hide scanner, show patient form
  scannerModal.style.display = 'none';
  patientModal.style.display = 'flex';
  
  // Auto-set current date/time
  const now = new Date();
  const dateString = now.toISOString().slice(0, 16);
  document.getElementById('patient-date').value = dateString;
  
  // Focus on name field
  setTimeout(() => {
    document.getElementById('patient-name').focus();
  }, 100);
}

// ===== PATIENT REGISTRATION =====
const patientForm = document.getElementById('patient-form');

patientForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const patientName = document.getElementById('patient-name').value;
  const patientGender = document.getElementById('patient-gender').value;
  const patientAge = document.getElementById('patient-age').value;
  const patientDate = document.getElementById('patient-date').value;
  
  if (!patientName || !patientGender || !patientAge) {
    alert('Please fill in all required fields');
    return;
  }
  
  state.patientData = {
    name: patientName,
    gender: patientGender,
    age: patientAge,
    dateTime: patientDate,
    startTime: new Date().toISOString()
  };
  
  // Update sidebar with patient info
  document.getElementById('patient-name-display').textContent = patientName;
  document.getElementById('patient-details-display').textContent = `${patientGender}, ${patientAge} yrs | ${patientDate}`;
  document.getElementById('patient-info-sidebar').style.display = 'block';
  
  // Hide patient modal, show dashboard
  patientModal.style.display = 'none';
  dashboardContent.style.display = 'block';
  
  // Connect to ESP32 (optional websocket)
  connectToESP32(state.deviceId);
  
  updateUI();
});

// ===== ESP32 CONNECTION (WebSocket) =====
let esp32WebSocket = null;

function connectToESP32(deviceId) {
  // Example WebSocket connection for local ESP32
  // Format: ws://esp32-PRD-0001.local:81/
  // Or use: ws://192.168.x.x:81/ (replace with actual IP)
  
  const wsUrls = [
    `ws://esp32-${deviceId}.local:81/`,
    `ws://esp32-${deviceId}:81/`
  ];
  
  function attemptConnection(urls, index) {
    if (index >= urls.length) {
      console.log('WebSocket not available, using manual sliders');
      return;
    }
    
    try {
      const wsUrl = urls[index];
      esp32WebSocket = new WebSocket(wsUrl);
      
      esp32WebSocket.onopen = () => {
        console.log('Connected to ESP32:', deviceId);
      };
      
      esp32WebSocket.onmessage = (event) => {
        // Expected JSON: {"sagittal": 5.2, "frontal": 1.8, "rotation": -0.5}
        try {
          const data = JSON.parse(event.data);
          if (data.sagittal !== undefined) {
            state.sagittal = parseFloat(data.sagittal);
          }
          if (data.frontal !== undefined) {
            state.frontal = parseFloat(data.frontal);
          }
          if (data.rotation !== undefined) {
            state.rotation = parseFloat(data.rotation);
          }
          updateUI();
        } catch (e) {
          console.log('Invalid JSON from ESP32');
        }
      };
      
      esp32WebSocket.onerror = () => {
        attemptConnection(urls, index + 1);
      };
      
      esp32WebSocket.onclose = () => {
        setTimeout(() => attemptConnection(urls, 0), 5000);
      };
    } catch (err) {
      attemptConnection(urls, index + 1);
    }
  }
  
  attemptConnection(wsUrls, 0);
}

// Send data to ESP32
function sendToESP32(data) {
  if (esp32WebSocket && esp32WebSocket.readyState === WebSocket.OPEN) {
    esp32WebSocket.send(JSON.stringify(data));
  }
}

// ===== UI CONTROLS & SLIDERS =====
const sliderSagittal = document.getElementById('slider-sagittal');
const sliderFrontal = document.getElementById('slider-frontal');
const sliderRotation = document.getElementById('slider-rotation');

const lblSagittal = document.getElementById('lbl-sagittal');
const lblFrontal = document.getElementById('lbl-frontal');
const lblRotation = document.getElementById('lbl-rotation');

const valSagittal = document.getElementById('val-sagittal');
const valFrontal = document.getElementById('val-frontal');
const valRotation = document.getElementById('val-rotation');

const barSagittal = document.getElementById('bar-sagittal');
const barFrontal = document.getElementById('bar-frontal');
const barRotation = document.getElementById('bar-rotation');

const badgeSagittal = document.getElementById('badge-sagittal');
const badgeFrontal = document.getElementById('badge-frontal');
const badgeRotation = document.getElementById('badge-rotation');

const pelvisVisual = document.getElementById('pelvis-visual');
const historyRows = document.getElementById('history-rows');

const btnToggleTracking = document.getElementById('btn-toggle-tracking');
const btnRecalibrate = document.getElementById('btn-recalibrate');
const btnSaveRecord = document.getElementById('btn-save-record');
const btnExportCSV = document.getElementById('btn-export-csv');
const btnChangeDevice = document.getElementById('btn-change-device');

// Clinical Verdict Function
function getVerdict(sagittal, frontal) {
  if (Math.abs(sagittal) <= 7 && Math.abs(frontal) <= 3) {
    return { label: 'Optimal Alignment', class: 'normal' };
  }
  if (sagittal > 12) {
    return { label: 'Excessive Anterior Tilt', class: 'warning' };
  }
  if (sagittal < -8) {
    return { label: 'Posterior Tilt Deficiency', class: 'warning' };
  }
  if (Math.abs(frontal) > 5) {
    return { label: 'Pelvic Obliquity / Drop', class: 'warning' };
  }
  return { label: 'Mild Asymmetry', class: 'normal' };
}

// Update UI displays based on state
function updateUI() {
  // Numeric Displays
  valSagittal.textContent = (state.sagittal >= 0 ? '+' : '') + state.sagittal.toFixed(1);
  valFrontal.textContent = (state.frontal >= 0 ? '+' : '') + state.frontal.toFixed(1);
  valRotation.textContent = (state.rotation >= 0 ? '+' : '') + state.rotation.toFixed(1);

  // Slider labels
  lblSagittal.textContent = `${state.sagittal.toFixed(1)}°`;
  lblFrontal.textContent = `${state.frontal.toFixed(1)}°`;
  lblRotation.textContent = `${state.rotation.toFixed(1)}°`;

  // Dynamic Progress Bars (scaled 0% to 100%)
  barSagittal.style.width = `${((state.sagittal + 30) / 60) * 100}%`;
  barFrontal.style.width = `${((state.frontal + 20) / 40) * 100}%`;
  barRotation.style.width = `${((state.rotation + 25) / 50) * 100}%`;

  // Status Badges
  badgeSagittal.textContent = Math.abs(state.sagittal) <= 7 ? 'Normal' : state.sagittal > 0 ? 'Ant. Tilt' : 'Post. Tilt';
  badgeSagittal.className = `badge ${Math.abs(state.sagittal) <= 10 ? 'normal' : 'warning'}`;

  badgeFrontal.textContent = Math.abs(state.frontal) <= 3 ? 'Balanced' : 'Tilted';
  badgeFrontal.className = `badge ${Math.abs(state.frontal) <= 4 ? 'normal' : 'warning'}`;

  badgeRotation.textContent = 'Centered';

  // 3D Visualizer Transform
  pelvisVisual.style.transform = `
    rotateX(${-state.sagittal}deg)
    rotateZ(${-state.frontal}deg)
    rotateY(${state.rotation}deg)
  `;
}

// Event Listeners for Sliders
function handleSliderChange() {
  state.sagittal = parseFloat(sliderSagittal.value);
  state.frontal = parseFloat(sliderFrontal.value);
  state.rotation = parseFloat(sliderRotation.value);
  updateUI();
}

sliderSagittal.addEventListener('input', handleSliderChange);
sliderFrontal.addEventListener('input', handleSliderChange);
sliderRotation.addEventListener('input', handleSliderChange);

// Recalibrate (Reset to 0)
btnRecalibrate.addEventListener('click', () => {
  sliderSagittal.value = 0;
  sliderFrontal.value = 0;
  sliderRotation.value = 0;
  handleSliderChange();
});

// Toggle Tracking Session Mock
btnToggleTracking.addEventListener('click', () => {
  state.isTracking = !state.isTracking;
  if (state.isTracking) {
    btnToggleTracking.innerHTML = '<i class="fa-solid fa-stop"></i> Stop Assessment';
    btnToggleTracking.style.backgroundColor = 'var(--danger)';
  } else {
    btnToggleTracking.innerHTML = '<i class="fa-solid fa-play"></i> Start Assessment';
    btnToggleTracking.style.backgroundColor = 'var(--primary)';
  }
});

// Save Measurement to Table with Full Timestamp
btnSaveRecord.addEventListener('click', () => {
  const now = new Date();
  const timestamp = now.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
  
  const verdict = getVerdict(state.sagittal, state.frontal);
  const entry = {
    time: timestamp,
    sagittal: state.sagittal.toFixed(1),
    frontal: state.frontal.toFixed(1),
    rotation: state.rotation.toFixed(1),
    verdict: verdict.label
  };

  state.records.unshift(entry);

  const row = document.createElement('tr');
  row.innerHTML = `
    <td>${entry.time}</td>
    <td>${entry.sagittal}°</td>
    <td>${entry.frontal}°</td>
    <td>${entry.rotation}°</td>
    <td><span class="badge ${verdict.class}">${entry.verdict}</span></td>
  `;
  historyRows.prepend(row);
});

// Export Log as CSV with Complete Patient Info and Timestamps
btnExportCSV.addEventListener('click', () => {
  if (!state.patientData || state.records.length === 0) {
    alert('Please record at least one measurement before exporting.');
    return;
  }
  
  let csvContent = "data:text/csv;charset=utf-8,";
  
  // Add patient header section
  csvContent += `Patient Information\n`;
  csvContent += `Patient Name,${state.patientData.name}\n`;
  csvContent += `Gender,${state.patientData.gender}\n`;
  csvContent += `Age,${state.patientData.age} years\n`;
  csvContent += `Device ID,${state.deviceId}\n`;
  csvContent += `Assessment Date,${state.patientData.dateTime}\n`;
  csvContent += `Session Start,${state.patientData.startTime}\n`;
  csvContent += `\n`;
  csvContent += `Measurement Records\n`;
  csvContent += `Timestamp,Sagittal Tilt (°),Lateral Obliquity (°),Axial Rotation (°),Clinical Verdict\n`;
  
  state.records.forEach(r => {
    csvContent += `${r.time},${r.sagittal},${r.frontal},${r.rotation},"${r.verdict}"\n`;
  });
  
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  
  const timestamp = new Date().getTime();
  const filename = `pelvic_rom_${state.deviceId}_${state.patientData.name.replace(/\s+/g, '_')}_${timestamp}.csv`;
  link.setAttribute('download', filename);
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

// Change Device (Reset to Scanner)
btnChangeDevice.addEventListener('click', () => {
  state.deviceId = null;
  state.patientData = null;
  state.records = [];
  historyRows.innerHTML = '';
  
  if (esp32WebSocket) {
    esp32WebSocket.close();
  }
  
  dashboardContent.style.display = 'none';
  scannerModal.style.display = 'flex';
  patientModal.style.display = 'none';
  
  btnStartScan.disabled = false;
  btnStartScan.textContent = '<i class="fa-solid fa-camera"></i> Start Camera';
  manualDeviceForm.style.display = 'none';
  manualDeviceInput.value = '';
});

// Initialize on Load
updateUI();
