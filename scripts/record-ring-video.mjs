import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import puppeteer from 'puppeteer'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const root = path.resolve(__dirname, '..')

function waitForOutput(proc, regex, timeoutMs = 20000) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Timeout waiting for output: ' + regex)), timeoutMs)
        function onData(data) {
            const s = data.toString()
            if (regex.test(s)) {
                clearTimeout(timer)
                proc.stdout.off('data', onData)
                resolve(s)
            }
        }
        proc.stdout.on('data', onData)
    })
}

async function main() {
    const wantMp4 = process.argv.includes('--mp4')
    // Build once, then preview (no HMR) on a fixed port
    const viteBin = process.platform === 'win32' ? 'vite.cmd' : 'vite'
    const localVite = path.join(root, 'node_modules', '.bin', viteBin)
    const useLocal = fs.existsSync(localVite)
    const buildProc = useLocal
        ? spawn(localVite, ['build'], { cwd: root, stdio: 'inherit' })
        : spawn('npm', ['run', 'build'], { cwd: root, stdio: 'inherit' })
    await new Promise((resolve, reject) => {
        buildProc.on('exit', (code) => code === 0 ? resolve() : reject(new Error('vite build failed')))
        buildProc.on('error', reject)
    })

    const previewArgs = ['preview', '--host']
    const preview = useLocal
        ? spawn(localVite, previewArgs, { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] })
        : spawn('npm', ['run', 'preview', '--', ...previewArgs.slice(1)], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] })
    preview.stderr.on('data', d => process.stderr.write(d))
    const logs = await waitForOutput(preview, /Local:\s+http:\/\/localhost:(\d+)/)
    const m = logs.match(/Local:\s+http:\/\/localhost:(\d+)/)
    const port = m ? Number(m[1]) : 5173
    const url = `http://localhost:${port}/record`

    // Try to find a local Chrome if Puppeteer didn't download one
    let executablePath = process.env.PUPPETEER_EXECUTABLE_PATH
    if (!executablePath && process.platform === 'darwin') {
        const candidates = [
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
            '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
            '/Applications/Chromium.app/Contents/MacOS/Chromium'
        ]
        executablePath = candidates.find(p => fs.existsSync(p))
    }

    const browser = await puppeteer.launch({
        headless: false, // headful improves WebGL compatibility
        executablePath,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--enable-webgl',
            '--ignore-gpu-blocklist',
            '--use-angle=metal',
            '--autoplay-policy=no-user-gesture-required',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding'
        ]
    })
    const page = await browser.newPage()
    await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 })
    page.on('pageerror', (err) => console.error('[pageerror]', err))
    page.on('console', msg => console.log('[browser]', msg.text()))

    // Receive the base64 via window.postMessage
    const videoBase64Promise = new Promise((resolve) => {
        page.exposeFunction('nodeResolveVideo', (payload) => resolve(payload))
    })

    await page.exposeFunction('notifyNode', (payload) => {
        // Not used, placeholder for debug
        console.log('notifyNode', payload)
    })

    await page.evaluateOnNewDocument(() => {
        window.addEventListener('message', (ev) => {
            if (ev?.data?.type === 'RING_VIDEO_READY') {
                // @ts-ignore
                window.nodeResolveVideo(ev.data.payload)
            }
        })
    })

    await page.goto(url, { waitUntil: 'load', timeout: 60000 })
    await page.waitForSelector('canvas', { timeout: 30000 })

    // Wait up to 60s for the recording to finish
    const result = await Promise.race([
        videoBase64Promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Recording timed out')), 60000))
    ])

    if (result.downloaded) {
        console.log('Recording completed, file downloaded directly.')
        console.log('Size:', result.size, 'bytes')
        console.log('Type:', result.mimeType || 'webm')
        console.log('Check your Downloads folder for ring-loop.webm')
        console.log('Success! The ring animation has been recorded.')
    } else if (result.base64) {
        // Handle base64 format
        const { base64, mimeType } = result
        const outDir = path.join(root, 'public')
        const outPath = path.join(outDir, 'ring-loop.webm')
        fs.mkdirSync(outDir, { recursive: true })
        const buf = Buffer.from(base64, 'base64')
        fs.writeFileSync(outPath, buf)
        console.log('Saved video to', outPath, 'type:', mimeType, 'size:', buf.length, 'bytes')

        if (wantMp4) {
            // Try to convert to MP4 using ffmpeg if available
            console.log('Converting to MP4...')
            const mp4Path = path.join(outDir, 'ring-loop.mp4')
            const ffmpeg = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'
            await new Promise((resolve, reject) => {
                const p = spawn(ffmpeg, ['-y', '-i', outPath, '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4Path], { stdio: 'inherit' })
                p.on('exit', (code) => code === 0 ? resolve() : reject(new Error('ffmpeg failed')))
                p.on('error', reject)
            }).then(() => console.log('Saved MP4 to', mp4Path)).catch(err => console.warn('ffmpeg not available or failed:', err.message))
        }
    } else if (result.downloaded) {
        console.log('Recording completed, file downloaded directly. Size:', result.size, 'bytes')
        console.log('Check your Downloads folder for ring-loop.webm')
    }

    await browser.close()
    preview.kill('SIGTERM')
}

main().catch(err => {
    console.error(err)
    process.exit(1)
})
