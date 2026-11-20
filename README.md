# Kai's PT2 Rating System

This is a browser-based tool that calculates the final TPS and rating from a custom Piano Tiles 2 score (`song.json`).
No build is required; simply open `index.html` in your browser to run it.

## How to use

1. 
2. Drop your `song.json` 
3. Enter your **Final Score**
4. The final TPS and rating will be displayed

- Ratings will not be displayed until `song.json` is loaded.
- You can manually override the star's BPM and basebeats in **TPS Settings (Optional)** (automatic detection if left blank).
- **Score per Lap** is automatically detected. If there are wrong, you can manually override them.

## Rating

This tool calculates from `song.json` and assigns a rating based on the difficulty level.
The higher your rating, the more you are goated lol

| Type            | Rating Mass (w) |
|-----------------|-----------------|
| Single          | 1               |
| Long (Length:L) | 1 + ρ + β·ln(L) |
| Special         | ω × score       |
| Stamina         | ...             |

- Stamina increases the longer you handle tiles and recovers when you rest. It increases the longer the time elapsed (regardless of the sheet music).

```
Singles / Longs / Specials = K × (W / ScorePerLap) × FinalTPS    （W = sum of w）
Stamina  = K × max_k [ F_k / τ × (1 + γ·ln(1 + t_k / T0)) ]
           F ← F + w（when the tile comes）、F ← F × exp(−dt/τ)（decrease based on rest）
Overall  = (Singles³ + Longs³ + Specials³ + Stamina³)^(1/3)
```

### Constant for the rating adjustment （`js/rating-config.js`）

| Constant   | Value  | Meaning |
|------------|--------|------|
| ρ（RHO）   | 0.5    | base Long cost |
| β（BETA）  | 0.3    | Long Length cost |
| τ（TAU）   | 20     | Fatigue time constant (seconds) |
| γ（GAMMA） | 0.005  | Intensity of fatigue increase with elapsed time |
| p（P）     | 3      | p-norm |
| K          |  1     | Calibration factor |
| ω（OMEGA） | 2:1, 3:1, 5:1, 6:1.2, 7:1.5, 8:1.5, 9:1, 10:1.3 | Special Type |

All values ​​are temporary, and calibration to match existing scores has not yet been done.

## Files

```
index.html           Main
css/styles.css       Display
js/                  
  constants.js         Beats
  rating-color.js      Rating text col
  rating-config.js     Rating func
  dom-state.js         song.json data
  tps.js               TPS increase
  tile-scoring.js      Tile score
  score-parser.js      beat calc
  star-analysis.js     Auto detect score per star
  utils.js             escapeHtml
  rating.js            calc and display rating
  calculate.js         calc TPS, rising table
  file-and-events.js   
  main.js              
```
