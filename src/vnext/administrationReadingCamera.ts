// Living Book folios with full Drakken or DRAXIS figures use the
// Administration's external study camera, never a subject-scale eye line.
const DRAXIS_PLATES: ReadonlySet<number> = new Set([4, 5, 9]);
export const isAdministrationExteriorPlate = (index: number): boolean => DRAXIS_PLATES.has(index);

export const ADMINISTRATION_EXTERIOR_ORBIT = Object.freeze({
  minAzimuthAngle: -.82,
  maxAzimuthAngle: .82,
  maxPolarAngle: 1.10,
  minDistance: 2.40,
});
