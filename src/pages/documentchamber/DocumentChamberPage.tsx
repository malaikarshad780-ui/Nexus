import React, { useRef, useState } from 'react';
import { Upload, FileText, Trash2, X, PenTool } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { useDocumentChamber } from '../../context/DocumentChamberContext';
import { ChamberDocument, DocumentStatus } from '../../types';

const statusConfig: Record<DocumentStatus, { label: string; variant: 'secondary' | 'primary' | 'success' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  in_review: { label: 'In Review', variant: 'primary' },
  signed: { label: 'Signed', variant: 'success' },
};

// Signature pad drawn on a canvas
const SignaturePad: React.FC<{ onSave: (dataUrl: string) => void; onCancel: () => void }> = ({
  onSave,
  onCancel,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const getCoords = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    isDrawing.current = true;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoords(e, canvas);
    ctx?.beginPath();
    ctx?.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCoords(e, canvas);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1f2937';
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDraw = () => {
    isDrawing.current = false;
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasDrawn(false);
    }
  };

  const save = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return;
    onSave(canvas.toDataURL('image/png'));
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">Draw your signature below:</p>
      <canvas
        ref={canvasRef}
        width={500}
        height={180}
        className="border border-gray-300 rounded-lg bg-white w-full cursor-crosshair touch-none"
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={stopDraw}
        onMouseLeave={stopDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={stopDraw}
      />
      <div className="flex justify-between gap-2">
        <Button variant="outline" size="sm" onClick={clear}>
          Clear
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="sm" onClick={save} disabled={!hasDrawn}>
            Save Signature
          </Button>
        </div>
      </div>
    </div>
  );
};

export const DocumentChamberPage: React.FC = () => {
  const { user } = useAuth();
  const { documents, uploadDocument, updateStatus, signDocument, deleteDocument } =
    useDocumentChamber();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewDoc, setPreviewDoc] = useState<ChamberDocument | null>(null);
  const [signingDoc, setSigningDoc] = useState<ChamberDocument | null>(null);

  if (!user) return null;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadDocument(file, user.id);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveSignature = (dataUrl: string) => {
    if (signingDoc) {
      signDocument(signingDoc.id, dataUrl);
      setSigningDoc(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Chamber</h1>
          <p className="text-gray-600">Upload, review, and sign deal contracts</p>
        </div>

        <Button leftIcon={<Upload size={18} />} onClick={() => fileInputRef.current?.click()}>
          Upload Document
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">All Documents</h2>
        </CardHeader>
        <CardBody>
          {documents.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gray-100 p-4 rounded-full inline-flex mb-4">
                <FileText size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-700">No documents yet</h3>
              <p className="text-gray-500 mt-1">Upload a contract or deal document to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map(doc => (
                <div
                  key={doc.id}
                  className="flex items-center p-4 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                >
                  <button
                    className="p-2 bg-primary-50 rounded-lg mr-4"
                    onClick={() => setPreviewDoc(doc)}
                    aria-label="Preview document"
                  >
                    <FileText size={24} className="text-primary-600" />
                  </button>

                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setPreviewDoc(doc)}>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-gray-900 truncate">{doc.name}</h3>
                      <Badge variant={statusConfig[doc.status].variant} size="sm">
                        {statusConfig[doc.status].label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span>{doc.size}</span>
                      <span>Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}</span>
                      {doc.signedAt && (
                        <span>Signed {new Date(doc.signedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <select
                      value={doc.status}
                      onChange={e => updateStatus(doc.id, e.target.value as DocumentStatus)}
                      className="text-sm border border-gray-300 rounded-md px-2 py-1.5 text-gray-700"
                      disabled={doc.status === 'signed'}
                    >
                      <option value="draft">Draft</option>
                      <option value="in_review">In Review</option>
                      <option value="signed" disabled>
                        Signed
                      </option>
                    </select>

                    {doc.status !== 'signed' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-2"
                        aria-label="Sign document"
                        onClick={() => setSigningDoc(doc)}
                      >
                        <PenTool size={18} />
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-2 text-error-600 hover:text-error-700"
                      aria-label="Delete"
                      onClick={() => deleteDocument(doc.id)}
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Preview modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-900 truncate">{previewDoc.name}</h3>
              <button onClick={() => setPreviewDoc(null)} aria-label="Close preview">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {previewDoc.fileType === 'application/pdf' ? (
                <iframe
                  src={previewDoc.dataUrl}
                  title={previewDoc.name}
                  className="w-full h-[60vh] border border-gray-200 rounded-lg"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-[40vh] text-center">
                  <FileText size={48} className="text-gray-300 mb-3" />
                  <p className="text-gray-600">
                    Preview isn't available for this file type in-browser.
                 </p>
                  <a>
                    href={previewDoc.dataUrl}
                    download={previewDoc.name}
                    className="text-primary-600 text-sm mt-2 hover:underline"
                  
                    Download to view
                  </a>
                </div>
              )}

              {previewDoc.signatureDataUrl && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">Signature:</p>
                  <img
                    src={previewDoc.signatureDataUrl}
                    alt="Signature"
                    className="border border-gray-200 rounded-lg max-w-xs"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Signature modal */}
      {signingDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium text-gray-900">Sign "{signingDoc.name}"</h3>
              <button onClick={() => setSigningDoc(null)} aria-label="Close">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <SignaturePad onSave={handleSaveSignature} onCancel={() => setSigningDoc(null)} />
          </div>
        </div>
      )}
    </div>
  );
};