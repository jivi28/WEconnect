import { writeFileSync } from "node:fs";

/**
 * Rebuilds a self-contained glTF for the Würth Elektronik SMD ferrite component
 * described by the original cuboid.gltf (whose external .bin buffer was missing).
 *
 * Reconstructed faithfully from the source JSON:
 *  - structure: node "Ferrite" (dark body) + "Pad"/"Pad001" (two silver terminals)
 *  - material colors: ferrite baseColor 0.033, pad baseColor 0.955
 *  - proportions: a near-cube body with thin pads on the +Z / -Z faces
 * Geometry is scaled up from the real 0.3 mm part to ~1.4 units for robust
 * rendering precision; drei <Bounds> re-fits the camera regardless of scale.
 */

// Unit box (size sx,sy,sz centered at origin) → 24 verts, 36 indices, flat normals.
function box(sx, sy, sz) {
  const x = sx / 2, y = sy / 2, z = sz / 2;
  // 6 faces, each 4 verts (pos) with a shared normal
  const faces = [
    { n: [0, 0, 1], v: [[-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z]] }, // +Z
    { n: [0, 0, -1], v: [[x, -y, -z], [-x, -y, -z], [-x, y, -z], [x, y, -z]] }, // -Z
    { n: [1, 0, 0], v: [[x, -y, z], [x, -y, -z], [x, y, -z], [x, y, z]] }, // +X
    { n: [-1, 0, 0], v: [[-x, -y, -z], [-x, -y, z], [-x, y, z], [-x, y, -z]] }, // -X
    { n: [0, 1, 0], v: [[-x, y, z], [x, y, z], [x, y, -z], [-x, y, -z]] }, // +Y
    { n: [0, -1, 0], v: [[-x, -y, -z], [x, -y, -z], [x, -y, z], [-x, -y, z]] }, // -Y
  ];
  const positions = [], normals = [], indices = [];
  faces.forEach((f, fi) => {
    f.v.forEach((vert) => {
      positions.push(...vert);
      normals.push(...f.n);
    });
    const o = fi * 4;
    indices.push(o, o + 1, o + 2, o, o + 2, o + 3);
  });
  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    indices: new Uint16Array(indices),
  };
}

// Real proportions (scaled): body ~1.4 cube, pads thin plates slightly inset.
const BODY = box(1.4, 1.4, 1.18);
const PAD = box(1.28, 1.28, 0.12);
const parts = [
  { name: "Ferrite", geo: BODY, material: 0, translation: [0, 0, 0] },
  { name: "Pad", geo: PAD, material: 1, translation: [0, 0, 0.65] },
  { name: "Pad001", geo: PAD, material: 1, translation: [0, 0, -0.65] },
];

// Pack all geometry into one binary buffer; build bufferViews + accessors.
const chunks = [];
let offset = 0;
const bufferViews = [];
const accessors = [];
const meshes = [];

function pushView(typedArray, target) {
  const bytes = Buffer.from(
    typedArray.buffer,
    typedArray.byteOffset,
    typedArray.byteLength,
  );
  const viewIndex = bufferViews.length;
  bufferViews.push({
    buffer: 0,
    byteOffset: offset,
    byteLength: bytes.length,
    target,
  });
  chunks.push(bytes);
  offset += bytes.length;
  // 4-byte align
  const pad = (4 - (offset % 4)) % 4;
  if (pad) {
    chunks.push(Buffer.alloc(pad));
    offset += pad;
  }
  return viewIndex;
}

function minMax(arr, comps) {
  const min = new Array(comps).fill(Infinity);
  const max = new Array(comps).fill(-Infinity);
  for (let i = 0; i < arr.length; i += comps) {
    for (let c = 0; c < comps; c++) {
      min[c] = Math.min(min[c], arr[i + c]);
      max[c] = Math.max(max[c], arr[i + c]);
    }
  }
  return { min, max };
}

parts.forEach((part) => {
  const posView = pushView(part.geo.positions, 34962);
  const normView = pushView(part.geo.normals, 34962);
  const idxView = pushView(part.geo.indices, 34963);

  const { min, max } = minMax(part.geo.positions, 3);
  const posAcc = accessors.length;
  accessors.push({
    bufferView: posView,
    componentType: 5126,
    count: part.geo.positions.length / 3,
    type: "VEC3",
    min,
    max,
  });
  const normAcc = accessors.length;
  accessors.push({
    bufferView: normView,
    componentType: 5126,
    count: part.geo.normals.length / 3,
    type: "VEC3",
  });
  const idxAcc = accessors.length;
  accessors.push({
    bufferView: idxView,
    componentType: 5123,
    count: part.geo.indices.length,
    type: "SCALAR",
  });

  meshes.push({
    name: part.name,
    primitives: [
      {
        attributes: { POSITION: posAcc, NORMAL: normAcc },
        indices: idxAcc,
        material: part.material,
      },
    ],
  });
});

const buffer = Buffer.concat(chunks);
const dataUri = "data:application/octet-stream;base64," + buffer.toString("base64");

const gltf = {
  asset: { version: "2.0", generator: "WEconnect cuboid reconstruction" },
  scene: 0,
  scenes: [{ nodes: [0] }],
  nodes: [
    { name: "Assem1", children: [1, 2, 3] },
    { name: "Ferrite", mesh: 0 },
    { name: "Pad", mesh: 1, translation: parts[1].translation },
    { name: "Pad001", mesh: 2, translation: parts[2].translation },
  ],
  meshes,
  materials: [
    {
      name: "ferrite",
      pbrMetallicRoughness: {
        baseColorFactor: [0.13, 0.13, 0.15, 1],
        metallicFactor: 0.25,
        roughnessFactor: 0.55,
      },
    },
    {
      name: "terminal",
      pbrMetallicRoughness: {
        baseColorFactor: [0.86, 0.87, 0.9, 1],
        metallicFactor: 0.95,
        roughnessFactor: 0.32,
      },
    },
  ],
  accessors,
  bufferViews,
  buffers: [{ byteLength: buffer.length, uri: dataUri }],
};

writeFileSync(
  "public/models/cuboid.gltf",
  JSON.stringify(gltf),
);
console.log(
  `wrote public/models/cuboid.gltf — ${parts.length} parts, ${accessors.length} accessors, buffer ${buffer.length}B (embedded)`,
);
