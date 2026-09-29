# Pelvic Range of Motion (ROM) Assessment System

A real-time clinical assessment tool for tracking pelvic biomechanics including sagittal tilt, lateral inclination, and axial rotation.

## Features

- **Real-time ROM Monitoring**: Track anterior/posterior tilt, lateral inclination, and rotation
- **3D Visualization**: Dynamic pelvis orientation feedback with 3D transforms
- **Clinical Standards**: Built-in normative ranges and clinical verdicts
- **Data Logging**: Record and export measurement history as CSV
- **Interactive Testing**: Slider-based sensor simulation for testing and training

## How to Use

### Local Development (VS Code)

1. Clone the repository:
   ```bash
   git clone https://github.com/sanvatsarkarvaibhav7-tech/pelvic-rom-system.git
   cd pelvic-rom-system
   ```

2. Open in VS Code and install the **Live Server** extension

3. Right-click `pelvic_rom_website_PRD-0001/index.html` and select **"Open with Live Server"**

4. The app will open at `http://127.0.0.1:5500/pelvic_rom_website_PRD-0001/index.html`

### Online

Visit: [pelvic-rom-system GitHub Pages](https://sanvatsarkarvaibhav7-tech.github.io/pelvic-rom-system/pelvic_rom_website_PRD-0001/)

## File Structure

```
pelvic_rom_website_PRD-0001/
├── index.html      # Main app page
├── style.css       # Styling (dark theme, responsive)
└── script.js       # Interactivity & state management
```

## Technical Stack

- **HTML5** — Semantic markup with meta tags
- **CSS3** — CSS Grid, Flexbox, CSS variables, 3D transforms
- **JavaScript (Vanilla)** — No dependencies, pure DOM manipulation

## Clinical Ranges

| Plane | Normal Range | Warning |
|-------|-------------|---------|
| Sagittal (Tilt) | ±7° | >12° or <-8° |
| Frontal (Obliquity) | ±3° | >5° |
| Transverse (Rotation) | ±25° | Shown for reference |

## Features in Detail

- **Metric Cards**: Display live angle values with color-coded badges
- **Progress Bars**: Visual representation of angle ranges
- **3D Pelvis Avatar**: Real-time rotation based on input values
- **Sensor Adjuster**: Range sliders to simulate ROM data
- **History Table**: Timestamped record of all measurements
- **CSV Export**: Download measurement history for analysis

## License

MIT

---

Built for clinical pelvic biomechanics assessment.
