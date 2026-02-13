import React, { useCallback } from 'react';
import { Upload, X, FileText, AlertCircle } from 'lucide-react';
import { UploadedFile } from '../types';

interface FileUploadProps {
  files: UploadedFile[];
  setFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
}

export const FileUpload: React.FC<FileUploadProps> = ({ files, setFiles }) => {
  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles: UploadedFile[] = [];
      const fileList = Array.from(event.target.files) as File[];

      for (const file of fileList) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        await new Promise<void>((resolve) => {
          reader.onload = () => {
            const base64 = reader.result as string;
            // Remove data URL prefix (e.g., "data:application/pdf;base64,")
            const base64Data = base64.split(',')[1];
            newFiles.push({
              name: file.name,
              type: file.type,
              data: base64Data,
            });
            resolve();
          };
        });
      }
      setFiles((prev) => [...prev, ...newFiles]);
    }
  }, [setFiles]);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="bg-white border-2 border-dashed border-slate-300 rounded-xl p-10 text-center hover:bg-slate-50 transition-colors relative group cursor-pointer">
        <input
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt,image/*"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileChange}
        />
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-2">
            <Upload size={32} />
          </div>
          <h3 className="text-xl font-semibold text-slate-800">
            Drop your past exam papers here
          </h3>
          <p className="text-slate-500 max-w-md">
            Support for PDF, DOCX, and Images. Upload at least 2 years of data for accurate trend analysis.
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-8">
            <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Uploaded Documents ({files.length})</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {files.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-slate-200">
                <div className="flex items-center space-x-3">
                    <div className="bg-orange-100 p-2 rounded text-orange-600">
                        <FileText size={20} />
                    </div>
                    <span className="text-sm font-medium text-slate-700 truncate max-w-[200px]">{file.name}</span>
                </div>
                <button
                    onClick={() => removeFile(idx)}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                >
                    <X size={18} />
                </button>
                </div>
            ))}
            </div>
        </div>
      )}

        <div className="mt-6 flex items-start space-x-2 bg-blue-50 p-4 rounded-lg text-blue-700 text-sm">
            <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
            <p>
                <strong>Pro Tip:</strong> For best results, rename your files with the year (e.g., <code>Exam_2022.pdf</code>, <code>Paper_2023.pdf</code>) before uploading. This helps the AI understand the timeline.
            </p>
        </div>
    </div>
  );
};