/**
 * Web worker for background processing of task indexing
 */

import { CachedMetadata, FileStats } from "obsidian"; // Assuming ListItemCache is not directly available/serializable to worker, rely on regex
import { Task } from "../types/TaskIndex"; // Task type definition needed
import {
	// Assume these types are defined and exported from TaskIndexWorkerMessage.ts
	// Need to add preferMetadataFormat to IndexerCommand payloads where relevant
	IndexerCommand,
	TaskParseResult,
	ErrorResult,
	BatchIndexResult, BatchIndexCommand, // Keep if batch processing is still used
} from "./TaskIndexWorkerMessage";
import { parse } from "date-fns/parse";
import { parseLocalDate } from "../dateUtil";
import {
	TASK_REGEX,
	EMOJI_START_DATE_REGEX,
	EMOJI_COMPLETED_DATE_REGEX,
	EMOJI_DUE_DATE_REGEX,
	EMOJI_SCHEDULED_DATE_REGEX,
	EMOJI_CREATED_DATE_REGEX,
	EMOJI_RECURRENCE_REGEX,
	EMOJI_PRIORITY_REGEX,
	EMOJI_CONTEXT_REGEX,
	EMOJI_PROJECT_PREFIX,
	DV_START_DATE_REGEX,
	DV_COMPLETED_DATE_REGEX,
	DV_DUE_DATE_REGEX,
	DV_SCHEDULED_DATE_REGEX,
	DV_CREATED_DATE_REGEX,
	DV_RECURRENCE_REGEX,
	DV_PRIORITY_REGEX,
	DV_PROJECT_REGEX,
	DV_CONTEXT_REGEX,
	ANY_DATAVIEW_FIELD_REGEX,
	EMOJI_TAG_REGEX,
} from "../../common/regex-define";
import { PRIORITY_MAP } from "../../common/default-symbol";

type MetadataFormat = "tasks" | "dataview"; // Define the type for clarity

// --- Refactored Metadata Extraction Functions ---

// Each function now takes task, content, and format, returns remaining content
// They modify the task object directly.

function extractDates(
	task: Task,
	content: string,
	format: MetadataFormat
): string {
	let remainingContent = content;
	const useDataview = format === "dataview";

	const tryParseAndAssign = (
		regex: RegExp,
		fieldName:
			| "dueDate"
			| "scheduledDate"
			| "startDate"
			| "completedDate"
			| "createdDate"
	): boolean => {
		if (task[fieldName] !== undefined) return false; // Already assigned

		const match = remainingContent.match(regex);
		if (match && match[1]) {
			const dateVal = parseLocalDate(match[1]);
			if (dateVal !== undefined) {
				task[fieldName] = dateVal; // Direct assignment is type-safe
				remainingContent = remainingContent.replace(match[0], "");
				return true;
			}
		}
		return false;
	};

	// Due Date
	if (useDataview) {
		!tryParseAndAssign(DV_DUE_DATE_REGEX, "dueDate") &&
			tryParseAndAssign(EMOJI_DUE_DATE_REGEX, "dueDate");
	} else {
		!tryParseAndAssign(EMOJI_DUE_DATE_REGEX, "dueDate") &&
			tryParseAndAssign(DV_DUE_DATE_REGEX, "dueDate");
	}

	// Scheduled Date
	if (useDataview) {
		!tryParseAndAssign(DV_SCHEDULED_DATE_REGEX, "scheduledDate") &&
			tryParseAndAssign(EMOJI_SCHEDULED_DATE_REGEX, "scheduledDate");
	} else {
		!tryParseAndAssign(EMOJI_SCHEDULED_DATE_REGEX, "scheduledDate") &&
			tryParseAndAssign(DV_SCHEDULED_DATE_REGEX, "scheduledDate");
	}

	// Start Date
	if (useDataview) {
		!tryParseAndAssign(DV_START_DATE_REGEX, "startDate") &&
			tryParseAndAssign(EMOJI_START_DATE_REGEX, "startDate");
	} else {
		!tryParseAndAssign(EMOJI_START_DATE_REGEX, "startDate") &&
			tryParseAndAssign(DV_START_DATE_REGEX, "startDate");
	}

	// Completion Date
	if (useDataview) {
		!tryParseAndAssign(DV_COMPLETED_DATE_REGEX, "completedDate") &&
			tryParseAndAssign(EMOJI_COMPLETED_DATE_REGEX, "completedDate");
	} else {
		!tryParseAndAssign(EMOJI_COMPLETED_DATE_REGEX, "completedDate") &&
			tryParseAndAssign(DV_COMPLETED_DATE_REGEX, "completedDate");
	}

	// Created Date
	if (useDataview) {
		!tryParseAndAssign(DV_CREATED_DATE_REGEX, "createdDate") &&
			tryParseAndAssign(EMOJI_CREATED_DATE_REGEX, "createdDate");
	} else {
		!tryParseAndAssign(EMOJI_CREATED_DATE_REGEX, "createdDate") &&
			tryParseAndAssign(DV_CREATED_DATE_REGEX, "createdDate");
	}

	return remainingContent;
}

function extractRecurrence(
	task: Task,
	content: string,
	format: MetadataFormat
): string {
	let remainingContent = content;
	const useDataview = format === "dataview";
	let match: RegExpMatchArray | null = null;

	if (useDataview) {
		match = remainingContent.match(DV_RECURRENCE_REGEX);
		if (match && match[1]) {
			task.recurrence = match[1].trim();
			remainingContent = remainingContent.replace(match[0], "");
			return remainingContent; // Found preferred format
		}
	}

	// Try emoji format (primary or fallback)
	match = remainingContent.match(EMOJI_RECURRENCE_REGEX);
	if (match && match[1]) {
		task.recurrence = match[1].trim();
		remainingContent = remainingContent.replace(match[0], "");
	}

	return remainingContent;
}

function extractPriority(
	task: Task,
	content: string,
	format: MetadataFormat
): string {
	let remainingContent = content;
	const useDataview = format === "dataview";
	let match: RegExpMatchArray | null = null;

	if (useDataview) {
		match = remainingContent.match(DV_PRIORITY_REGEX);
		if (match && match[1]) {
			const priorityValue = match[1].trim().toLowerCase();
			const mappedPriority = PRIORITY_MAP[priorityValue];
			if (mappedPriority !== undefined) {
				task.priority = mappedPriority;
				remainingContent = remainingContent.replace(match[0], "");
				return remainingContent;
			} else {
				const numericPriority = parseInt(priorityValue, 10);
				if (!isNaN(numericPriority)) {
					task.priority = numericPriority;
					remainingContent = remainingContent.replace(match[0], "");
					return remainingContent;
				}
			}
		}
	}

	// Try emoji format (primary or fallback)
	match = remainingContent.match(EMOJI_PRIORITY_REGEX);
	if (match && match[1]) {
		task.priority = PRIORITY_MAP[match[1]] ?? undefined;
		if (task.priority !== undefined) {
			remainingContent = remainingContent.replace(match[0], "");
		}
	}

	return remainingContent;
}

function extractProject(
	task: Task,
	content: string,
	format: MetadataFormat
): string {
	let remainingContent = content;
	const useDataview = format === "dataview";
	let match: RegExpMatchArray | null = null;

	if (useDataview) {
		match = remainingContent.match(DV_PROJECT_REGEX);
		if (match && match[1]) {
			task.project = match[1].trim();
			remainingContent = remainingContent.replace(match[0], "");
			return remainingContent; // Found preferred format
		}
	}

	// Try #project/ prefix (primary or fallback)
	const projectTagRegex = new RegExp(EMOJI_PROJECT_PREFIX + "([\\w/-]+)");
	match = remainingContent.match(projectTagRegex);
	if (match && match[1]) {
		task.project = match[1].trim();
		// Do not remove here; let tag extraction handle it
	}

	return remainingContent;
}

function extractContext(
	task: Task,
	content: string,
	format: MetadataFormat
): string {
	let remainingContent = content;
	const useDataview = format === "dataview";
	let match: RegExpMatchArray | null = null;

	if (useDataview) {
		match = remainingContent.match(DV_CONTEXT_REGEX);
		if (match && match[1]) {
			task.context = match[1].trim();
			remainingContent = remainingContent.replace(match[0], "");
			return remainingContent; // Found preferred format
		}
	}

	// Skip @ contexts inside wiki links [[...]]
	// First, extract all wiki link patterns
	const wikiLinkMatches: string[] = [];
	const wikiLinkRegex = /\[\[([^\]]+)\]\]/g;
	let wikiMatch;
	while ((wikiMatch = wikiLinkRegex.exec(remainingContent)) !== null) {
		wikiLinkMatches.push(wikiMatch[0]);
	}

	// Try @ prefix (primary or fallback)
	// Use .exec to find the first match only for @context
	const contextMatch = new RegExp(EMOJI_CONTEXT_REGEX.source, "").exec(
		remainingContent
	); // Non-global search for first

	if (contextMatch && contextMatch[1]) {
		// Check if this @context is inside a wiki link
		const matchPosition = contextMatch.index;
		const isInsideWikiLink = wikiLinkMatches.some((link) => {
			const linkStart = remainingContent.indexOf(link);
			const linkEnd = linkStart + link.length;
			return matchPosition >= linkStart && matchPosition < linkEnd;
		});

		// Only process if not inside a wiki link
		if (!isInsideWikiLink) {
			task.context = contextMatch[1].trim();
			// Remove the first matched context tag here to avoid it being parsed as a general tag
			remainingContent = remainingContent.replace(contextMatch[0], "");
		}
	}

	return remainingContent;
}

function extractTags(
	task: Task,
	content: string,
	format: MetadataFormat
): string {
	let remainingContent = content;
	const useDataview = format === "dataview";

	// If using Dataview, remove all potential DV fields first
	if (useDataview) {
		remainingContent = remainingContent.replace(
			ANY_DATAVIEW_FIELD_REGEX,
			""
		);
	}

	// Exclude links (both wiki and markdown) from tag processing
	const wikiLinkRegex = /\[\[(?!.+?:)([^\]\[]+)\|([^\]\[]+)\]\]/g;
	const markdownLinkRegex = /\[([^\[\]]*)\]\((.*?)\)/g; // Final attempt at correctly escaped regex for [text](link)
	const links: { text: string; start: number; end: number }[] = [];
	let linkMatch: RegExpExecArray | null; // Explicit type for linkMatch
	let processedContent = remainingContent;

	// Find all wiki links and their positions
	wikiLinkRegex.lastIndex = 0; // Reset regex state
	while ((linkMatch = wikiLinkRegex.exec(remainingContent)) !== null) {
		links.push({
			text: linkMatch[0],
			start: linkMatch.index,
			end: linkMatch.index + linkMatch[0].length,
		});
	}

	// Find all markdown links and their positions
	markdownLinkRegex.lastIndex = 0; // Reset regex state
	while ((linkMatch = markdownLinkRegex.exec(remainingContent)) !== null) {
		// Avoid adding if it overlaps with an existing wiki link (though unlikely)
		const overlaps = links.some(
			(l) =>
				Math.max(l.start, linkMatch!.index) < // Use non-null assertion
				Math.min(l.end, linkMatch!.index + linkMatch![0].length) // Use non-null assertion
		);
		if (!overlaps) {
			links.push({
				text: linkMatch![0], // Use non-null assertion
				start: linkMatch!.index, // Use non-null assertion
				end: linkMatch!.index + linkMatch![0].length, // Use non-null assertion
			});
		}
	}

	// Sort links by start position to process them correctly
	links.sort((a, b) => a.start - b.start);

	// Temporarily replace links with placeholders
	if (links.length > 0) {
		let offset = 0;
		for (const link of links) {
			const adjustedStart = link.start - offset;
			// Ensure adjustedStart is not negative (can happen with overlapping regex logic, though we try to avoid it)
			if (adjustedStart < 0) continue;
			const placeholder = "".padStart(link.text.length, " "); // Replace with spaces
			processedContent =
				processedContent.substring(0, adjustedStart) +
				placeholder +
				processedContent.substring(adjustedStart + link.text.length);
			// Offset doesn't change because placeholder length matches link text length
		}
	}

	// Find all #tags in the content with links replaced by placeholders
	const tagMatches = processedContent.match(EMOJI_TAG_REGEX) || [];
	task.tags = tagMatches.map((tag) => tag.trim());

	// If using 'tasks' (emoji) format, derive project from tags if not set
	// Also make sure project wasn't already set by DV format before falling back
	if (!useDataview && !task.project) {
		const projectTag = task.tags.find((tag) =>
			tag.startsWith(EMOJI_PROJECT_PREFIX)
		);
		if (projectTag) {
			task.project = projectTag.substring(EMOJI_PROJECT_PREFIX.length);
		}
	}

	// If using Dataview format, filter out any remaining #project/ tags from the tag list
	if (useDataview) {
		task.tags = task.tags.filter(
			(tag) => !tag.startsWith(EMOJI_PROJECT_PREFIX)
		);
	}

	// Remove found tags (including potentially #project/ tags if format is 'tasks') from the original remaining content
	let contentWithoutTagsOrContext = remainingContent;
	for (const tag of task.tags) {
		// Ensure the tag is not empty or just '#' before creating regex
		if (tag && tag !== "#") {
			// Use word boundaries (or start/end of string/space) to avoid partial matches within links if tags are not fully removed initially
			// Regex: (?:^|\s)TAG(?=\s|$)
			// Need to escape the tag content properly.
			const escapedTag = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
			// Match tag optionally preceded by whitespace, followed by whitespace or end of line.
			// The negative lookbehind (?<!...) might be useful but JS support varies. Using simpler approach.
			// Simpler approach: Replace ` TAG` or `TAG ` or `TAG` (at end). This is tricky.
			// Let's try replacing ` TAG` and `TAG ` first, then handle start/end cases.
			// Even simpler: replace the tag if surrounded by whitespace or at start/end.
			// Use a regex that captures the tag with potential surrounding whitespace/boundaries
			const tagRegex = new RegExp(
				// `(^|\\s)` // Start of string or whitespace
				`\\s?` + // Optional preceding space (handles beginning of line implicitly sometimes)
					escapedTag +
					// `(?=\\s|$)` // Followed by whitespace or end of string
					`(?=\\s|$)`, // Lookahead for space or end of string
				"g"
			);
			// Replace the match (space + tag) with an empty string or just a space if needed?
			// Replacing with empty string might collapse words. Let's try replacing with space if preceded by space.
			// This is getting complex. Let's stick to removing the tag and potentially adjacent space carefully.
			contentWithoutTagsOrContext = contentWithoutTagsOrContext.replace(
				tagRegex,
				""
			);
		}
	}

	// Also remove any remaining @context tags, making sure not to remove them from within links
	let finalContent = "";
	let lastIndex = 0;
	processedContent = contentWithoutTagsOrContext; // Start with content that had tags removed

	// Sort links again just in case order matters for reconstruction
	links.sort((a, b) => a.start - b.start);

	if (links.length > 0) {
		// Process content segments between links
		for (const link of links) {
			const segment = processedContent.substring(lastIndex, link.start);
			// Remove @context from the segment
			finalContent += segment.replace(/@[\w-]+/g, "").trim();
			// Add the original link back
			finalContent += link.text;
			lastIndex = link.end;
		}
		// Process the remaining segment after the last link
		const lastSegment = processedContent.substring(lastIndex);
		finalContent += lastSegment.replace(/@[\w-]+/g, "").trim();
	} else {
		// No links, safe to remove @context directly from the whole content
		finalContent = processedContent.replace(/@[\w-]+/g, "").trim();
	}

	// Clean up extra spaces that might result from replacements
	finalContent = finalContent.replace(/\s{2,}/g, " ").trim();

	return finalContent;
}

/**
 * Parse tasks from file content using regex and metadata format preference
 */
function parseTasksFromContent(
	filePath: string,
	content: string,
	format: MetadataFormat,
	fileCache: CachedMetadata | null,
): Task[] {
	const lines = content.split(/\r?\n/);
	const tasks: Task[] = [];

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const taskMatch = line.match(TASK_REGEX);

		if (taskMatch) {
			const [fullMatch, , , , status, contentWithMetadata] = taskMatch;
			if (status === undefined || contentWithMetadata === undefined)
				continue;

			const completed = status.toLowerCase() === "x";
			const id = `${filePath}-L${i}`;

			const task: Task = {
				id,
				content: contentWithMetadata.trim(), // Will be set after extraction
				filePath,
				line: i,
				completed,
				status: status,
				originalMarkdown: line,
				tags: [],
				children: [],
				priority: undefined,
				startDate: undefined,
				dueDate: undefined,
				scheduledDate: undefined,
				completedDate: undefined,
				createdDate: undefined,
				recurrence: undefined,
				project: undefined,
				context: undefined,
			};

			// Extract metadata in order
			let remainingContent = contentWithMetadata;
			remainingContent = extractDates(task, remainingContent, format);
			remainingContent = extractRecurrence(
				task,
				remainingContent,
				format
			);
			remainingContent = extractPriority(task, remainingContent, format);
			remainingContent = extractProject(task, remainingContent, format); // Extract project before context/tags
			remainingContent = extractContext(task, remainingContent, format);
			remainingContent = extractTags(task, remainingContent, format); // Tags last

			task.content = remainingContent.replace(/\s{2,}/g, " ").trim();
			extractAmbientProperties(task, content, fileCache);

			tasks.push(task);
		}
	}
	buildTaskHierarchy(tasks); // Call hierarchy builder if needed
	return tasks;
}
/**
 * Extract date from file path
 */
function extractDateFromPath(
	filePath: string,
	settings: {
		useDailyNotePathAsDate: boolean;
		dailyNoteFormat: string;
		dailyNotePath: string;
	}
): number | undefined {
	if (!settings.useDailyNotePathAsDate) return undefined;

	// Remove file extension first
	let pathToMatch = filePath.replace(/\.[^/.]+$/, "");

	// If dailyNotePath is specified, remove it from the path
	if (
		settings.dailyNotePath &&
		pathToMatch.startsWith(settings.dailyNotePath)
	) {
		pathToMatch = pathToMatch.substring(settings.dailyNotePath.length);
		// Remove leading slash if present
		if (pathToMatch.startsWith("/")) {
			pathToMatch = pathToMatch.substring(1);
		}
	}

	// Try to match with the current path
	let dateFromPath = parse(pathToMatch, settings.dailyNoteFormat, new Date());

	// If no match, recursively try with subpaths
	if (isNaN(dateFromPath.getTime()) && pathToMatch.includes("/")) {
		return extractDateFromPath(
			pathToMatch.substring(pathToMatch.indexOf("/") + 1),
			{
				...settings,
				dailyNotePath: "", // Clear dailyNotePath for recursive calls
			}
		);
	}

	// Return the timestamp if we found a valid date
	if (!isNaN(dateFromPath.getTime())) {
		return dateFromPath.getTime();
	}

	return undefined;
}

function extractAmbientProperties(task: Task, content: string, fileCache: CachedMetadata | null): void {
	// Extract just the filename from the path and check if it's a daily note
	const basename = task.filePath.split("/").pop() || task.filePath;
	// const dailyNoteMatch = basename.match(/(\d{4}-\d{2}-\d{2})\.md$/);
	//
	// if (dailyNoteMatch && !task.scheduledDate) {
	// 	try {
	// 		const time = new Date(dailyNoteMatch[1]).getTime();
	// 		task.scheduledDate = time;
	// 		task.dueDate = time;
	// 	} catch (e) {
	// 		console.error("Failed to parse daily note date:", dailyNoteMatch[1], e);
	// 	}
	// }

	if (fileCache) {
		console.log("FileCache found", task.filePath, fileCache);
	}

	if (fileCache?.tags) {
		console.log("PAM", task.filePath, fileCache.tags);
		if (fileCache.tags.find((x) => x.tag === "#project")) {
			task.project = basename.replace('.md', '');
		}
	}
}

/**
 * Process a single file - NOW ACCEPTS METADATA FORMAT
 */
function processFile(
	filePath: string,
	content: string,
	stats: FileStats,
	settings: {
		preferMetadataFormat: MetadataFormat;
		useDailyNotePathAsDate: boolean;
		dailyNoteFormat: string;
		useAsDateType: "due" | "start" | "scheduled";
		dailyNotePath: string;
	},
	fileCache: CachedMetadata | null,
): TaskParseResult {
	const startTime = performance.now();
	try {
		const tasks = parseTasksFromContent(
			filePath,
			content,
			settings.preferMetadataFormat,
			fileCache
		);
		const completedTasks = tasks.filter((t) => t.completed).length;
		try {
			if (
				(filePath.startsWith(settings.dailyNotePath) ||
					("/" + filePath).startsWith(settings.dailyNotePath)) &&
				settings.dailyNotePath &&
				settings.useDailyNotePathAsDate
			) {
				for (const task of tasks) {
					const dateFromPath = extractDateFromPath(filePath, {
						useDailyNotePathAsDate: settings.useDailyNotePathAsDate,
						dailyNoteFormat: settings.dailyNoteFormat
							.replace(/Y/g, "y")
							.replace(/D/g, "d"),
						dailyNotePath: settings.dailyNotePath,
					});
					if (dateFromPath) {
						if (settings.useAsDateType === "due" && !task.dueDate) {
							task.dueDate = dateFromPath;
						} else if (
							settings.useAsDateType === "start" &&
							!task.startDate
						) {
							task.startDate = dateFromPath;
						} else if (
							settings.useAsDateType === "scheduled" &&
							!task.scheduledDate
						) {
							task.scheduledDate = dateFromPath;
						}

						task.useAsDateType = settings.useAsDateType;
					}
				}
			}
		} catch (error) {
			console.error(`Worker: Error processing file ${filePath}:`, error);
		}

		return {
			type: "parseResult",
			filePath,
			tasks,
			stats: {
				totalTasks: tasks.length,
				completedTasks,
				processingTimeMs: Math.round(performance.now() - startTime),
			},
		};
	} catch (error) {
		console.error(`Worker: Error processing file ${filePath}:`, error);
		throw error;
	}
}

// --- Batch processing function remains largely the same, but calls updated processFile ---
function processBatch(
	files: BatchIndexCommand['files'],
	settings: {
		preferMetadataFormat: MetadataFormat;
		useDailyNotePathAsDate: boolean;
		dailyNoteFormat: string;
		useAsDateType: "due" | "start" | "scheduled";
		dailyNotePath: string;
	}
): BatchIndexResult {
	// Ensure return type matches definition
	const startTime = performance.now();
	const results: { filePath: string; taskCount: number }[] = [];
	let totalTasks = 0;
	let failedFiles = 0; // Keep track for potential logging, but not returned in stats

	for (const file of files) {
		try {
			const parseResult = processFile(
				file.path,
				file.content,
				file.stats,
				settings,
				file.metadata || null,
			);
			totalTasks += parseResult.stats.totalTasks;
			results.push({
				filePath: parseResult.filePath,
				taskCount: parseResult.stats.totalTasks,
			});
		} catch (error) {
			console.error(
				`Worker: Error in batch processing for file ${file.path}:`,
				error
			);
			failedFiles++;
		}
	}

	return {
		type: "batchResult",
		results, // Now matches expected type
		stats: {
			// Only include fields defined in the type
			totalFiles: files.length,
			totalTasks,
			processingTimeMs: Math.round(performance.now() - startTime),
		},
	};
}

// --- Update message handler to access properties directly ---
self.onmessage = async (event) => {
	try {
		const message = event.data as IndexerCommand; // Keep using IndexerCommand union type

		// Access preferMetadataFormat directly FROM message, NOT message.payload
		// Provide default 'tasks' if missing
		const settings = message.settings || {
			preferMetadataFormat: "tasks",
			useDailyNotePathAsDate: false,
			dailyNoteFormat: "yyyy-MM-dd",
			useAsDateType: "due",
			dailyNotePath: "",
		};

		// Using 'as any' here because I cannot modify IndexerCommand type directly,
		// but the sending code MUST add this property to the message object.

		if (message.type === "parseTasks") {
			// Type guard for ParseTasksCommand
			try {
				// Access properties directly from message
				const result = processFile(
					message.filePath,
					message.content,
					message.stats,
					settings,
					message.metadata?.fileCache || null
				);
				self.postMessage(result);
			} catch (error) {
				self.postMessage({
					type: "error",
					error:
						error instanceof Error ? error.message : String(error),
					filePath: message.filePath, // Access directly
				} as ErrorResult);
			}
		} else if (message.type === "batchIndex") {
			// Type guard for BatchIndexCommand
			// Access properties directly from message
			const result = processBatch(message.files, settings);
			self.postMessage(result);
		} else {
			console.error(
				"Worker: Unknown or invalid command message:",
				message
			);
			self.postMessage({
				type: "error",
				error: `Unknown command type: ${(message as any).type}`,
			} as ErrorResult);
		}
	} catch (error) {
		console.error("Worker: General error in onmessage handler:", error);
		self.postMessage({
			type: "error",
			error: error instanceof Error ? error.message : String(error),
		} as ErrorResult);
	}
};

// Remove buildTaskHierarchy and getIndentLevel if not used by parseTasksFromContent
// Or keep them if you plan to add indentation-based hierarchy later.
/**
 * Build parent-child relationships based on indentation
 */
function buildTaskHierarchy(tasks: Task[]): void {
	tasks.sort((a, b) => a.line - b.line);
	const taskStack: { task: Task; indent: number }[] = [];
	for (const currentTask of tasks) {
		const currentIndent = getIndentLevel(currentTask.originalMarkdown);
		while (
			taskStack.length > 0 &&
			taskStack[taskStack.length - 1].indent >= currentIndent
		) {
			taskStack.pop();
		}
		if (taskStack.length > 0) {
			const parentTask = taskStack[taskStack.length - 1].task;
			currentTask.parent = parentTask.id;
			if (!parentTask.children) {
				parentTask.children = [];
			}
			parentTask.children.push(currentTask.id);
		}
		taskStack.push({ task: currentTask, indent: currentIndent });
	}
}

/**
 * Get indentation level of a line
 */
function getIndentLevel(line: string): number {
	const match = line.match(/^(\s*)/);
	return match ? match[1].length : 0;
}
