import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'

export default function FileDropzone({ onFile, label = 'Drop your certificate here', accepted = false }) {
    const [fileName, setFileName] = useState(null)
    const [fileSize, setFileSize] = useState(null)

    const onDrop = useCallback((acceptedFiles) => {
        if (acceptedFiles.length > 0) {
            const f = acceptedFiles[0]
            setFileName(f.name)
            setFileSize((f.size / 1024).toFixed(1))
            onFile(f)
        }
    }, [onFile])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'image/png': ['.png'],
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/tiff': ['.tiff', '.tif'],
            'image/bmp': ['.bmp'],
        },
        maxFiles: 1,
    })

    return (
        <div>
            <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
                <input {...getInputProps()} />
                <div className="dropzone-icon">
                    {isDragActive ? '📂' : '📄'}
                </div>
                <h3>{isDragActive ? 'Release to upload' : label}</h3>
                <p>Drag & drop or click to browse</p>
                <div className="file-types">
                    {['PDF', 'PNG', 'JPG', 'TIFF', 'BMP'].map((ext) => (
                        <span key={ext} className="file-type-badge">{ext}</span>
                    ))}
                </div>
            </div>

            {fileName && (
                <div className="file-preview fade-in">
                    <div className="file-preview-icon">
                        {fileName.endsWith('.pdf') ? '📑' : '🖼️'}
                    </div>
                    <div className="file-preview-info">
                        <div className="file-preview-name">{fileName}</div>
                        <div className="file-preview-size">{fileSize} KB • Ready to process</div>
                    </div>
                    <span className="pill pill-green">✓ Loaded</span>
                </div>
            )}
        </div>
    )
}
