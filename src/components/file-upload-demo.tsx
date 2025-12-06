"use client";

import { useState } from "react";

import { FileUpload } from "@/components/ui/file-upload";

export default function FileUploadDemo() {
	const [files, setFiles] = useState<File[]>([]);

	const handleFileUpload = (nextFiles: File[]) => {
		setFiles(nextFiles);
		console.log(nextFiles);
	};

	return (
		<div className="w-full max-w-4xl mx-auto min-h-96 border border-dashed bg-white dark:bg-black border-neutral-200 dark:border-neutral-800 rounded-lg">
			<FileUpload onChange={handleFileUpload} />
			<p className="px-4 py-2 text-xs text-neutral-500 dark:text-neutral-400">
				Selected files: {files.length}
			</p>
		</div>
	);
}
