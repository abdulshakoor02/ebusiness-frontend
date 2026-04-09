"use client";

import { useState, useCallback, useRef } from "react";
import { useImportLeadsPreview, useImportLeadsConfirm } from "@/hooks/useLeads";
import { useUsers } from "@/hooks/useUsers";
import { usePermissions } from "@/context/PermissionsContext";
import { 
    ImportResult, 
    ImportPreviewResponse, 
    ImportPreviewMapping
} from "@/lib/schemas";
import { toast } from "sonner";
import {
    Loader2,
    Upload,
    FileSpreadsheet,
    CheckCircle2,
    AlertCircle,
    X,
    ArrowLeft,
    Sparkles,
    AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface ImportLeadsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = [".csv", ".xlsx"];
const SKIP_FIELD_VALUE = "__skip__";

export function ImportLeadsModal({ open, onOpenChange }: ImportLeadsModalProps) {
    const [phase, setPhase] = useState<"upload" | "mapping" | "results">("upload");
    const [file, setFile] = useState<File | null>(null);
    const [assignedTo, setAssignedTo] = useState<string | undefined>(undefined);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const [previewData, setPreviewData] = useState<ImportPreviewResponse | null>(null);
    const [editedMappings, setEditedMappings] = useState<ImportPreviewMapping[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const importPreview = useImportLeadsPreview();
    const importConfirm = useImportLeadsConfirm();
    const { role } = usePermissions();
    const isAdmin = role === "admin" || role === "superadmin";
    const { data: usersData } = useUsers(isAdmin ? { limit: 100 } : undefined);
    const users = usersData?.data || [];

    const resetState = useCallback(() => {
        setPhase("upload");
        setFile(null);
        setAssignedTo(undefined);
        setResult(null);
        setDragOver(false);
        setPreviewData(null);
        setEditedMappings([]);
    }, []);

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            resetState();
        }
        onOpenChange(newOpen);
    };

    const validateFile = (f: File): string | null => {
        const ext = "." + f.name.split(".").pop()?.toLowerCase();
        if (!ACCEPTED_EXTENSIONS.includes(ext)) {
            return "Unsupported file format. Please upload .xlsx or .csv files.";
        }
        if (f.size > MAX_FILE_SIZE) {
            return "File exceeds maximum size limit (10MB).";
        }
        return null;
    };

    const handleFileSelect = (f: File) => {
        const error = validateFile(f);
        if (error) {
            toast.error(error);
            return;
        }
        setFile(f);
    };

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setDragOver(false);
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile) {
                handleFileSelect(droppedFile);
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected) {
            handleFileSelect(selected);
        }
    };

    const handlePreview = () => {
        if (!file) return;

        importPreview.mutate(
            { file },
            {
                onSuccess: (data) => {
                    setPreviewData(data);
                    setEditedMappings(data.suggested_mappings);
                    setPhase("mapping");
                },
                onError: (error) => {
                    const err = error as { response?: { status?: number; data?: { error?: string } } };
                    const status = err?.response?.status;
                    const message = err?.response?.data?.error;
                    if (status === 400) {
                        toast.error(message || "Unsupported file format. Please upload .xlsx or .csv files.");
                    } else if (status === 500) {
                        toast.error("Server error. Please try again.");
                    } else {
                        toast.error("Preview failed", {
                            description: message || "An unexpected error occurred",
                        });
                    }
                },
            }
        );
    };

    const handleMappingChange = (columnIndex: number, newTargetField: string) => {
        setEditedMappings(prev => 
            prev.map(m => 
                m.column_index === columnIndex 
                    ? { ...m, target_field: newTargetField === SKIP_FIELD_VALUE ? "" : newTargetField }
                    : m
            )
        );
    };

    const handleConfirmImport = () => {
        if (!previewData) return;

        const activeMappings = editedMappings.filter(m => m.target_field !== "");

        if (activeMappings.length === 0) {
            toast.error("Please map at least one column to import");
            return;
        }

        importConfirm.mutate(
            {
                session_id: previewData.session_id,
                assigned_to: assignedTo,
                mappings: activeMappings,
            },
            {
                onSuccess: (data) => {
                    setResult(data);
                    setPhase("results");
                },
                onError: (error) => {
                    const err = error as { response?: { status?: number; data?: { error?: string } } };
                    const message = err?.response?.data?.error;
                    if (err?.response?.status === 400) {
                        toast.error(message || "Session expired. Please re-upload your file.");
                    } else {
                        toast.error("Import failed", {
                            description: message || "An unexpected error occurred",
                        });
                    }
                },
            }
        );
    };

    const handleBackToUpload = () => {
        setPhase("upload");
        setPreviewData(null);
        setEditedMappings([]);
        setAssignedTo(undefined);
    };

    const removeFile = () => {
        setFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 0.8) return "text-green-600";
        if (confidence >= 0.5) return "text-yellow-600";
        return "text-red-600";
    };

    const getConfidenceBg = (confidence: number) => {
        if (confidence >= 0.8) return "bg-green-100 dark:bg-green-900/30";
        if (confidence >= 0.5) return "bg-yellow-100 dark:bg-yellow-900/30";
        return "bg-red-100 dark:bg-red-900/30";
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>
                        {phase === "upload" && "Import Leads"}
                        {phase === "mapping" && "Review Column Mappings"}
                        {phase === "results" && "Import Results"}
                    </DialogTitle>
                    <DialogDescription>
                        {phase === "upload" && "Upload an Excel or CSV file to import leads into your pipeline."}
                        {phase === "mapping" && "Review the AI-suggested mappings and adjust if needed."}
                        {phase === "results" && "Your file has been processed. Review the results below."}
                    </DialogDescription>
                </DialogHeader>

                {phase === "upload" && (
                    <div className="space-y-4">
                        <div
                            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                                dragOver
                                    ? "border-primary bg-primary/5"
                                    : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600"
                            }`}
                            onClick={() => fileInputRef.current?.click()}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv,.xlsx"
                                className="hidden"
                                onChange={handleInputChange}
                            />
                            {file ? (
                                <div className="flex items-center justify-center gap-2">
                                    <FileSpreadsheet className="h-8 w-8 text-green-600" />
                                    <div className="text-left">
                                        <p className="font-medium text-sm">{file.name}</p>
                                        <p className="text-xs text-zinc-500">
                                            {(file.size / 1024).toFixed(1)} KB
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="ml-2 h-8 w-8 p-0"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeFile();
                                        }}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Upload className="h-10 w-10 mx-auto text-zinc-400" />
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                        Drag & drop your file here, or click to browse
                                    </p>
                                    <p className="text-xs text-zinc-400">
                                        Supports .csv and .xlsx (max 10MB)
                                    </p>
                                </div>
                            )}
                        </div>

                        <p className="text-xs text-zinc-500">
                            Upload an Excel or CSV file with your lead data. Column headers are
                            mapped automatically using AI. You&apos;ll be able to review and adjust mappings before importing.
                        </p>

                        <div className="flex justify-end gap-3 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleOpenChange(false)}
                                disabled={importPreview.isPending}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handlePreview}
                                disabled={!file || importPreview.isPending}
                            >
                                {importPreview.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Analyzing...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="mr-2 h-4 w-4" />
                                        Preview Mappings
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}

                {phase === "mapping" && previewData && (
                    <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <FileSpreadsheet className="h-4 w-4 text-zinc-500" />
                                <span className="font-medium">{file?.name}</span>
                                <Badge variant="secondary">{previewData.total_rows} rows</Badge>
                            </div>
                        </div>

                        <div className="border rounded-lg p-3 bg-zinc-50 dark:bg-zinc-900">
                            <p className="text-xs text-zinc-500 mb-2">Sample Data Preview (first {previewData.sample_rows.length} rows)</p>
                            <div className="h-[120px] overflow-auto">
                                <div className="overflow-x-auto">
                                    <table className="text-xs w-full">
                                        <thead>
                                            <tr className="border-b">
                                                {previewData.headers.map((header, i) => (
                                                    <th key={i} className="px-2 py-1 text-left font-medium whitespace-nowrap">
                                                        {header}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {previewData.sample_rows.map((row, i) => (
                                                <tr key={i} className="border-b last:border-b-0">
                                                    {row.map((cell, j) => (
                                                        <td key={j} className="px-2 py-1 text-zinc-600 dark:text-zinc-400 whitespace-nowrap max-w-[150px] truncate">
                                                            {cell}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-hidden flex flex-col">
                            <p className="text-sm font-medium mb-2">Column Mappings</p>
                            <div className="flex-1 overflow-auto">
                                <div className="space-y-2 pr-2">
                                    {editedMappings.map((mapping, index) => {
                                        const isLowConfidence = mapping.confidence < 0.8 && mapping.target_field !== "";
                                        
                                        return (
                                            <div 
                                                key={`${mapping.column_index}-${index}`} 
                                                className={`flex items-center gap-3 p-2 rounded-lg border ${isLowConfidence ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/10' : 'border-zinc-200 dark:border-zinc-700'}`}
                                            >
                                                <div className="w-[120px] shrink-0">
                                                    <p className="text-sm font-medium truncate" title={mapping.header_name}>
                                                        {mapping.header_name}
                                                    </p>
                                                </div>
                                                
                                                <ArrowLeft className="h-4 w-4 text-zinc-400 shrink-0" />
                                                
                                                <Select
                                                    value={mapping.target_field || SKIP_FIELD_VALUE}
                                                    onValueChange={(v) => handleMappingChange(mapping.column_index, v)}
                                                >
                                                    <SelectTrigger className="flex-1">
                                                        <SelectValue placeholder="Select field..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value={SKIP_FIELD_VALUE}>
                                                            <span className="text-zinc-400">Skip this column</span>
                                                        </SelectItem>
                                                        {previewData.available_target_fields.map((field) => (
                                                            <SelectItem key={field.name} value={field.name}>
                                                                {field.label}
                                                                {field.type === "reference" && (
                                                                    <span className="text-zinc-400 ml-1">({field.reference_type})</span>
                                                                )}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                
                                                <div className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded ${getConfidenceBg(mapping.confidence)}`}>
                                                    {mapping.confidence >= 0.8 ? (
                                                        <CheckCircle2 className={`h-3 w-3 ${getConfidenceColor(mapping.confidence)}`} />
                                                    ) : mapping.confidence >= 0.5 ? (
                                                        <AlertTriangle className={`h-3 w-3 ${getConfidenceColor(mapping.confidence)}`} />
                                                    ) : (
                                                        <AlertCircle className={`h-3 w-3 ${getConfidenceColor(mapping.confidence)}`} />
                                                    )}
                                                    <span className={`text-xs ${getConfidenceColor(mapping.confidence)}`}>
                                                        {Math.round(mapping.confidence * 100)}%
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {(previewData.existing_categories.length > 0 || 
                          previewData.existing_sources.length > 0 || 
                          previewData.existing_qualifications.length > 0) && (
                            <div className="border rounded-lg p-3 bg-zinc-50 dark:bg-zinc-900">
                                <p className="text-xs text-zinc-500 mb-2">Existing Reference Data</p>
                                <div className="flex flex-wrap gap-1">
                                    {previewData.existing_categories.slice(0, 5).map((cat) => (
                                        <Badge key={`cat-${cat.id}`} variant="secondary" className="text-xs">
                                            {cat.name}
                                        </Badge>
                                    ))}
                                    {previewData.existing_categories.length > 5 && (
                                        <Badge variant="outline" className="text-xs">
                                            +{previewData.existing_categories.length - 5} more
                                        </Badge>
                                    )}
                                    {previewData.existing_sources.slice(0, 5).map((src) => (
                                        <Badge key={`src-${src.id}`} variant="outline" className="text-xs">
                                            {src.name}
                                        </Badge>
                                    ))}
                                    {previewData.existing_sources.length > 5 && (
                                        <Badge variant="outline" className="text-xs">
                                            +{previewData.existing_sources.length - 5} more
                                        </Badge>
                                    )}
                                    {previewData.existing_qualifications.slice(0, 5).map((qual) => (
                                        <Badge key={`qual-${qual.id}`} variant="outline" className="text-xs border-blue-200">
                                            {qual.name}
                                        </Badge>
                                    ))}
                                    {previewData.existing_qualifications.length > 5 && (
                                        <Badge variant="outline" className="text-xs border-blue-200">
                                            +{previewData.existing_qualifications.length - 5} more
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        )}

                        {isAdmin && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Assign To (Optional)</label>
                                <Select
                                    value={assignedTo || "__none__"}
                                    onValueChange={(v) =>
                                        setAssignedTo(v === "__none__" ? undefined : v)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="No assignment" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">No assignment</SelectItem>
                                        {users.map((user) => (
                                            <SelectItem key={user.id} value={user.id}>
                                                {user.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="flex justify-between gap-3 pt-2 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleBackToUpload}
                                disabled={importConfirm.isPending}
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                            </Button>
                            <Button
                                onClick={handleConfirmImport}
                                disabled={importConfirm.isPending}
                            >
                                {importConfirm.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Importing...
                                    </>
                                ) : (
                                    "Confirm Import"
                                )}
                            </Button>
                        </div>
                    </div>
                )}

                {phase === "results" && (
                    <div className="space-y-4">
                        {result && (
                            <>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="rounded-lg border p-3 text-center">
                                        <p className="text-2xl font-bold">{result.total_rows}</p>
                                        <p className="text-xs text-zinc-500">Total Rows</p>
                                    </div>
                                    <div className="rounded-lg border p-3 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                                            <p className="text-2xl font-bold text-green-600">
                                                {result.inserted}
                                            </p>
                                        </div>
                                        <p className="text-xs text-zinc-500">Inserted</p>
                                    </div>
                                    {result.skipped > 0 && (
                                        <div className="rounded-lg border p-3 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <AlertCircle className="h-4 w-4 text-orange-500" />
                                                <p className="text-2xl font-bold text-orange-500">
                                                    {result.skipped}
                                                </p>
                                            </div>
                                            <p className="text-xs text-zinc-500">Skipped</p>
                                        </div>
                                    )}
                                </div>

                                {(result.created_categories.length > 0 ||
                                    result.created_sources.length > 0) && (
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium">Auto-created Items</p>
                                        <div className="flex flex-wrap gap-2">
                                            {result.created_categories.map((cat) => (
                                                <Badge key={`cat-${cat}`} variant="secondary">
                                                    {cat}
                                                </Badge>
                                            ))}
                                            {result.created_sources.map((src) => (
                                                <Badge key={`src-${src}`} variant="outline">
                                                    {src}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {result.errors.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium">Errors</p>
                                            <Badge variant="destructive">
                                                {result.errors.length}
                                            </Badge>
                                        </div>
                                        <div className="max-h-[200px] overflow-auto rounded-md border">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="w-[60px]">Row</TableHead>
                                                        <TableHead className="w-[100px]">Field</TableHead>
                                                        <TableHead>Value</TableHead>
                                                        <TableHead>Reason</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {result.errors.map((err, i) => (
                                                        <TableRow key={i}>
                                                            <TableCell className="text-xs">
                                                                {err.row}
                                                            </TableCell>
                                                            <TableCell className="text-xs font-medium">
                                                                {err.field}
                                                            </TableCell>
                                                            <TableCell className="text-xs text-zinc-500 max-w-[150px] truncate">
                                                                {err.value}
                                                            </TableCell>
                                                            <TableCell className="text-xs text-zinc-500">
                                                                {err.reason}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        <div className="flex justify-end pt-2">
                            <Button onClick={() => handleOpenChange(false)}>Close</Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
