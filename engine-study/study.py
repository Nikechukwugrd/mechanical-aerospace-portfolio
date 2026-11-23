from math import pi


def displacement_litres(bore_mm, stroke_mm, cylinders):
    cylinder_area_mm2 = pi * bore_mm**2 / 4
    return cylinder_area_mm2 * stroke_mm * cylinders / 1_000_000


def mean_piston_speed_mps(stroke_mm, rpm):
    return 2 * (stroke_mm / 1_000) * rpm / 60


def main():
    for label, bore, stroke in [('Baseline', 86, 86), ('Shorter stroke', 90, 78.5)]:
        volume = displacement_litres(bore, stroke, 4)
        speed = mean_piston_speed_mps(stroke, 6000)
        print(f'{label}: {volume:.3f} L, {speed:.2f} m/s at 6000 rpm')

    nominal, tolerance, guard_band = 86_000, 20, 5  # micrometres
    lower = nominal - tolerance + guard_band
    upper = nominal + tolerance - guard_band
    for measurement in (86_010, 86_027):
        result = 'within guard band' if lower <= measurement <= upper else 'hold for review'
        print(f'Bore {measurement / 1000:.3f} mm: {result}')


if __name__ == '__main__':
    main()
