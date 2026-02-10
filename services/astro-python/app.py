"""
Astro Python microservice: Swiss Ephemeris–based signal computation.
Exposes GET /health and POST /astro/compute. Outputs gain_signal, risk_signal,
phase_signal, confidence (0–1) only; no predictions or narrative text.
"""
import math
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional
from zoneinfo import ZoneInfo

from dotenv import load_dotenv
from fastapi import FastAPI
from pydantic import BaseModel

load_dotenv()

PORT = int(os.getenv("PORT", "5001"))

# --- Swiss Ephemeris: set ephe path relative to this app (no absolute system paths) ---
_APP_DIR = Path(__file__).resolve().parent
_EPHE_PATH = _APP_DIR / "ephe"
try:
    import swisseph as swe
    swe.set_ephe_path(str(_EPHE_PATH))
    # Planet constants: pyswisseph may expose SUN/MOON or SE_SUN/SE_MOON
    _SE_SUN = getattr(swe, "SUN", getattr(swe, "SE_SUN", 0))
    _SE_MOON = getattr(swe, "MOON", getattr(swe, "SE_MOON", 1))
except Exception:
    swe = None
    _SE_SUN = _SE_MOON = 0

app = FastAPI(title="Astro Python Service", version="0.1.0")


# --- Input model for POST /astro/compute (unchanged) ---
class AstroComputeInput(BaseModel):
    dob_date: str  # YYYY-MM-DD
    dob_time: str  # HH:MM or HH:MM:SS
    latitude: float
    longitude: float
    timezone: str
    problem_context: str
    uda_summary: str


# --- Output model: signals only, 0–1 (unchanged field names) ---
class AstroComputeOutput(BaseModel):
    gain_signal: float
    risk_signal: float
    phase_signal: float
    confidence: float


def _parse_dt(date_str: str, time_str: str, tz_str: str) -> Optional[datetime]:
    """Parse dob_date and dob_time in given timezone; return UTC datetime."""
    try:
        time_str = time_str.strip()
        if len(time_str) <= 5:  # HH:MM
            dt_naive = datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M")
        else:
            dt_naive = datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M:%S")
        tz = ZoneInfo(tz_str)
        return dt_naive.replace(tzinfo=tz).astimezone(timezone.utc)
    except Exception:
        return None


def _ut_to_julday(dt: datetime) -> float:
    """Convert UTC datetime to Julian Day (UT)."""
    h = dt.hour + dt.minute / 60.0 + dt.second / 3600.0
    return swe.julday(dt.year, dt.month, dt.day, h)


def _clamp01(x: float) -> float:
    return max(0.0, min(1.0, x))


def _compute_signals(body: AstroComputeInput) -> AstroComputeOutput:
    """
    Compute gain_signal, risk_signal, phase_signal, confidence from Swiss Ephemeris.
    Uses: Sun position, Moon position, Ascendant, current transit vs natal stress.
    All outputs normalized to [0, 1]. No predictions or text.
    """
    # Defaults when ephemeris unavailable or parse error
    default = AstroComputeOutput(
        gain_signal=0.5,
        risk_signal=0.5,
        phase_signal=0.5,
        confidence=0.0,
    )

    if swe is None:
        return default

    dt_utc = _parse_dt(body.dob_date, body.dob_time, body.timezone)
    if dt_utc is None:
        return AstroComputeOutput(
            gain_signal=0.5,
            risk_signal=0.5,
            phase_signal=0.5,
            confidence=0.3,
        )

    try:
        jd_natal = _ut_to_julday(dt_utc)
        lat, lon = body.latitude, body.longitude

        # 1) Sun and Moon at birth (longitude in degrees 0–360)
        sun_natal, _ = swe.calc_ut(jd_natal, _SE_SUN)
        moon_natal, _ = swe.calc_ut(jd_natal, _SE_MOON)
        sun_long = sun_natal[0]
        moon_long = moon_natal[0]

        # 2) Ascendant at birth (Placidus houses; cusps[0] or ascmc[0] depending on binding)
        try:
            houses = swe.houses(jd_natal, lat, lon, b"P")
            asc = houses[1][0] if len(houses) > 1 and len(houses[1]) > 0 else houses[0][0]
        except Exception:
            asc = (sun_long + 90) % 360  # fallback

        # 3) Current time UT for transits
        now_utc = datetime.now(timezone.utc)
        jd_now = _ut_to_julday(now_utc)
        sun_now, _ = swe.calc_ut(jd_now, _SE_SUN)
        moon_now, _ = swe.calc_ut(jd_now, _SE_MOON)
        sun_now_long = sun_now[0]
        moon_now_long = moon_now[0]

        # 4) Transit vs natal stress indicator (transiting Moon to natal Sun angular separation)
        # 0° = conjunction, 90° = square, 180° = opposition; sin maps to stress peak at 90°
        sep = abs((moon_now_long - sun_long) % 360)
        if sep > 180:
            sep = 360 - sep
        transit_stress = math.sin(sep * math.pi / 180.0)
        transit_stress = _clamp01(transit_stress)

        # 5) Derive normalized signals [0, 1]
        # gain_signal: strength/stability from Sun/Moon/Asc positions (deterministic mix)
        gain_signal = _clamp01(
            0.33 * (sun_long % 360) / 360.0
            + 0.33 * (moon_long % 360) / 360.0
            + 0.34 * (asc % 360) / 360.0
        )

        # risk_signal: stress/transit pressure
        risk_signal = _clamp01(transit_stress)

        # phase_signal: life-phase activation (lunar phase: new–full cycle)
        moon_sun_sep = (moon_now_long - sun_now_long) % 360
        phase_signal = _clamp01(moon_sun_sep / 360.0)

        # confidence: input completeness (we have dob, time, lat, lon, timezone)
        confidence = 1.0

        return AstroComputeOutput(
            gain_signal=round(gain_signal, 4),
            risk_signal=round(risk_signal, 4),
            phase_signal=round(phase_signal, 4),
            confidence=round(confidence, 4),
        )
    except Exception:
        return default


@app.get("/health")
def health():
    """Health check endpoint."""
    return {"status": "ok"}


@app.post("/astro/compute", response_model=AstroComputeOutput)
def astro_compute(body: AstroComputeInput):
    """
    Compute astro signals from Swiss Ephemeris (Sun, Moon, Ascendant, transit vs natal).
    Returns gain_signal, risk_signal, phase_signal, confidence in [0, 1] only.
    """
    return _compute_signals(body)


def main():
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)


if __name__ == "__main__":
    main()
