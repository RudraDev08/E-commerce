
import React, { useState, useRef } from 'react';
import axios from 'axios';
import Papa from 'papaparse';
import { toast } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API_BASE = `${API_URL}/inventory`;

const BulkUpdateModal = ({ onClose, onSuccess }) => {
    const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'manual'
    const [file, setFile] = useState(null);
    const [parsedData, setParsedData] = useState([]);
    const [validationErrors, setValidationErrors] = useState([]);
    const [processing, setProcessing] = useState(false);
    const [step, setStep] = useState(1); // 1: Select, 2: Preview, 3: Result
    const [result, setResult] = useState(null);

    const fileInputRef = useRef(null);

    // Template Data
    const bufferCSV = 'SKU,UpdateType,Quantity,Reason,Notes\nPROD-001,add,10,STOCK_RECEIVED,Delivery from Supplier\nPROD-002,set,50,AUDIT_CORRECTION,Cycle Count\nPROD-003,deduct,5,DAMAGE,Damaged in shipping';

    const handleDownloadTemplate = () => {
        const blob = new Blob([bufferCSV], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'inventory_bulk_update_template.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    const handleFileUpload = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
                toast.error('Please upload a valid CSV file');
                return;
            }
            setFile(selectedFile);
            parseFile(selectedFile);
        }
    };

    const parseFile = (file) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.data.length === 0) {
                    toast.error('File is empty');
                    return;
                }

                // Validate Structure
                const requiredHeaders = ['SKU', 'UpdateType', 'Quantity', 'Reason'];
                const headers = results.meta.fields;
                const missing = requiredHeaders.filter(h => !headers.includes(h));

                if (missing.length > 0) {
                    toast.error(`Missing columns: ${missing.join(', ')}`);
                    return;
                }

                // Validate Rows
                const validRows = [];
                const errors = [];
                const validTypes = ['add', 'set', 'deduct'];

                results.data.forEach((row, index) => {
                    const rowErrors = [];
                    if (!row.SKU) rowErrors.push('Missing SKU');
                    if (!row.UpdateType || !validTypes.includes(row.UpdateType.toLowerCase())) rowErrors.push('Invalid UpdateType (add/set/deduct)');
                    const qty = parseInt(row.Quantity);
                    if (isNaN(qty) || qty < 0) rowErrors.push('Invalid Quantity');
                    if (!row.Reason) rowErrors.push('Missing Reason');

                    if (rowErrors.length > 0) {
                        errors.push({ row: index + 2, errors: rowErrors, data: row });
                    } else {
                        validRows.push({
                            sku: row.SKU,
                            updateType: row.UpdateType.toLowerCase(),
                            quantity: qty,
                            reason: row.Reason,
                            notes: row.Notes || ''
                        });
                    }
                });

                setParsedData(validRows);
                setValidationErrors(errors);
                setStep(2);
            },
            error: (err) => {
                toast.error('Failed to parse CSV: ' + err.message);
            }
        });
    };

    const handleProcess = async () => {
        if (parsedData.length === 0) {
            toast.error('No valid data to process');
            return;
        }

        setProcessing(true);
        try {
            const payload = {
                updates: parsedData,
                performedBy: 'ADMIN' // TODO: Get from auth
            };

            const response = await axios.post(`${API_BASE}/bulk-update`, payload);

            if (response.data.success) {
                setResult(response.data.data); // { successCount, failedCount, results: { success: [], failed: [] } }
                setStep(3);
                toast.success(`Processed ${response.data.data.successCount} updates successfully`);
                if (onSuccess) onSuccess();
            }
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to process bulk update');
        } finally {
            setProcessing(false);
        }
    };

    const reset = () => {
        setFile(null);
        setParsedData([]);
        setValidationErrors([]);
        setStep(1);
        setResult(null);
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">

                <div
                    className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity backdrop-blur-sm"
                    onClick={onClose}
                ></div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl w-full">

                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="text-xl font-semibold text-gray-900">
                            Bulk Stock Update
                            {step > 1 && <span className="ml-2 text-sm font-normal text-gray-500">- Step {step} of 3</span>}
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full p-1 transition-colors"
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="p-6">

                        {/* STEP 1: UPLOAD */}
                        {step === 1 && (
                            <>
                                <div className="mb-6 flex gap-4">
                                    <div
                                        className={`flex-1 border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${activeTab === 'upload' ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-purple-300'
                                            }`}
                                        onClick={() => fileInputRef.current?.click()}
                                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            const droppedFile = e.dataTransfer.files[0];
                                            if (droppedFile) {
                                                setFile(droppedFile);
                                                parseFile(droppedFile);
                                            }
                                        }}
                                    >
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept=".csv"
                                            onChange={handleFileUpload}
                                        />
                                        <div className="mx-auto h-12 w-12 text-purple-500 mb-3 bg-white rounded-full flex items-center justify-center shadow-sm">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                            </svg>
                                        </div>
                                        <p className="text-lg font-medium text-gray-900">Click to upload or drag and drop</p>
                                        <p className="text-sm text-gray-500 mt-1">CSV files only (max 10MB)</p>
                                        <p className="text-xs text-gray-400 mt-4">
                                            Need help? <button onClick={(e) => { e.stopPropagation(); handleDownloadTemplate(); }} className="text-purple-600 hover:underline font-medium">Download Template</button>
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                                    <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div>
                                        <p className="text-sm font-medium text-blue-900">Format Instructions</p>
                                        <ul className="list-disc list-inside text-sm text-blue-700 mt-1 space-y-1">
                                            <li>Headers required: <strong>SKU, UpdateType, Quantity, Reason</strong></li>
                                            <li>UpdateType must be: <strong>add, set, deduct</strong></li>
                                            <li>Optional columns: <strong>Notes</strong></li>
                                        </ul>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* STEP 2: PREVIEW */}
                        {step === 2 && (
                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="flex-1 bg-green-50 border border-green-200 rounded-lg p-4">
                                        <p className="text-sm font-medium text-green-900">Valid Rows</p>
                                        <p className="text-2xl font-bold text-green-700">{parsedData.length}</p>
                                    </div>
                                    <div className={`flex-1 border rounded-lg p-4 ${validationErrors.length > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                                        <p className={`text-sm font-medium ${validationErrors.length > 0 ? 'text-red-900' : 'text-gray-900'}`}>Errors</p>
                                        <p className={`text-2xl font-bold ${validationErrors.length > 0 ? 'text-red-700' : 'text-gray-700'}`}>{validationErrors.length}</p>
                                    </div>
                                </div>

                                {validationErrors.length > 0 && (
                                    <div>
                                        <p className="text-sm font-medium text-red-600 mb-2">Validation Issues</p>
                                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Row</th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Input</th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Errors</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {validationErrors.map((err, idx) => (
                                                        <tr key={idx}>
                                                            <td className="px-4 py-2 text-sm text-gray-900">{err.row}</td>
                                                            <td className="px-4 py-2 text-sm font-mono text-gray-600">{JSON.stringify(err.data)}</td>
                                                            <td className="px-4 py-2 text-sm text-red-600">{err.errors.join(', ')}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <p className="text-sm font-medium text-gray-900 mb-2">Preview (First 5 valid rows)</p>
                                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {parsedData.slice(0, 5).map((row, idx) => (
                                                    <tr key={idx}>
                                                        <td className="px-4 py-2 text-sm font-mono text-gray-900">{row.sku}</td>
                                                        <td className="px-4 py-2 text-sm text-gray-900">
                                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${row.updateType === 'add' ? 'bg-green-100 text-green-800' :
                                                                row.updateType === 'deduct' ? 'bg-red-100 text-red-800' :
                                                                    'bg-blue-100 text-blue-800'
                                                                }`}>
                                                                {row.updateType.toUpperCase()}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-2 text-sm font-mono text-gray-900">{row.quantity}</td>
                                                        <td className="px-4 py-2 text-sm text-gray-500">{row.reason}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {parsedData.length > 5 && (
                                        <p className="text-xs text-center text-gray-500 mt-1">...and {parsedData.length - 5} more</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* STEP 3: RESULTS */}
                        {step === 3 && result && (
                            <div className="text-center py-6">
                                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                                    <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900">Bulk Update Complete</h3>
                                <p className="text-sm text-gray-500 mt-1">Processed {result.totalProcessed} records</p>

                                <div className="grid grid-cols-2 gap-4 mt-6 max-w-sm mx-auto">
                                    <div className="bg-green-50 rounded-lg p-3">
                                        <p className="text-xs text-green-600 font-medium uppercase">Success</p>
                                        <p className="text-2xl font-bold text-green-700">{result.successCount}</p>
                                    </div>
                                    <div className="bg-red-50 rounded-lg p-3">
                                        <p className="text-xs text-red-600 font-medium uppercase">Failed</p>
                                        <p className="text-2xl font-bold text-red-700">{result.failedCount}</p>
                                    </div>
                                </div>

                                {result.failedCount > 0 && (
                                    <div className="mt-6 text-left">
                                        <p className="text-sm font-medium text-red-600 mb-2">Failures</p>
                                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Error</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {result.results.failed.map((fail, idx) => (
                                                        <tr key={idx}>
                                                            <td className="px-4 py-2 text-sm font-mono text-gray-900">{fail.sku || fail.variantId}</td>
                                                            <td className="px-4 py-2 text-sm text-red-600">{fail.error}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                    </div>

                    <div className="bg-gray-50 px-6 py-4 flex flex-row-reverse gap-3 border-t border-gray-100">
                        {step === 1 && (
                            <button
                                type="button"
                                className="inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:w-auto sm:text-sm"
                                onClick={onClose}
                            >
                                Cancel
                            </button>
                        )}

                        {step === 2 && (
                            <>
                                <button
                                    type="button"
                                    disabled={processing || parsedData.length === 0}
                                    className={`w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:w-auto sm:text-sm ${processing || parsedData.length === 0 ? 'bg-purple-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'
                                        }`}
                                    onClick={handleProcess}
                                >
                                    {processing ? 'Processing...' : `Process ${parsedData.length} Updates`}
                                </button>
                                <button
                                    type="button"
                                    disabled={processing}
                                    className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:mt-0 sm:w-auto sm:text-sm"
                                    onClick={reset}
                                >
                                    Back
                                </button>
                            </>
                        )}

                        {step === 3 && (
                            <button
                                type="button"
                                className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:w-auto sm:text-sm"
                                onClick={() => { onClose(); reset(); }}
                            >
                                Done
                            </button>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default BulkUpdateModal;
