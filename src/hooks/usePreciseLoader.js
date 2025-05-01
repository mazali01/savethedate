import { useEffect, useState } from 'react'

export const usePreloadAssets = (assets) => {
    const [progress, setProgress] = useState(0)
    const [blobs, setBlobs] = useState({})

    useEffect(() => {
        let loaded = 0
        let totalSize = 0
        let blobMap = {}

        const fetchWithProgress = async (url) => {
            const response = await fetch(url)
            const contentLength = +response.headers.get('Content-Length')
            totalSize += contentLength

            const reader = response.body.getReader()
            const chunks = []
            let receivedLength = 0

            while (true) {
                const { done, value } = await reader.read()
                if (done) break
                chunks.push(value)
                receivedLength += value.length
                loaded += value.length
                setProgress(loaded / totalSize)
            }

            const blob = new Blob(chunks)
            return blob
        }

        Promise.all(
            assets.map(async (asset) => {
                const blob = await fetchWithProgress(asset)
                const url = URL.createObjectURL(blob)
                blobMap[asset] = url
            })
        ).then(() => setBlobs(blobMap))
    }, [assets])

    return { progress, blobs }
}
