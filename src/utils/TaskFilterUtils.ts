import { moment } from "obsidian";
import { Task } from "./types/TaskIndex";
import {
	ViewMode,
	getViewSettingOrDefault,
} from "../common/setting-definition";
import TaskProgressBarPlugin from "../index";
import { sortTasks } from "../commands/sortTaskCommands";

interface FilterOptions {
	textQuery?: string;
	selectedDate?: Date; // For forecast-like filtering
	// Add other potential options needed by specific views later
	// selectedProject?: string;
	// selectedTags?: string[];

	settings?: {
		useDailyNotePathAsDate: boolean;
		dailyNoteFormat: string;
		useAsDateType: "due" | "start" | "scheduled";
	};
}

/**
 * Parses a date filter string (e.g., 'today', 'next week', '2024-12-31')
 * and returns a moment object representing the start of that day.
 * Returns null if parsing fails.
 */
function parseDateFilterString(dateString: string): moment.Moment | null {
	if (!dateString) return null;
	const lowerCaseDate = dateString.toLowerCase().trim();
	let targetDate = moment(); // Default to today

	// Simple relative dates
	if (lowerCaseDate === "today") {
		// Already moment()
	} else if (lowerCaseDate === "tomorrow") {
		targetDate = moment().add(1, "day");
	} else if (lowerCaseDate === "yesterday") {
		targetDate = moment().subtract(1, "day");
	} else if (lowerCaseDate === "next week") {
		targetDate = moment().add(1, "week").startOf("week"); // Start of next week
	} else if (lowerCaseDate === "last week") {
		targetDate = moment().subtract(1, "week").startOf("week"); // Start of last week
	} else if (lowerCaseDate === "next month") {
		targetDate = moment().add(1, "month").startOf("month");
	} else if (lowerCaseDate === "last month") {
		targetDate = moment().subtract(1, "month").startOf("month");
	} else {
		// Try parsing as YYYY-MM-DD
		const parsed = moment(lowerCaseDate, "YYYY-MM-DD", true); // Strict parsing
		if (parsed.isValid()) {
			targetDate = parsed;
		} else {
			// Could add more complex parsing here (e.g., "in 3 days")
			console.warn(`Could not parse date filter string: ${dateString}`);
			return null;
		}
	}

	return targetDate.startOf("day");
}

/**
 * Checks if a task is not completed based on view settings and task status.
 *
 * @param plugin The plugin instance
 * @param task The task to check
 * @param viewId The current view mode
 * @returns true if the task is not completed according to view settings
 */
export function isNotCompleted(
	plugin: TaskProgressBarPlugin,
	task: Task,
	viewId: ViewMode
): boolean {
	const viewConfig = getViewSettingOrDefault(plugin, viewId);
	const abandonedStatus = plugin.settings.taskStatuses.abandoned.split("|");
	const completedStatus = plugin.settings.taskStatuses.completed.split("|");

	if (viewConfig.hideCompletedAndAbandonedTasks) {
		return (
			!task.completed &&
			!abandonedStatus.includes(task.status.toLowerCase()) &&
			!completedStatus.includes(task.status.toLowerCase())
		);
	}

	return true;
}

/**
 * Checks if a task is blank based on view settings and task content.
 *
 * @param plugin The plugin instance
 * @param task The task to check
 * @param viewId The current view mode
 * @returns true if the task is blank
 */
export function isBlank(
	plugin: TaskProgressBarPlugin,
	task: Task,
	viewId: ViewMode
): boolean {
	const viewConfig = getViewSettingOrDefault(plugin, viewId);

	if (viewConfig.filterBlanks) {
		return task.content.trim() !== "";
	}

	return true;
}

/**
 * Centralized function to filter tasks based on view configuration and options.
 * Includes completion status filtering.
 */
export function filterTasks(
	allTasks: Task[],
	viewId: ViewMode,
	plugin: TaskProgressBarPlugin,
	options: FilterOptions = {}
): Task[] {
	let filtered = [...allTasks];
	const viewConfig = getViewSettingOrDefault(plugin, viewId);
	const filterRules = viewConfig.filterRules || {};

	// --- Apply Filter Rules defined in ViewConfig ---
	if (filterRules.textContains) {
		const query = filterRules.textContains.toLowerCase();
		filtered = filtered.filter((task) =>
			task.content.toLowerCase().includes(query)
		);
	}
	if (filterRules.tagsInclude && filterRules.tagsInclude.length > 0) {
		filtered = filtered.filter((task) =>
			filterRules.tagsInclude!.some((tag) => task.tags.includes(tag))
		);
	}
	if (filterRules.tagsExclude && filterRules.tagsExclude.length > 0) {
		filtered = filtered.filter(
			(task) =>
				!filterRules.tagsExclude!.some((tag) =>
					task.tags.includes(tag.toLowerCase())
				)
		);
	}
	if (filterRules.project) {
		filtered = filtered.filter(
			(task) => task.project?.trim() === filterRules.project?.trim()
		);
	}
	if (filterRules.priority !== undefined) {
		filtered = filtered.filter(
			(task) => (task.priority || 0) === filterRules.priority
		);
	}
	if (filterRules.statusInclude && filterRules.statusInclude.length > 0) {
		filtered = filtered.filter((task) =>
			filterRules.statusInclude!.includes(task.status)
		);
	}
	if (filterRules.statusExclude && filterRules.statusExclude.length > 0) {
		filtered = filtered.filter(
			(task) => !filterRules.statusExclude!.includes(task.status)
		);
	}
	// Path filters (Added based on content.ts logic)
	if (filterRules.pathIncludes) {
		const query = filterRules.pathIncludes
			.split(",")
			.filter((p) => p.trim() !== "")
			.map((p) => p.trim().toLocaleLowerCase());
		filtered = filtered.filter((task) =>
			query.some((q) => task.filePath.toLocaleLowerCase().includes(q))
		);
	}
	if (filterRules.pathExcludes) {
		const query = filterRules.pathExcludes
			.split(",")
			.filter((p) => p.trim() !== "")
			.map((p) => p.trim().toLocaleLowerCase());
		filtered = filtered.filter(
			(task) =>
				!query.some((q) =>
					task.filePath.toLocaleLowerCase().includes(q)
				)
		);
	}

	// --- Apply Date Filters from rules ---
	if (filterRules.dueDate) {
		const targetDueDate = parseDateFilterString(filterRules.dueDate);
		if (targetDueDate) {
			filtered = filtered.filter((task) =>
				task.dueDate
					? moment(task.dueDate).isSame(targetDueDate, "day")
					: false
			);
		}
	}
	if (filterRules.startDate) {
		const targetStartDate = parseDateFilterString(filterRules.startDate);
		if (targetStartDate) {
			filtered = filtered.filter((task) =>
				task.startDate
					? moment(task.startDate).isSame(targetStartDate, "day")
					: false
			);
		}
	}
	if (filterRules.scheduledDate) {
		const targetScheduledDate = parseDateFilterString(
			filterRules.scheduledDate
		);
		if (targetScheduledDate) {
			filtered = filtered.filter((task) =>
				task.scheduledDate
					? moment(task.scheduledDate).isSame(
							targetScheduledDate,
							"day"
					  )
					: false
			);
		}
	}

	// --- Apply Default View Logic (if no rules applied OR as overrides) ---
	// We only apply these if no specific rules were matched, OR if the view ID has hardcoded logic.
	// A better approach might be to represent *all* default views with filterRules in DEFAULT_SETTINGS.
	// For now, keep the switch for explicit default behaviours not covered by rules.
	if (Object.keys(filterRules).length === 0) {
		// Only apply default logic if no rules were defined for this view
		switch (viewId) {
			case "inbox":
				filtered = filtered.filter((task) => !task.project);
				break;
			case "flagged":
				filtered = filtered.filter(
					(task) =>
						(task.priority ?? 0) >= 3 ||
						task.tags?.includes("flagged")
				);
				break;
			// Projects, Tags, Review logic are handled by their specific components / options
		}
	}

	// --- Apply `isNotCompleted` Filter ---
	// This uses the hideCompletedAndAbandonedTasks setting from the viewConfig
	filtered = filtered.filter((task) => isNotCompleted(plugin, task, viewId));

	// --- Apply `isBlank` Filter ---
	// This uses the filterBlanks setting from the viewConfig
	filtered = filtered.filter((task) => isBlank(plugin, task, viewId));

	// --- Apply General Text Search (from options) ---
	if (options.textQuery) {
		const textFilter = options.textQuery.toLowerCase();
		filtered = filtered.filter(
			(task) =>
				task.content.toLowerCase().includes(textFilter) ||
				task.project?.toLowerCase().includes(textFilter) ||
				task.context?.toLowerCase().includes(textFilter) ||
				task.tags?.some((tag) => tag.toLowerCase().includes(textFilter))
		);
	}

	// --- Apply `hasDueDate` Filter ---
	if (filterRules.hasDueDate) {
		if (filterRules.hasDueDate === "any") {
			// Do nothing
		} else if (filterRules.hasDueDate === "hasDate") {
			filtered = filtered.filter((task) => task.dueDate);
		} else if (filterRules.hasDueDate === "noDate") {
			filtered = filtered.filter((task) => !task.dueDate);
		}
	}

	// --- Apply `hasStartDate` Filter ---
	if (filterRules.hasStartDate) {
		if (filterRules.hasStartDate === "any") {
			// Do nothing
		} else if (filterRules.hasStartDate === "hasDate") {
			filtered = filtered.filter((task) => task.startDate);
		} else if (filterRules.hasStartDate === "noDate") {
			filtered = filtered.filter((task) => !task.startDate);
		}
	}

	// --- Apply `hasScheduledDate` Filter ---
	if (filterRules.hasScheduledDate) {
		if (filterRules.hasScheduledDate === "any") {
			// Do nothing
		} else if (filterRules.hasScheduledDate === "hasDate") {
			filtered = filtered.filter((task) => task.scheduledDate);
		} else if (filterRules.hasScheduledDate === "noDate") {
			filtered = filtered.filter((task) => !task.scheduledDate);
		}
	}

	// --- Apply `hasCompletedDate` Filter ---
	if (filterRules.hasCompletedDate) {
		if (filterRules.hasCompletedDate === "any") {
			// Do nothing
		} else if (filterRules.hasCompletedDate === "hasDate") {
			filtered = filtered.filter((task) => task.completedDate);
		} else if (filterRules.hasCompletedDate === "noDate") {
			filtered = filtered.filter((task) => !task.completedDate);
		}
	}

	// --- Apply `hasRecurrence` Filter ---
	if (filterRules.hasRecurrence) {
		if (filterRules.hasRecurrence === "any") {
			// Do nothing
		} else if (filterRules.hasRecurrence === "hasProperty") {
			filtered = filtered.filter((task) => task.recurrence);
		} else if (filterRules.hasRecurrence === "noProperty") {
			filtered = filtered.filter((task) => !task.recurrence);
		}
	}

	// --- Apply `hasCreatedDate` Filter ---
	if (filterRules.hasCreatedDate) {
		if (filterRules.hasCreatedDate === "any") {
			// Do nothing
		} else if (filterRules.hasCreatedDate === "hasDate") {
			filtered = filtered.filter((task) => task.createdDate);
		} else if (filterRules.hasCreatedDate === "noDate") {
			filtered = filtered.filter((task) => !task.createdDate);
		}
	}

	return filtered;
}
