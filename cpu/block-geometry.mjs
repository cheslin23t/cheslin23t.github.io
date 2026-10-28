// Small cuboids in a block's local coordinates. Directions come from the
// schematic's wire state; no adjacency or powered state is invented here.
export function wireBoxes(state) {
  const boxes = [[0.4, 0.025, 0.4, 0.2, 0.045, 0.2]];
  const arms = {
    north: [0.42, 0.025, 0, 0.16, 0.045, 0.5],
    south: [0.42, 0.025, 0.5, 0.16, 0.045, 0.5],
    west: [0, 0.025, 0.42, 0.5, 0.045, 0.16],
    east: [0.5, 0.025, 0.42, 0.5, 0.045, 0.16],
  };
  const climbs = {
    north: [0.42, 0.045, 0.005, 0.16, 0.955, 0.025],
    south: [0.42, 0.045, 0.97, 0.16, 0.955, 0.025],
    west: [0.005, 0.045, 0.42, 0.025, 0.955, 0.16],
    east: [0.97, 0.045, 0.42, 0.025, 0.955, 0.16],
  };
  for (const direction of Object.keys(arms)) {
    const value = state.match(new RegExp(`${direction}=(none|side|up)`))?.[1];
    if (value === "side" || value === "up") boxes.push(arms[direction]);
    if (value === "up") boxes.push(climbs[direction]);
  }
  return boxes;
}
