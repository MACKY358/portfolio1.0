import { useRef, useState } from 'react'
import {
  compressImageFile,
  dataUrlBytes,
  formatBytes,
  isDataUrl,
  isImageFile,
} from '../lib/imageStore'

/**
 * An image field for the admin panel.
 *
 * The user can upload a file from their computer, pick one from the images
 * already in the repository, or type a path such as /images/me.png.
 * Uploads are compressed in the browser and stored as data URLs in the
 * content, so no backend is required.
 */
function ImageField({ label, value, onChange, hint, repoImages = [], onUpload }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState({ message: '', for: null })
  const [dragOver, setDragOver] = useState(false)
  const [mode, setMode] = useState('upload')
  const inputRef = useRef(null)

  // Clear a stale error once the value changes.
  const errorMessage = error.for === value ? error.message : ''

  const handleFiles = async (files) => {
    const file = files?.[0]
    if (!file) return

    if (!isImageFile(file)) {
      setError({ message: 'That file type is not supported. Use PNG, JPG, WEBP, GIF or SVG.', for: value })
      return
    }

    setBusy(true)
    setError({ message: '', for: null })
    try {
      const result = await compressImageFile(file)
      onChange(result.dataUrl)
      if (onUpload) onUpload(result)
    } catch (uploadError) {
      setError({ message: uploadError.message || 'Could not read that image', for: value })
    } finally {
      setBusy(false)
    }
  }

  const isEmbedded = isDataUrl(value)
  const previewSrc = value || ''

  return (
    <div className="adm-field">
      <span className="adm-label">{label}</span>

      <div className="adm-image">
        <div className="adm-image-preview">
          {previewSrc ? (
            <img src={previewSrc} alt="Preview" />
          ) : (
            <span className="adm-image-empty">No image</span>
          )}
        </div>

        <div className="adm-image-controls">
          <div className="adm-image-tabs">
            <button
              type="button"
              className={`adm-image-tab ${mode === 'upload' ? 'active' : ''}`}
              onClick={() => setMode('upload')}
            >
              Upload
            </button>
            <button
              type="button"
              className={`adm-image-tab ${mode === 'library' ? 'active' : ''}`}
              onClick={() => setMode('library')}
            >
              Library
            </button>
            <button
              type="button"
              className={`adm-image-tab ${mode === 'path' ? 'active' : ''}`}
              onClick={() => setMode('path')}
            >
              Path
            </button>
          </div>

          {mode === 'upload' && (
            <div
              className={`adm-dropzone ${dragOver ? 'drag' : ''}`}
              onDragOver={(event) => {
                event.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(event) => {
                event.preventDefault()
                setDragOver(false)
                handleFiles(event.dataTransfer.files)
              }}
              onClick={() => inputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click()
              }}
            >
              {busy ? 'Processing image...' : 'Drop an image here or click to browse'}
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(event) => {
                  handleFiles(event.target.files)
                  event.target.value = ''
                }}
              />
            </div>
          )}

          {mode === 'library' && (
            <div className="adm-library">
              {repoImages.length === 0 ? (
                <p className="adm-hint">No images found in the repository yet.</p>
              ) : (
                repoImages.map((image) => (
                  <button
                    type="button"
                    key={image.path}
                    className={`adm-library-item ${value === image.publicPath ? 'active' : ''}`}
                    onClick={() => onChange(image.publicPath ?? image.path)}
                    title={image.publicPath ?? image.path}
                  >
                    <img src={image.url} alt={image.name} />
                    <span>{image.name}</span>
                  </button>
                ))
              )}
            </div>
          )}

          {mode === 'path' && (
            <input
              type="text"
              className="adm-input"
              placeholder="/images/me.png"
              value={isEmbedded ? '' : value || ''}
              onChange={(event) => onChange(event.target.value)}
            />
          )}

          <div className="adm-image-meta">
            <span className="adm-hint">
              {isEmbedded
                ? `Uploaded image · ${formatBytes(dataUrlBytes(value))}`
                : value
                  ? `Using ${value}`
                  : 'No image selected'}
            </span>
            {value ? (
              <button type="button" className="adm-remove" onClick={() => onChange('')}>
                Remove
              </button>
            ) : null}
          </div>

          {hint ? <span className="adm-hint">{hint}</span> : null}
          {errorMessage ? <span className="adm-error">{errorMessage}</span> : null}
        </div>
      </div>
    </div>
  )
}

export default ImageField
