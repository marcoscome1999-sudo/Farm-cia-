import React, { useEffect, useRef, useState } from 'react';
import { X, Camera, Barcode, AlertCircle, Sparkles } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { Product } from '../types.ts';

interface BarcodeScannerModalProps {
  products: Product[];
  onDetected: (barcode: string) => void;
  onClose: () => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  products,
  onDetected,
  onClose,
}) => {
  const [manualCode, setManualCode] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const qrRegionId = 'html5qr-code-full-region';

  useEffect(() => {
    let isMounted = true;

    const startScanner = async () => {
      try {
        const html5QrCode = new Html5Qrcode(qrRegionId);
        scannerRef.current = html5QrCode;

        const cameras = await Html5Qrcode.getCameras();
        if (!cameras || cameras.length === 0) {
          if (isMounted) setCameraError('Nenhuma câmara detetada neste dispositivo.');
          return;
        }

        // Prefer back camera for phone
        const cameraId = cameras[cameras.length - 1].id;

        await html5QrCode.start(
          cameraId,
          {
            fps: 10,
            qrbox: { width: 250, height: 150 },
            aspectRatio: 1.777778,
          },
          (decodedText) => {
            if (isMounted) {
              stopScanner();
              onDetected(decodedText);
            }
          },
          (errorMessage) => {
            // Ignorar erros de frames intermediários sem código
          }
        );

        if (isMounted) {
          setCameraActive(true);
          setCameraError(null);
        }
      } catch (err: any) {
        console.warn('Erro ao inicializar câmara:', err);
        if (isMounted) {
          setCameraError('Não foi possível aceder à câmara (permissão ou dispositivo não suportado). Utilize a pesquisa ou o teclado.');
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      stopScanner();
    };
  }, []);

  const stopScanner = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop().catch(() => {}).finally(() => {
        try {
          scannerRef.current?.clear();
        } catch {}
      });
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      stopScanner();
      onDetected(manualCode.trim());
    }
  };

  const sampleProductsWithBarcode = products.filter(p => p.codigo_barras && (p.stock_total || 0) > 0).slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <Barcode className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-900">Leitor de Código de Barras</h3>
          </div>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Viewport */}
        <div className="p-6 space-y-4">
          <div className="relative bg-black rounded-xl overflow-hidden min-h-[220px] flex items-center justify-center">
            <div id={qrRegionId} className="w-full h-full"></div>
            
            {cameraError && (
              <div className="absolute inset-0 bg-slate-900/90 p-6 flex flex-col items-center justify-center text-center text-white">
                <AlertCircle className="w-8 h-8 text-amber-400 mb-2" />
                <p className="text-xs text-slate-200 mb-3">{cameraError}</p>
                <span className="text-[11px] text-slate-400">
                  Dica: Você também pode usar um leitor laser USB ou digitar o código abaixo.
                </span>
              </div>
            )}
          </div>

          {/* Quick Manual / Test Barcodes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700">Digite ou Teste Códigos de Barras:</span>
              <span className="text-[11px] text-slate-500">Exemplos do catálogo</span>
            </div>

            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="Código de barras (ex: 5601234567890)"
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                autoFocus
                className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Inserir
              </button>
            </form>

            {/* Quick pill buttons */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {sampleProductsWithBarcode.map(prod => (
                <button
                  key={prod.id}
                  type="button"
                  onClick={() => {
                    stopScanner();
                    onDetected(prod.codigo_barras);
                  }}
                  className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 border border-slate-200 rounded-lg text-slate-700 transition-colors"
                >
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span className="font-medium">{prod.nome.split(' ')[0]}</span>
                  <span className="font-mono text-slate-400 text-[10px]">{prod.codigo_barras.slice(-5)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-xl font-medium transition-colors"
          >
            Cancelar
          </button>
        </div>

      </div>
    </div>
  );
};
