# Tonnetz-Torus-Synth

An interactive synthesis system that blends 3D visuals with reaction–diffusion simulations and a musical Tonnetz grid. Built with Web Audio API and Three.js, the project offers multiple synthesis options and both monophonic and harmony modes.

## Features
- **Reaction–Diffusion Simulation:** Uses a Gray–Scott model to generate evolving organic textures.
- **Tonnetz Grid Visualization:** Displays harmonic relationships in a 6×12 grid.
- **Sound Synthesis:** Multiple instrument options:
  - **Basic Synth:** Sine, square, triangle, and sawtooth waveforms.
  - **FM Synth, Bell, and Organ:** Unique sound synthesis methods.
- **Modes:** 
  - **Single Note:** Interpolates the three closest grid points into a single note.
  - **Harmony:** Plays all three candidate notes simultaneously, with weighted volumes.
- **3D View:** Uses Three.js to map the simulation texture onto a rotating torus.

## Navigation
- **Instrument Page:** [instrument.html](instrument.html)
- **Presentation Page:** [presentation.html](presentation.html)
- **In Progress:** [in_progress.html](in_progress.html)
- **Next Steps:** [next_steps.html](next_steps.html)

## Sources:
- https://thatsmaths.com/2017/12/28/doughnuts-and-tonnetze/
- I used AI for some parts of this repository