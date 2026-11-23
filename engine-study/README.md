# Inline-four engine geometry and inspection study

This educational concept study explores how changing bore and stroke affects an approximately two-litre inline-four engine and how a measured bore can be compared against an illustrative drawing tolerance.

Run `python study.py` from this folder. The model reports swept volume and mean piston speed at 6,000 rpm for an 86 × 86 mm baseline and a 90 × 78.5 mm alternative. A shorter stroke lowers mean piston speed at the same rpm. The larger bore maintains approximately the same swept volume. Geometry alone cannot establish power, durability, or a safe operating speed.

The illustrative baseline bore specification is 86.000 ± 0.020 mm. The script checks two synthetic measurements against that range, allowing a 0.005 mm guard band for example measurement uncertainty. This tolerance and guard band are study assumptions.

For an out-of-band bore, record the serial number, drawing revision, measurement positions, and gauge calibration. Hold the part for review and repeat measurements at multiple depths and orientations to distinguish a repeatable size error from taper, ovality, or a measurement issue. Compare tool wear and process records only after confirming the measurement. Evaluate rework or replacement against validated limits and the applicable approval process before releasing the part.
