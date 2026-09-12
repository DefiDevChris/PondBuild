import { Point } from '../types';

/**
 * Calculates Euclidean distance between two points (in feet)
 */
export function distance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculates total 2D length of a polyline in feet
 */
export function calculatePolylineLength(points: Point[]): number {
  if (points.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    total += distance(points[i], points[i + 1]);
  }
  return total;
}

/**
 * Calculates polygon area using the Shoelace formula (in square feet)
 */
export function calculatePolygonArea(points: Point[]): number {
  if (points.length < 3) return 0;
  let area = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area) / 2;
}

/**
 * Simple pseudo-random number generator from seed
 */
function seededRandom(seed: number): () => number {
  let s = Math.abs(seed) % 2147483647;
  if (s === 0) s = 12345;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Generates an irregular organic flagstone polygon.
 * Dimensions are strictly in feet based on sizeInches:
 * e.g., 12" = 1.0 ft, 18" = 1.5 ft, 24" = 2.0 ft, 36" = 3.0 ft.
 * Vertices are centered around (0, 0).
 */
export function generateFlagstoneVertices(sizeInches: number, seed: number): Point[] {
  const radiusFt = (sizeInches / 12) / 2; // radius in feet
  const rng = seededRandom(seed);

  // Irregular flagstones typically have 6 to 9 facets with straight-ish cleavages
  const vertexCount = 7 + Math.floor(rng() * 3); // 7 to 9 vertices
  const vertices: Point[] = [];

  // Add asymmetry aspect ratio (e.g. some flagstones are oblong 1.1x - 1.4x)
  const stretchAngle = rng() * Math.PI * 2;
  const stretchFactor = 1.0 + rng() * 0.35; // 1.0 to 1.35 aspect ratio

  for (let i = 0; i < vertexCount; i++) {
    // Base angle with jitter
    const baseAngle = (i / vertexCount) * (Math.PI * 2);
    const angleJitter = (rng() - 0.5) * (0.6 / vertexCount) * (Math.PI * 2);
    const angle = baseAngle + angleJitter;

    // Radius jitter (organic flat cleavage planes and corners)
    const rJitter = 0.72 + rng() * 0.45; // 0.72 to 1.17
    let r = radiusFt * rJitter;

    // Apply elongation along stretch angle
    const angleDiff = angle - stretchAngle;
    const stretch = 1 + (stretchFactor - 1) * Math.cos(angleDiff) * Math.cos(angleDiff);
    r *= stretch;

    vertices.push({
      x: r * Math.cos(angle),
      y: r * Math.sin(angle),
    });
  }

  return vertices;
}

/**
 * Converts a set of points into a smooth SVG path (Catmull-Rom or cubic Bezier)
 */
export function pointsToSmoothSvgPath(points: Point[], closed: boolean = false): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  let path = `M ${points[0].x} ${points[0].y}`;

  if (!closed) {
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = i > 0 ? points[i - 1] : points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i < points.length - 2 ? points[i + 2] : p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
    }
  } else {
    // Closed smooth curve
    const n = points.length;
    for (let i = 0; i < n; i++) {
      const p0 = points[(i - 1 + n) % n];
      const p1 = points[i];
      const p2 = points[(i + 1) % n];
      const p3 = points[(i + 2) % n];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
    }
    path += ' Z';
  }

  return path;
}

/**
 * Snap point to grid
 */
export function snapPoint(p: Point, snapInterval: number = 0.5): Point {
  return {
    x: Math.round(p.x / snapInterval) * snapInterval,
    y: Math.round(p.y / snapInterval) * snapInterval,
  };
}

/**
 * Calculates perpendicular distance from a point to a line segment
 */
function perpendicularDistance(p: Point, lineStart: Point, lineEnd: Point): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const mag = Math.sqrt(dx * dx + dy * dy);
  if (mag === 0) return distance(p, lineStart);
  return Math.abs(dy * p.x - dx * p.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x) / mag;
}

/**
 * Ramer-Douglas-Peucker line simplification
 */
export function simplifyPoints(points: Point[], tolerance: number = 0.15): Point[] {
  if (points.length <= 2) return points;

  let maxDist = 0;
  let index = 0;
  const end = points.length - 1;

  for (let i = 1; i < end; i++) {
    const d = perpendicularDistance(points[i], points[0], points[end]);
    if (d > maxDist) {
      maxDist = d;
      index = i;
    }
  }

  if (maxDist > tolerance) {
    const rec1 = simplifyPoints(points.slice(0, index + 1), tolerance);
    const rec2 = simplifyPoints(points.slice(index), tolerance);
    return rec1.slice(0, rec1.length - 1).concat(rec2);
  } else {
    return [points[0], points[end]];
  }
}

/**
 * Uniformly resamples a closed polygon along its perimeter to a set of evenly spaced vertices
 */
export function resampleClosedPolygon(points: Point[], targetCount?: number): Point[] {
  if (points.length < 3) return points;
  const n = points.length;

  const segLengths: number[] = [];
  let totalPerimeter = 0;
  for (let i = 0; i < n; i++) {
    const d = distance(points[i], points[(i + 1) % n]);
    segLengths.push(d);
    totalPerimeter += d;
  }

  if (totalPerimeter < 1) return points;

  // High fidelity sampling: ~0.55 ft interval along perimeter
  // Keeps the exact drawn contours, coves, and bends intact
  const count = targetCount || Math.max(16, Math.min(80, Math.round(totalPerimeter / 0.55)));
  const step = totalPerimeter / count;
  const resampled: Point[] = [];

  let accumulatedDist = 0;
  let segIndex = 0;
  let segCovered = 0;

  for (let i = 0; i < count; i++) {
    const targetDist = i * step;

    while (segIndex < n && accumulatedDist + (segLengths[segIndex] - segCovered) < targetDist) {
      accumulatedDist += (segLengths[segIndex] - segCovered);
      segCovered = 0;
      segIndex = (segIndex + 1) % n;
    }

    const segLen = segLengths[segIndex] || 0.001;
    const needed = targetDist - accumulatedDist;
    const t = Math.min(1, Math.max(0, (segCovered + needed) / segLen));

    const p1 = points[segIndex];
    const p2 = points[(segIndex + 1) % n];
    resampled.push({
      x: Number((p1.x + (p2.x - p1.x) * t).toFixed(3)),
      y: Number((p1.y + (p2.y - p1.y) * t).toFixed(3)),
    });
  }

  return resampled;
}

/**
 * Uniformly resamples an open polyline
 */
export function resampleOpenPolyline(points: Point[], targetCount?: number): Point[] {
  if (points.length < 2) return points;
  const n = points.length;

  const segLengths: number[] = [];
  let totalLength = 0;
  for (let i = 0; i < n - 1; i++) {
    const d = distance(points[i], points[i + 1]);
    segLengths.push(d);
    totalLength += d;
  }

  if (totalLength < 0.5) return points;

  const count = targetCount || Math.max(8, Math.min(60, Math.round(totalLength / 0.55)));
  const step = totalLength / (count - 1);
  const resampled: Point[] = [points[0]];

  let accumulatedDist = 0;
  let segIndex = 0;
  let segCovered = 0;

  for (let i = 1; i < count - 1; i++) {
    const targetDist = i * step;

    while (segIndex < n - 1 && accumulatedDist + (segLengths[segIndex] - segCovered) < targetDist) {
      accumulatedDist += (segLengths[segIndex] - segCovered);
      segCovered = 0;
      segIndex++;
    }

    const segLen = segLengths[segIndex] || 0.001;
    const needed = targetDist - accumulatedDist;
    const t = Math.min(1, Math.max(0, (segCovered + needed) / segLen));

    const p1 = points[segIndex];
    const p2 = points[segIndex + 1];
    resampled.push({
      x: Number((p1.x + (p2.x - p1.x) * t).toFixed(3)),
      y: Number((p1.y + (p2.y - p1.y) * t).toFixed(3)),
    });
  }

  resampled.push(points[points.length - 1]);
  return resampled;
}

/**
 * Multi-pass Laplacian curvature relaxation for closed polygons.
 * Relaxes high-frequency tremors, bumps, and sharp corners into broad, fluid curves.
 */
export function laplacianSmoothClosed(points: Point[], iterations: number = 7, weight: number = 0.5): Point[] {
  if (points.length < 4) return points;
  let current = [...points];
  const n = current.length;

  for (let it = 0; it < iterations; it++) {
    const next: Point[] = [];
    for (let i = 0; i < n; i++) {
      const prev = current[(i - 1 + n) % n];
      const curr = current[i];
      const nxt = current[(i + 1) % n];

      const avgX = (prev.x + nxt.x) * 0.5;
      const avgY = (prev.y + nxt.y) * 0.5;

      next.push({
        x: Number((curr.x * (1 - weight) + avgX * weight).toFixed(3)),
        y: Number((curr.y * (1 - weight) + avgY * weight).toFixed(3)),
      });
    }
    current = next;
  }
  return current;
}

/**
 * Multi-pass Laplacian smoothing for open polylines (anchoring start and end)
 */
export function laplacianSmoothOpen(points: Point[], iterations: number = 5, weight: number = 0.45): Point[] {
  if (points.length < 3) return points;
  let current = [...points];
  const n = current.length;

  for (let it = 0; it < iterations; it++) {
    const next: Point[] = [current[0]];
    for (let i = 1; i < n - 1; i++) {
      const prev = current[i - 1];
      const curr = current[i];
      const nxt = current[i + 1];

      const avgX = (prev.x + nxt.x) * 0.5;
      const avgY = (prev.y + nxt.y) * 0.5;

      next.push({
        x: Number((curr.x * (1 - weight) + avgX * weight).toFixed(3)),
        y: Number((curr.y * (1 - weight) + avgY * weight).toFixed(3)),
      });
    }
    next.push(current[n - 1]);
    current = next;
  }
  return current;
}

/**
 * Chaikin corner-cutting smoothing algorithm for closed polygons
 */
export function chaikinSmoothClosed(points: Point[], iterations: number = 3): Point[] {
  if (points.length < 3) return points;
  let current = [...points];

  for (let it = 0; it < iterations; it++) {
    const next: Point[] = [];
    const n = current.length;
    for (let i = 0; i < n; i++) {
      const p1 = current[i];
      const p2 = current[(i + 1) % n];

      next.push({
        x: Number((0.75 * p1.x + 0.25 * p2.x).toFixed(3)),
        y: Number((0.75 * p1.y + 0.25 * p2.y).toFixed(3)),
      });
      next.push({
        x: Number((0.25 * p1.x + 0.75 * p2.x).toFixed(3)),
        y: Number((0.25 * p1.y + 0.75 * p2.y).toFixed(3)),
      });
    }
    current = next;
  }
  return current;
}

/**
 * Chaikin smoothing algorithm for open polylines (pipes/hoses)
 */
export function chaikinSmoothOpen(points: Point[], iterations: number = 3): Point[] {
  if (points.length < 3) return points;
  let current = [...points];

  for (let it = 0; it < iterations; it++) {
    const next: Point[] = [];
    const n = current.length;
    next.push(current[0]); // Anchor start point

    for (let i = 0; i < n - 1; i++) {
      const p1 = current[i];
      const p2 = current[i + 1];

      next.push({
        x: Number((0.75 * p1.x + 0.25 * p2.x).toFixed(3)),
        y: Number((0.75 * p1.y + 0.25 * p2.y).toFixed(3)),
      });
      next.push({
        x: Number((0.25 * p1.x + 0.75 * p2.x).toFixed(3)),
        y: Number((0.25 * p1.y + 0.75 * p2.y).toFixed(3)),
      });
    }

    next.push(current[n - 1]); // Anchor end point
    current = next;
  }
  return current;
}

/**
 * Auto-smooths a freehand drawn closed contour (pond rim or shelf).
 * Faithfully follows the user's drawn path while gently eliminating hand/mouse jitter.
 * 1. Filter out micro-jitter points closer than 0.12 ft (~1.4 inches).
 * 2. If end is near start (within 2 ft), snap to close cleanly; else bridge smoothly.
 * 3. 2-pass gentle moving-average tremor filter (70% anchor on original drawn point,
 *    15% on each neighbor). Does not shrink or collapse the shape.
 * 4. Resample evenly at ~0.55 ft along the exact perimeter to ensure uniform vector vertices.
 * 5. Single light touch-up pass (80% anchor, 10% neighbors) for continuous smooth curvature.
 */
export function autoSmoothClosedContour(rawPoints: Point[]): Point[] {
  if (rawPoints.length < 3) return rawPoints;

  // 1. Initial distance filter (remove micro-clusters under 0.12 ft)
  const filtered: Point[] = [rawPoints[0]];
  for (let i = 1; i < rawPoints.length; i++) {
    if (distance(rawPoints[i], filtered[filtered.length - 1]) >= 0.12) {
      filtered.push(rawPoints[i]);
    }
  }
  if (filtered.length < 3) return filtered;

  // 2. Cleanly close loop: if user released near start (within 2 ft), snap end to start
  const firstPt = filtered[0];
  const lastPt = filtered[filtered.length - 1];
  if (distance(firstPt, lastPt) <= 2.0 && filtered.length > 4) {
    filtered[filtered.length - 1] = { ...firstPt };
  }

  // Remove duplicate end if identical to first
  const cleanLoop = filtered.slice(
    0,
    distance(filtered[0], filtered[filtered.length - 1]) < 0.05 && filtered.length > 3
      ? filtered.length - 1
      : filtered.length
  );

  if (cleanLoop.length < 3) return cleanLoop;

  // 3. Two gentle passes of moving-average filter to remove high-frequency hand jitter
  // Weights: 0.15 prev, 0.70 current, 0.15 next. Retains 70% original coordinate per pass.
  let smoothed = [...cleanLoop];
  const n = smoothed.length;
  for (let pass = 0; pass < 2; pass++) {
    const next: Point[] = [];
    for (let i = 0; i < n; i++) {
      const prev = smoothed[(i - 1 + n) % n];
      const curr = smoothed[i];
      const nxt = smoothed[(i + 1) % n];
      next.push({
        x: Number((curr.x * 0.70 + (prev.x + nxt.x) * 0.15).toFixed(3)),
        y: Number((curr.y * 0.70 + (prev.y + nxt.y) * 0.15).toFixed(3)),
      });
    }
    smoothed = next;
  }

  // 4. Resample evenly along the perimeter at ~0.55 ft spacing
  // This keeps points faithfully positioned on the user's path without flattening bends or coves
  const resampled = resampleClosedPolygon(smoothed);

  // 5. 1 light curvature refinement pass (80% anchor, 10% neighbors)
  const count = resampled.length;
  const finalPoints: Point[] = [];
  for (let i = 0; i < count; i++) {
    const prev = resampled[(i - 1 + count) % count];
    const curr = resampled[i];
    const nxt = resampled[(i + 1) % count];
    finalPoints.push({
      x: Number((curr.x * 0.80 + (prev.x + nxt.x) * 0.10).toFixed(3)),
      y: Number((curr.y * 0.80 + (prev.y + nxt.y) * 0.10).toFixed(3)),
    });
  }

  return finalPoints;
}

/**
 * Auto-smooths a shelf contour (either drawn or inset) with significantly fewer points (~10-18 points)
 * so that adjusting and shaping the shelf is clean, uncluttered, and quick to manipulate.
 */
export function autoSmoothShelfContour(rawPoints: Point[]): Point[] {
  if (rawPoints.length < 3) return rawPoints;

  // 1. Filter out micro clusters closer than 0.2 ft
  const filtered: Point[] = [rawPoints[0]];
  for (let i = 1; i < rawPoints.length; i++) {
    if (distance(rawPoints[i], filtered[filtered.length - 1]) >= 0.2) {
      filtered.push(rawPoints[i]);
    }
  }
  if (filtered.length < 3) return rawPoints;

  // 2. Compute perimeter
  let totalPerimeter = 0;
  const n = filtered.length;
  for (let i = 0; i < n; i++) {
    totalPerimeter += distance(filtered[i], filtered[(i + 1) % n]);
  }

  // 3. Resample with FEWER points: spacing ~2.0 - 2.5 ft, target 10 to 18 points total
  const shelfTargetCount = Math.max(10, Math.min(18, Math.round(totalPerimeter / 2.2)));
  const resampled = resampleClosedPolygon(filtered, shelfTargetCount);

  // 4. Curvature pass for smooth, rounded pond contours
  const count = resampled.length;
  const finalPoints: Point[] = [];
  for (let i = 0; i < count; i++) {
    const prev = resampled[(i - 1 + count) % count];
    const curr = resampled[i];
    const nxt = resampled[(i + 1) % count];
    finalPoints.push({
      x: Number((curr.x * 0.75 + (prev.x + nxt.x) * 0.125).toFixed(3)),
      y: Number((curr.y * 0.75 + (prev.y + nxt.y) * 0.125).toFixed(3)),
    });
  }

  return finalPoints;
}

/**
 * Auto-smooths a freehand drawn open polyline (pipe or hose).
 * Strictly follows the drawn route while eliminating hand jitter.
 * Anchors the start and end points firmly in place.
 */
export function autoSmoothOpenPolyline(rawPoints: Point[]): Point[] {
  if (rawPoints.length < 2) return rawPoints;

  // 1. Initial distance filter (remove micro-clusters under 0.12 ft)
  const filtered: Point[] = [rawPoints[0]];
  for (let i = 1; i < rawPoints.length; i++) {
    if (distance(rawPoints[i], filtered[filtered.length - 1]) >= 0.12) {
      filtered.push(rawPoints[i]);
    }
  }
  if (filtered.length < 3) return filtered;

  // 2. Two gentle passes of moving-average filter on interior points
  let smoothed = [...filtered];
  const n = smoothed.length;
  for (let pass = 0; pass < 2; pass++) {
    const next: Point[] = [smoothed[0]]; // Start point locked
    for (let i = 1; i < n - 1; i++) {
      const prev = smoothed[i - 1];
      const curr = smoothed[i];
      const nxt = smoothed[i + 1];
      next.push({
        x: Number((curr.x * 0.70 + (prev.x + nxt.x) * 0.15).toFixed(3)),
        y: Number((curr.y * 0.70 + (prev.y + nxt.y) * 0.15).toFixed(3)),
      });
    }
    next.push(smoothed[n - 1]); // End point locked
    smoothed = next;
  }

  // 3. Resample evenly along polyline length (~0.55 ft spacing)
  const resampled = resampleOpenPolyline(smoothed);

  // 4. 1 light curvature refinement pass on interior points
  const count = resampled.length;
  if (count <= 2) return resampled;
  const finalPoints: Point[] = [resampled[0]];
  for (let i = 1; i < count - 1; i++) {
    const prev = resampled[i - 1];
    const curr = resampled[i];
    const nxt = resampled[i + 1];
    finalPoints.push({
      x: Number((curr.x * 0.80 + (prev.x + nxt.x) * 0.10).toFixed(3)),
      y: Number((curr.y * 0.80 + (prev.y + nxt.y) * 0.10).toFixed(3)),
    });
  }
  finalPoints.push(resampled[count - 1]);

  return finalPoints;
}

/**
 * Computes bounding box of a list of points
 */
export function getBoundingBox(points: Point[]): { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number } {
  if (points.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Checks if a 2D point is inside a polygon using ray casting
 */
export function isPointInPolygon(p: Point, poly: Point[]): boolean {
  if (poly.length < 3) return false;
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y;
    const xj = poly[j].x, yj = poly[j].y;
    const intersect = ((yi > p.y) !== (yj > p.y))
        && (p.x < ((xj - xi) * (p.y - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Offsets a closed polygon inward by a specified distance in feet (default 1.0 ft = 12 inches).
 * Traces the shape of the pond rim or outer contour inwards to generate a tiered shelf.
 */
export function offsetPolygonInward(points: Point[], insetFeet: number = 1.0): Point[] {
  if (points.length < 3) return [...points];
  const n = points.length;

  // Compute centroid
  let cx = 0;
  let cy = 0;
  for (const pt of points) {
    cx += pt.x;
    cy += pt.y;
  }
  cx /= n;
  cy /= n;

  // Compute signed area (SVG coordinates: y increases downward)
  let signedArea = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    signedArea += points[i].x * points[j].y - points[j].x * points[i].y;
  }
  const isClockwise = signedArea > 0;

  // Compute unit inward normal for each edge
  const edgeNormals: Point[] = [];
  for (let i = 0; i < n; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy);

    if (len < 0.0001) {
      edgeNormals.push({ x: 0, y: 0 });
    } else {
      // In SVG coordinates:
      // Clockwise inward normal is (-dy/len, dx/len)
      // Counter-clockwise inward normal is (dy/len, -dx/len)
      if (isClockwise) {
        edgeNormals.push({ x: -dy / len, y: dx / len });
      } else {
        edgeNormals.push({ x: dy / len, y: -dx / len });
      }
    }
  }

  // Compute vertex offset positions
  const rawOffset: Point[] = [];
  for (let i = 0; i < n; i++) {
    const prevEdge = (i - 1 + n) % n;
    const nextEdge = i;

    const nPrev = edgeNormals[prevEdge];
    const nNext = edgeNormals[nextEdge];

    const sumX = nPrev.x + nNext.x;
    const sumY = nPrev.y + nNext.y;
    const sumLen = Math.sqrt(sumX * sumX + sumY * sumY);

    let normX = nNext.x;
    let normY = nNext.y;

    if (sumLen > 0.001) {
      normX = sumX / sumLen;
      normY = sumY / sumLen;
    }

    // Miter calculation to prevent corner distortion
    const dot = nPrev.x * nNext.x + nPrev.y * nNext.y;
    let miter = Math.sqrt(2 / (1 + dot + 0.0001));
    miter = Math.max(0.6, Math.min(1.7, miter));

    let ox = points[i].x + normX * insetFeet * miter;
    let oy = points[i].y + normY * insetFeet * miter;

    // Verify offset point is inside polygon; fallback towards centroid if needed
    if (!isPointInPolygon({ x: ox, y: oy }, points)) {
      const vcx = cx - points[i].x;
      const vcy = cy - points[i].y;
      const cDist = Math.sqrt(vcx * vcx + vcy * vcy);
      if (cDist > insetFeet) {
        ox = points[i].x + (vcx / cDist) * insetFeet;
        oy = points[i].y + (vcy / cDist) * insetFeet;
      } else {
        ox = points[i].x + vcx * 0.5;
        oy = points[i].y + vcy * 0.5;
      }
    }

    rawOffset.push({
      x: Number(ox.toFixed(2)),
      y: Number(oy.toFixed(2)),
    });
  }

  // Filter vertices that are too close
  const filtered: Point[] = [rawOffset[0]];
  for (let i = 1; i < rawOffset.length; i++) {
    if (distance(rawOffset[i], filtered[filtered.length - 1]) >= 0.25) {
      filtered.push(rawOffset[i]);
    }
  }

  if (filtered.length < 4) return rawOffset;

  // Smooth the shelf contour with reduced, clean point count (~10-18 pts) for easy adjusting
  return autoSmoothShelfContour(filtered);
}

/**
 * Deforms a closed polygon by moving a subset of selected vertices by delta (dx, dy).
 * All unselected vertices remain stationary, allowing localized shelf widening/reshaping.
 */
export function moveSelectedVertices(
  points: Point[],
  selectedIndices: number[],
  delta: { x: number; y: number },
  smoothAdjacent: boolean = true
): Point[] {
  if (selectedIndices.length === 0 || (delta.x === 0 && delta.y === 0)) return points;
  const n = points.length;
  const selectedSet = new Set(selectedIndices);

  // Identify adjacent neighbors with 2-step soft Gaussian-like falloff for seamless curvature
  const adjacentWeights = new Map<number, number>();
  if (smoothAdjacent && selectedIndices.length < n) {
    for (const idx of selectedIndices) {
      const prev1 = (idx - 1 + n) % n;
      const prev2 = (idx - 2 + n) % n;
      const next1 = (idx + 1) % n;
      const next2 = (idx + 2) % n;
      if (!selectedSet.has(prev1)) adjacentWeights.set(prev1, Math.max(adjacentWeights.get(prev1) || 0, 0.6));
      if (!selectedSet.has(prev2)) adjacentWeights.set(prev2, Math.max(adjacentWeights.get(prev2) || 0, 0.25));
      if (!selectedSet.has(next1)) adjacentWeights.set(next1, Math.max(adjacentWeights.get(next1) || 0, 0.6));
      if (!selectedSet.has(next2)) adjacentWeights.set(next2, Math.max(adjacentWeights.get(next2) || 0, 0.25));
    }
  }

  return points.map((p, i) => {
    if (selectedSet.has(i)) {
      return {
        x: Number((p.x + delta.x).toFixed(2)),
        y: Number((p.y + delta.y).toFixed(2)),
      };
    }
    if (adjacentWeights.has(i)) {
      const w = adjacentWeights.get(i)!;
      return {
        x: Number((p.x + delta.x * w).toFixed(2)),
        y: Number((p.y + delta.y * w).toFixed(2)),
      };
    }
    return p;
  });
}

/**
 * Finds the edge segment (index i to (i+1)%n) in a closed polygon closest to point pt,
 * and returns the insertion index (i + 1) to insert a new vertex seamlessly.
 */
export function findClosestEdgeInsertionIndex(points: Point[], pt: Point): number {
  if (points.length < 2) return points.length;
  let minDistance = Infinity;
  let bestIndex = 1;
  const n = points.length;

  for (let i = 0; i < n; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const segLenSq = dx * dx + dy * dy;
    if (segLenSq > 0.0001) {
      const t = Math.max(0, Math.min(1, ((pt.x - p1.x) * dx + (pt.y - p1.y) * dy) / segLenSq));
      const projX = p1.x + t * dx;
      const projY = p1.y + t * dy;
      const distToProj = Math.sqrt((pt.x - projX) ** 2 + (pt.y - projY) ** 2);
      if (distToProj < minDistance) {
        minDistance = distToProj;
        bestIndex = (i + 1) % (n + 1);
      }
    }
  }

  return bestIndex;
}

