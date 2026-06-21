const fs = require('fs')
const path = require('path')

const src = './WEComponents'
const dest = './public/models'
if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true })

const folders = fs.readdirSync(src).filter(f =>
  fs.statSync(path.join(src, f)).isDirectory()
)

folders.forEach(folder => {
  const folderPath = path.join(src, folder)
  const files = fs.readdirSync(folderPath)
  const gltfFile = files.find(f => f.endsWith('.gltf'))
  const binFile = files.find(f => f.endsWith('.bin'))

  if (!gltfFile) {
    console.log(`MISSING GLTF: ${folder}`)
    return
  }

  // Read and fix gltf bin reference
  const gltfPath = path.join(folderPath, gltfFile)
  const gltfData = JSON.parse(fs.readFileSync(gltfPath, 'utf8'))

  if (gltfData.buffers && gltfData.buffers[0]) {
    gltfData.buffers[0].uri = `${folder}.bin`
  }

  // Write fixed gltf to public/models
  fs.writeFileSync(
    path.join(dest, `${folder}.gltf`),
    JSON.stringify(gltfData, null, 2)
  )

  // Copy bin with unique name
  if (binFile) {
    fs.copyFileSync(
      path.join(folderPath, binFile),
      path.join(dest, `${folder}.bin`)
    )
    console.log(`OK: ${folder}`)
  } else {
    console.log(`MISSING BIN: ${folder}`)
  }
})

console.log(`Done. ${folders.length} components processed.`)
