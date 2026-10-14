import React, { useState } from 'react';
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  File,
  HardDrive,
  Calendar,
  ShieldAlert
} from 'lucide-react';
import { VaultFile } from '../../types/vault';
import { formatBytes, formatDate } from '../../utils/formatters';
import { api } from '../../services/api';

interface TrashViewProps {
  trashFiles: VaultFile[];
  onRefresh: () => void;
}

export const TrashView: React.FC<TrashViewProps> = ({ trashFiles, onRefresh }) => {
  const [confirmEmpty, setConfirmEmpty] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRestore = async (id: string) => {
    try {
      await api.admin.restoreFile(id);
      onRefresh();
    } catch (err) {
      console.error('Failed to restore file', err);
    }
  };

  const handlePermanentDelete = async (id: string) => {
    if (!window.confirm('Permanently wipe this file from storage disk? This action cannot be undone.')) return;
    try {
      await api.admin.deleteFile(id, true);
      onRefresh();
    } catch (err) {
      console.error('Failed to purge file', err);
    }
  };

  const handleEmptyTrash = async () => {
    setIsProcessing(true);
    try {
      await api.admin.emptyTrash();
      setConfirmEmpty(false);
      onRefresh();
    } catch (err) {
      console.error('Failed to empty trash', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="vault-panel rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-400" />
            <span>Vault Trash & Recycle Bin</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Deleted files are safely quarantined here. Items in trash are hidden from public portfolio visitors. You can restore them anytime or permanently destroy them.
          </p>
        </div>

        {trashFiles.length > 0 && (
          <button
            onClick={() => setConfirmEmpty(true)}
            className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs sm:text-sm font-semibold transition-colors flex items-center space-x-2 shrink-0 cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Empty Trash ({trashFiles.length})</span>
          </button>
        )}
      </div>

      {trashFiles.length === 0 ? (
        <div className="vault-panel rounded-2xl p-12 text-center text-slate-500 text-xs flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-[#1E2533] flex items-center justify-center text-slate-400 mb-3">
            <Trash2 className="w-7 h-7" />
          </div>
          <p className="font-semibold text-slate-300">Trash is empty</p>
          <p className="text-slate-500 mt-1">No deleted files waiting in quarantine.</p>
        </div>
      ) : (
        <div className="vault-panel rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#1E2533] bg-[#0E121A]/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="p-3.5">Item Name</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Size</th>
                  <th className="p-3.5">Deleted Date</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2533]">
                {trashFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-[#1A212D]/50 transition-colors">
                    <td className="p-3.5 font-medium text-slate-200">
                      <div className="flex items-center space-x-2.5">
                        <File className="w-4 h-4 text-slate-400" />
                        <div>
                          <div className="font-semibold text-slate-100">{file.title || file.originalName}</div>
                          <div className="text-[10px] text-slate-500">{file.originalName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-400">{file.category}</td>
                    <td className="p-3.5 font-mono text-slate-400">{formatBytes(file.size)}</td>
                    <td className="p-3.5 text-slate-400">{file.deletedAt ? formatDate(file.deletedAt) : 'Recent'}</td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleRestore(file.id)}
                          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors text-xs font-medium"
                          title="Restore to active vault"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restore</span>
                        </button>
                        <button
                          onClick={() => handlePermanentDelete(file.id)}
                          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 transition-colors text-xs font-medium"
                          title="Permanently wipe"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Purge</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty Trash Confirmation Modal */}
      {confirmEmpty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#141821] border border-[#232A3B] rounded-2xl p-6 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Permanently Empty Trash?</h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              This will permanently delete all {trashFiles.length} file(s) and free up storage from the underlying disk. This action is irreversible.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setConfirmEmpty(false)}
                disabled={isProcessing}
                className="flex-1 py-2.5 rounded-xl border border-[#232A3B] text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleEmptyTrash}
                disabled={isProcessing}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-semibold shadow-lg shadow-red-500/20"
              >
                {isProcessing ? 'Purging...' : 'Permanently Purge All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
