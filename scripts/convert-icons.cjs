const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const svg = fs.readFileSync(path.join(__dirname, '..', 'public', 'icon.svg'))

async function generate() {
  await sharp(svg).resize(192, 192).png().toFile(path.join(__dirname, '..', 'public', 'icon-192.png'))
  await sharp(svg).resize(512, 512).png().toFile(path.join(__dirname, '..', 'public', 'icon-512.png'))
  await sharp(svg).resize(180, 180).png().toFile(path.join(__dirname, '..', 'public', 'apple-touch-icon.png'))
  console.log('Icons generated successfully')
}

generate().catch(console.error)
