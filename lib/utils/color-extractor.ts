/**
 * Extract the dominant color from an image file
 * Returns a hex color string (e.g., "#ff5733")
 */
export async function extractDominantColor(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        img.onload = () => {
            // Resize to small size for faster processing
            const size = 100
            canvas.width = size
            canvas.height = size

            if (!ctx) {
                reject(new Error('Canvas context not available'))
                return
            }

            // Draw image on canvas
            ctx.drawImage(img, 0, 0, size, size)

            // Get image data
            const imageData = ctx.getImageData(0, 0, size, size)
            const data = imageData.data

            // Count color frequencies (simplified bucketing)
            const colorMap: { [key: string]: number } = {}

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i]
                const g = data[i + 1]
                const b = data[i + 2]
                const a = data[i + 3]

                // Skip transparent pixels
                if (a < 125) continue

                // Bucket colors to reduce variations (divide by 10 and multiply back)
                const rBucket = Math.round(r / 10) * 10
                const gBucket = Math.round(g / 10) * 10
                const bBucket = Math.round(b / 10) * 10

                const key = `${rBucket},${gBucket},${bBucket}`
                colorMap[key] = (colorMap[key] || 0) + 1
            }

            // Find most frequent color
            let maxCount = 0
            let dominantColor = '0,0,0'

            for (const [color, count] of Object.entries(colorMap)) {
                if (count > maxCount) {
                    maxCount = count
                    dominantColor = color
                }
            }

            // Convert to hex
            const [r, g, b] = dominantColor.split(',').map(Number)
            const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`

            resolve(hex)
        }

        img.onerror = () => {
            reject(new Error('Failed to load image'))
        }

        // Load image from file
        const reader = new FileReader()
        reader.onload = (e) => {
            img.src = e.target?.result as string
        }
        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.readAsDataURL(file)
    })
}
