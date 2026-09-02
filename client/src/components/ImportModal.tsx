import React, { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { importCompanies } from '../lib/api';
import { Upload, X, FileSpreadsheet, AlertTriangle, CheckCircle } from 'lucide-react';

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
}

interface ImportResult {
  totalRows: number;
  imported: number;
  updated: number;
  duplicates: number;
  failed: number;
  status: string;
  failedRows?: { row: number; reason: string }[];
}

export default function ImportModal({ open, onClose }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [duplicateAction, setDuplicateAction] = useState<'skip' | 'update'>('skip');
  const [result, setResult] = useState<ImportResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ f, action }: { f: File; action: 'skip' | 'update' }) => importCompanies(f, action),
    onSuccess: (data: any) => {
      setResult(data.data);
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['importLogs'] });
    },
    onError: () => setResult(null),
  });

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    mutation.mutate({ f: file, action: duplicateAction });
  };

  const handleClose = () => {
    onClose();
    setFile(null);
    setResult(null);
    mutation.reset();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-5 border-b">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-600" /> Import Companies
          </h2>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>
<div className="p-5">
          {!result ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400">
                <FileSpreadsheet className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                {file ? (
                  <div>
                    <p className="font-medium text-gray-700">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                    <button type="button" onClick={() => inputRef.current?.click()} className="text-blue-600 text-sm mt-1 hover:underline">Change file</button>
                  </div>
                ) : (
                  <button type="button" onClick={() => inputRef.current?.click()} className="text-blue-600 text-sm hover:underline">
                    Click to select a .csv / .xlsx file
                  </button>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duplicate handling</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="radio" name="dup" value="skip" checked={duplicateAction === 'skip'} onChange={() => setDuplicateAction('skip')} />
                    Skip duplicates (default)
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="radio" name="dup" value="update" checked={duplicateAction === 'update'} onChange={() => setDuplicateAction('update')} />
                    Update existing records
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={handleClose} className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={!file || mutation.isPending} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                  <Upload className="w-4 h-4" /> {mutation.isPending ? 'Importing...' : 'Start Import'}
                </button>
              </div>

              {mutation.isError && (
                <div className="bg-red-100 text-red-700 p-3 rounded text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> {mutation.error?.message || 'Import failed.'}
                </div>
              )}
            </form>
          ) : (
<div className="space-y-4">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">Import {result.status.toLowerCase()}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <ResultStat label="Total rows" value={result.totalRows} />
                <ResultStat label="Imported" value={result.imported} accent="text-green-700" />
                <ResultStat label="Updated" value={result.updated} accent="text-blue-700" />
                <ResultStat label="Duplicates" value={result.duplicates} accent="text-yellow-700" />
                <ResultStat label="Failed" value={result.failed} accent="text-red-700" />
              </div>

              {result.failedRows && result.failedRows.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded p-3 text-xs text-red-700">
                  <p className="font-semibold mb-1">Failed rows:</p>
                  {result.failedRows.map((f, idx) => (
                    <div key={idx}>Row {f.row}: {f.reason}</div>
                  ))}
                </div>
              )}

              <div className="flex justify-end">
                <button onClick={handleClose} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Done</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultStat({ label, value, accent = 'text-gray-800' }: { label: string; value: number; accent?: string }) {
  return (
    <div className="bg-gray-50 rounded p-3 text-center">
      <div className={`text-2xl font-bold ${accent}`}>{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}