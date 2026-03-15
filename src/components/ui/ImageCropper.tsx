import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { PiXBold, PiCheckBold, PiMagnifyingGlassPlusBold, PiMagnifyingGlassMinusBold } from 'react-icons/pi';
import './ImageCropper.scss';

interface ImageCropperProps {
  imageSrc: string;
  onConfirm: (croppedBlob: Blob, previewUrl: string) => void;
  onCancel: () => void;
}

const createCroppedImage = async (imageSrc: string, cropArea: Area): Promise<{ blob: Blob; url: string }> => {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', reject);
    img.src = imageSrc;
  });

  const canvas = document.createElement('canvas');
  const size = 400;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.drawImage(
    image,
    cropArea.x,
    cropArea.y,
    cropArea.width,
    cropArea.height,
    0,
    0,
    size,
    size
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) { reject(new Error('Canvas vacío')); return; }
      resolve({ blob, url: URL.createObjectURL(blob) });
    }, 'image/jpeg', 0.92);
  });
};

const ImageCropper = ({ imageSrc, onConfirm, onCancel }: ImageCropperProps) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [applying, setApplying] = useState(false);

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setApplying(true);
    try {
      const { blob, url } = await createCroppedImage(imageSrc, croppedAreaPixels);
      onConfirm(blob, url);
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="image-cropper-overlay" onClick={onCancel}>
      <div className="image-cropper" onClick={e => e.stopPropagation()}>
        <div className="image-cropper__header">
          <span>Ajustar foto de perfil</span>
          <button className="image-cropper__close" onClick={onCancel}>
            <PiXBold size={18} />
          </button>
        </div>

        <div className="image-cropper__canvas">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="rect"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="image-cropper__controls">
          <button
            className="image-cropper__zoom-btn"
            onClick={() => setZoom(z => Math.max(1, z - 0.1))}
            disabled={zoom <= 1}
          >
            <PiMagnifyingGlassMinusBold size={18} />
          </button>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={e => setZoom(Number(e.target.value))}
            className="image-cropper__slider"
          />
          <button
            className="image-cropper__zoom-btn"
            onClick={() => setZoom(z => Math.min(3, z + 0.1))}
            disabled={zoom >= 3}
          >
            <PiMagnifyingGlassPlusBold size={18} />
          </button>
        </div>

        <div className="image-cropper__footer">
          <button className="btn btn--outline" onClick={onCancel}>
            Cancelar
          </button>
          <button className="btn btn--primary" onClick={handleConfirm} disabled={applying}>
            <PiCheckBold size={14} />
            {applying ? 'Aplicando...' : 'Aplicar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;
