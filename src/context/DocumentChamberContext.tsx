import React, { createContext, useState, useContext, useEffect } from 'react';
import { ChamberDocument, DocumentStatus } from '../types';
import toast from 'react-hot-toast';

interface DocumentChamberContextType {
  documents: ChamberDocument[];
  uploadDocument: (file: File, ownerId: string) => Promise<void>;
  updateStatus: (id: string, status: DocumentStatus) => void;
  signDocument: (id: string, signatureDataUrl: string) => void;
  deleteDocument: (id: string) => void;
}

const DocumentChamberContext = createContext<DocumentChamberContextType | undefined>(undefined);

const STORAGE_KEY = 'business_nexus_documents';

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const DocumentChamberProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [documents, setDocuments] = useState<ChamberDocument[]>([]);

  // Load persisted documents on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setDocuments(JSON.parse(stored));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Persist documents whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
  }, [documents]);

  // Read a file as base64 for preview storage
  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  };

  const uploadDocument = async (file: File, ownerId: string): Promise<void> => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error('Only PDF and Word documents are supported');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File must be smaller than 10 MB');
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);

      const newDoc: ChamberDocument = {
        id: `doc-${Date.now()}`,
        name: file.name,
        fileType: file.type,
        size: formatFileSize(file.size),
        ownerId,
        status: 'draft',
        dataUrl,
        signatureDataUrl: null,
        uploadedAt: new Date().toISOString(),
        signedAt: null,
      };

      setDocuments(prev => [newDoc, ...prev]);
      toast.success('Document uploaded');
    } catch {
      toast.error('Failed to read file');
    }
  };

  const updateStatus = (id: string, status: DocumentStatus): void => {
    setDocuments(prev =>
      prev.map(doc => (doc.id === id ? { ...doc, status } : doc))
    );
    toast.success(`Status updated to ${status.replace('_', ' ')}`);
  };

  const signDocument = (id: string, signatureDataUrl: string): void => {
    setDocuments(prev =>
      prev.map(doc =>
        doc.id === id
          ? {
              ...doc,
              status: 'signed',
              signatureDataUrl,
              signedAt: new Date().toISOString(),
            }
          : doc
      )
    );
    toast.success('Document signed');
  };

  const deleteDocument = (id: string): void => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
    toast.success('Document deleted');
  };

  const value: DocumentChamberContextType = {
    documents,
    uploadDocument,
    updateStatus,
    signDocument,
    deleteDocument,
  };

  return (
    <DocumentChamberContext.Provider value={value}>
      {children}
    </DocumentChamberContext.Provider>
  );
};

export const useDocumentChamber = (): DocumentChamberContextType => {
  const context = useContext(DocumentChamberContext);
  if (context === undefined) {
    throw new Error('useDocumentChamber must be used within a DocumentChamberProvider');
  }
  return context;
};