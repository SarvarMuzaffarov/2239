import React, { useEffect, useRef, useState } from 'react';
import { CertificateData, renderCertificateToCanvas, downloadCertificatePdf } from '../lib/certificateGenerator';
import { Download, Printer, RefreshCw, ZoomIn, ZoomOut, CheckCircle2, ShieldCheck, Maximize2 } from 'lucide-react';

interface CertificateLivePreviewProps {
  data: CertificateData;
  onDownload?: () => void;
  className?: string;
  showActions?: boolean;
}

export const CertificateLivePreview: React.FC<CertificateLivePreviewProps> = ({
  data,
  onDownload,
  className = '',
  showActions = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsRendering(true);
    const render = async () => {
      try {
        await renderCertificateToCanvas(data, canvas);
      } catch (err) {
        console.error('Error rendering certificate canvas preview:', err);
      } finally {
        if (isMounted) setIsRendering(false);
      }
    };

    // Debounce slightly to maintain 60fps typing in form
    const timeoutId = setTimeout(render, 60);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [
    data.certificateNumber,
    data.studentName,
    data.title,
    data.subtitle,
    data.presentedToText,
    data.description,
    data.eventTitle,
    data.competitionName,
    data.nomination,
    data.additionalNote,
    data.decisionNumber,
    data.awardLevel,
    data.signatoryName,
    data.signatoryRole,
    data.signatoryDegree,
    data.issueDate,
    data.documentType,
    data.organizationName,
    data.studentDirection,
  ]);

  const handleDownload = async () => {
    if (onDownload) {
      onDownload();
      return;
    }
    try {
      setIsDownloading(true);
      await downloadCertificatePdf(data);
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${data.title || 'Diplom'} - ${data.studentName}</title>
            <style>
              @page { size: A4 landscape; margin: 0; }
              body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; background: #000; height: 100vh; }
              img { width: 100vw; height: 100vh; object-fit: contain; }
              @media print {
                body { background: transparent; }
                img { width: 100%; height: 100%; object-fit: cover; }
              }
            </style>
          </head>
          <body>
            <img src="${dataUrl}" onload="window.print();" />
          </body>
        </html>
      `);
      win.document.close();
    }
  };

  return (
    <div className={`flex flex-col bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-xl ${className}`}>
      {/* Top Preview Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-slate-800/90 border-b border-slate-700/80 text-white gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-slate-200 tracking-wide">
            A4 LANDSCAPE LIVE PREVIEW
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 font-mono border border-emerald-800/50">
            297 × 210 mm
          </span>
          {isRendering && (
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Chizilmoqda...
            </span>
          )}
        </div>

        {showActions && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setZoom(z => Math.max(60, z - 15))}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg text-xs transition-colors"
              title="Kichiklashtirish"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] text-slate-400 font-mono w-10 text-center">{zoom}%</span>
            <button
              type="button"
              onClick={() => setZoom(z => Math.min(150, z + 15))}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg text-xs transition-colors"
              title="Kattalashtirish"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-200 hover:text-white bg-slate-700/80 hover:bg-slate-700 rounded-lg transition-colors ml-1"
              title="Chop etish"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Chop etish</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading || isRendering}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg transition-colors shadow-sm ml-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloading ? 'Yuklanmoqda...' : 'PDF yuklab olish'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Preview Container */}
      <div className="relative p-3 sm:p-6 bg-slate-950 flex items-center justify-center overflow-auto max-h-[600px] select-none">
        <div
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'center center',
            transition: 'transform 0.15s ease-out',
          }}
          className="w-full max-w-[960px] shadow-2xl rounded-sm overflow-hidden bg-white ring-1 ring-slate-800"
        >
          <canvas
            ref={canvasRef}
            className="w-full h-auto block aspect-[297/210] pointer-events-none"
          />
        </div>
      </div>

      {/* Bottom Info Bar */}
      <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>QR-kod orqali 100% rasmiy tasdiqlanadigan verifikatsiya havolsi biriktirilgan</span>
        </div>
        <div className="font-mono text-slate-500">
          ID: {data.certificateNumber || 'CERT-2026-XXXX'}
        </div>
      </div>
    </div>
  );
};
