import { cn } from "@/lib/utils";
import { IconUpload } from "@tabler/icons-react";
import { motion } from "motion/react";
import { useId, useState } from "react";
import { useDropzone } from "react-dropzone";

const GRID_ROWS = 11;
const GRID_COLS = 41;
const GRID_CELLS = Array.from(
	{ length: GRID_ROWS * GRID_COLS },
	(_, index) => ({
		index,
		isEven: index % 2 === 0,
	}),
);

type AcceptMap = Record<string, string[]>;

export const FileUpload = ({
	onChange,
	accept,
	disabled,
	id,
	containerClassName,
	files,
}: {
	onChange?: (files: File[]) => void;
	accept?: AcceptMap;
	disabled?: boolean;
	id?: string;
	containerClassName?: string;
	files?: File[] | FileList;
}) => {
	const [filesState, setFilesState] = useState<File[]>([]);
	const autoId = useId();
	const inputId = id ?? `file-upload-${autoId}`;

	const externalFiles =
		Array.isArray(files) ||
		(typeof FileList !== "undefined" && files instanceof FileList)
			? Array.from(files)
			: undefined;
	const displayFiles = externalFiles ?? filesState;

	const updateFiles = (updater: (prev: File[]) => File[]) => {
		setFilesState((prev) => {
			const base = externalFiles ?? prev;
			const next = updater(base);
			onChange?.(next);
			return next;
		});
	};

	const handleFileChange = (newFiles: File[]) => {
		updateFiles(() => (newFiles.length ? [newFiles[0]] : []));
	};

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		multiple: false,
		accept,
		disabled,
		onDrop: handleFileChange,
		onDropRejected: (error) => {
			console.log(error);
		},
	});

	const acceptAttr = accept
		? Object.entries(accept)
				.flatMap(([mime, exts]) => [mime, ...exts])
				.join(",")
		: undefined;

	const removeAt = (index: number) => {
		updateFiles((prev) => prev.filter((_, idx) => idx !== index));
	};

	return (
		<div className={cn("w-full", containerClassName)} {...getRootProps()}>
			<motion.div
				whileHover="animate"
				className="p-10 group/file block rounded-lg cursor-pointer w-full relative overflow-hidden transition ring-1 ring-transparent group-hover/file:ring-2"
				style={
					{
						"--tw-ring-color": "var(--input-hover-accent, var(--primary))",
					} as React.CSSProperties
				}
			>
				<input
					{...getInputProps({
						id: inputId,
						accept: acceptAttr,
						disabled,
					})}
					className="hidden"
				/>
				<div className="absolute inset-0 mask-[radial-gradient(ellipse_at_center,white,transparent)]">
					<GridPattern />
				</div>
				<div className="flex flex-col items-center justify-center">
					<p className="relative z-20 font-sans font-bold text-neutral-700 dark:text-neutral-300 text-base">
						Upload file
					</p>
					<p className="relative z-20 font-sans font-normal text-neutral-400 dark:text-neutral-400 text-base mt-2">
						Drag or drop your files here or click to upload
					</p>
					<div className="relative w-full mt-10 max-w-xl mx-auto">
						{displayFiles.length > 0 &&
							displayFiles.map((file, idx) => (
								<motion.div
									key={file.name + file.lastModified}
									className={cn(
										"relative overflow-hidden z-40 bg-white dark:bg-neutral-900 flex flex-col items-start justify-start md:h-24 p-4 mt-4 w-full mx-auto rounded-md",
										"shadow-sm",
									)}
								>
									<div className="flex justify-between w-full items-center gap-4">
										<motion.p
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											layout
											className="text-base text-neutral-700 dark:text-neutral-300 truncate max-w-xs"
										>
											{file.name}
										</motion.p>
										<motion.p
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											layout
											className="rounded-lg px-2 py-1 w-fit shrink-0 text-sm text-neutral-600 dark:bg-neutral-800 dark:text-white shadow-input"
										>
											{(file.size / (1024 * 1024)).toFixed(2)} MB
										</motion.p>
									</div>
									<div className="flex text-sm md:flex-row flex-col items-start md:items-center w-full mt-2 justify-between text-neutral-600 dark:text-neutral-400">
										<motion.p
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											layout
											className="px-1 py-0.5 rounded-md bg-gray-100 dark:bg-neutral-800 "
										>
											{file.type}
										</motion.p>
										<div className="flex items-center gap-3">
											<motion.p
												initial={{ opacity: 0 }}
												animate={{ opacity: 1 }}
												layout
												className="text-xs text-neutral-500 dark:text-neutral-400"
											>
												modified{" "}
												{new Date(file.lastModified).toLocaleDateString()}
											</motion.p>
											<button
												type="button"
												onClick={(e) => {
													e.preventDefault();
													e.stopPropagation();
													removeAt(idx);
												}}
												className="text-xs text-red-600 hover:underline dark:text-red-400"
											>
												Remove
											</button>
										</div>
									</div>
								</motion.div>
							))}
						{displayFiles.length === 0 && (
							<div
								className={cn(
									"relative z-40 bg-white dark:bg-neutral-900 flex items-center justify-center h-32 mt-4 w-full max-w-32 mx-auto rounded-md border border-dashed border-neutral-200 dark:border-neutral-700",
									"shadow-[0px_10px_50px_rgba(0,0,0,0.05)]",
								)}
							>
								{isDragActive ? (
									<p className="flex flex-col items-center text-neutral-600 dark:text-neutral-300">
										Drop it
										<IconUpload className="h-4 w-4" />
									</p>
								) : (
									<IconUpload className="h-4 w-4 text-neutral-600 dark:text-neutral-300" />
								)}
							</div>
						)}
					</div>
				</div>
			</motion.div>
		</div>
	);
};

export function GridPattern() {
	return (
		<div className="flex bg-gray-100 dark:bg-neutral-900 shrink-0 flex-wrap justify-center items-center gap-x-px gap-y-px  scale-105">
			{GRID_CELLS.map((cell) => (
				<div
					key={`cell-${cell.index}`}
					className={`w-10 h-10 flex shrink-0 rounded-[2px] ${
						cell.isEven
							? "bg-gray-50 dark:bg-neutral-950"
							: "bg-gray-50 dark:bg-neutral-950 shadow-[0px_0px_1px_3px_rgba(255,255,255,1)_inset] dark:shadow-[0px_0px_1px_3px_rgba(0,0,0,1)_inset]"
					}`}
				/>
			))}
		</div>
	);
}
