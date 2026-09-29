// State management
let state = {
  sagittal: 0.0,
  frontal: 0.0,
  rotation: 0.0,
  isTracking: false,
  records: []
};

// UI Elements
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

// Calculation & Norm Ranges (Clinical Standards)
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

// Save Measurement to Table
btnSaveRecord.addEventListener('click', () => {
  const timestamp = new Date().toLocaleTimeString();
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

// Export Log as CSV
btnExportCSV.addEventListener('click', () => {
  if (state.records.length === 0) {
    alert('No data entries recorded to export.');
    return;
  }
  let csvContent = "data:text/csv;charset=utf-8,Timestamp,SagittalTilt,LateralObliquity,AxialRotation,Verdict\n";
  state.records.forEach(r => {
    csvContent += `${r.time},${r.sagittal},${r.frontal},${r.rotation},"${r.verdict}"\n`;
  });
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', 'pelvic_rom_dataset.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

// Initialize on Load
updateUI();