import { Task } from "../../utils/types/TaskIndex";
import { t } from "../../translations/helper";
import { DateSection } from "./forecast";

/**
 * Central store for managing forecast view state
 */
export class ForecastStore {
	// Core state
	private tasks: Task[] = [];
	private tasksMap: Map<string, Task> = new Map();
	private selectedDate: Date;
	private currentDate: Date;
	private isTreeView: boolean = false;
	private focusFilter: string | null = null;

	// Event callbacks
	private onStateChanged: () => void = () => {
	};

	constructor() {
		// Initialize dates
		this.currentDate = new Date();
		this.currentDate.setHours(0, 0, 0, 0);
		this.selectedDate = new Date(this.currentDate);
	}

	// State setters
	public setTasks(tasks: Task[]): void {
		this.tasks = tasks;
		this.tasksMap = new Map(tasks.map(task => [task.id, task]));
		this.notifyChange();
	}

	public updateTask(task: Task): void {
		const index = this.tasks.findIndex(t => t.id === task.id);
		if (index !== -1) {
			this.tasks[index] = task;
		} else {
			this.tasks.push(task);
		}
		this.tasksMap.set(task.id, task);
		this.notifyChange();
	}

	public setSelectedDate(date: Date): void {
		this.selectedDate = new Date(date);
		this.selectedDate.setHours(0, 0, 0, 0);
		this.notifyChange();
	}

	public setCurrentDate(date: Date): void {
		this.currentDate = new Date(date);
		this.currentDate.setHours(0, 0, 0, 0);
		this.notifyChange();
	}

	public setFocusFilter(filter: string | null): void {
		this.focusFilter = filter;
		this.notifyChange();
	}

	public setTreeView(isTreeView: boolean): void {
		this.isTreeView = isTreeView;
		this.notifyChange();
	}

	public toggleTreeView(): void {
		this.isTreeView = !this.isTreeView;
		this.notifyChange();
	}

	// State getters
	public getAllTasks(): Task[] {
		return this.tasks;
	}

	public getTasksMap(): Map<string, Task> {
		return this.tasksMap;
	}

	public getSelectedDate(): Date {
		return new Date(this.selectedDate);
	}

	public getCurrentDate(): Date {
		return new Date(this.currentDate);
	}

	public getFocusFilter(): string | null {
		return this.focusFilter;
	}

	public isInTreeView(): boolean {
		return this.isTreeView;
	}

	// Derived state selectors
	public getTasksByCategory(): { past: Task[], today: Task[], future: Task[] } {
		const today = new Date(this.currentDate);
		today.setHours(0, 0, 0, 0);
		const todayTimestamp = today.getTime();

		// Tasks with relevant dates only
		const tasksWithRelevantDate = this.tasks.filter(
			(task) => this.getRelevantDate(task) !== undefined
		);

		// Sort function
		const sortByPriorityAndDate = (tasks: Task[]) => {
			return tasks.sort((a, b) => {
				// First by priority (high to low)
				const priorityA = a.priority || 0;
				const priorityB = b.priority || 0;
				if (priorityA !== priorityB) {
					return priorityB - priorityA;
				}

				// Then by relevant date (early to late)
				const relevantDateA = this.getRelevantDate(a);
				const relevantDateB = this.getRelevantDate(b);

				if (relevantDateA === undefined && relevantDateB === undefined)
					return 0;
				if (relevantDateA === undefined) return 1;
				if (relevantDateB === undefined) return -1;

				return relevantDateA - relevantDateB;
			});
		};

		// Split and sort
		const past = sortByPriorityAndDate(tasksWithRelevantDate.filter((task) => {
			const relevantTimestamp = this.getRelevantDate(task)!;
			return relevantTimestamp < todayTimestamp;
		}));

		const todaysTasks = sortByPriorityAndDate(tasksWithRelevantDate.filter((task) => {
			const relevantTimestamp = this.getRelevantDate(task)!;
			return relevantTimestamp === todayTimestamp;
		}));

		const future = sortByPriorityAndDate(tasksWithRelevantDate.filter((task) => {
			const relevantTimestamp = this.getRelevantDate(task)!;
			return relevantTimestamp > todayTimestamp;
		}));

		return {past, today: todaysTasks, future};
	}

	public getTasksForDate(date: Date): Task[] {
		const targetTimestamp = new Date(date).setHours(0, 0, 0, 0);

		return this.tasks.filter((task) => {
			const relevantTimestamp = this.getRelevantDate(task);
			return relevantTimestamp === targetTimestamp;
		});
	}

	public getDateSections(): DateSection[] {
		const {past, today, future} = this.getTasksByCategory();
		const sections: DateSection[] = [];
		const todayTimestamp = new Date(this.currentDate).setHours(0, 0, 0, 0);
		const selectedTimestamp = new Date(this.selectedDate).setHours(0, 0, 0, 0);

		// If we have a focus filter, only show the relevant section
		if (this.focusFilter === "past-due") {
			if (past.length > 0) {
				sections.push({
					title: t("Past Due"),
					date: new Date(0),
					tasks: past,
					isExpanded: true
				});
			}
			return sections;
		}

		if (this.focusFilter === "today") {
			if (today.length > 0) {
				sections.push({
					title: this.formatSectionTitleForDate(this.currentDate),
					date: new Date(this.currentDate),
					tasks: today,
					isExpanded: true
				});
			}
			return sections;
		}

		if (this.focusFilter === "future") {
			// Group future tasks by date
			const dateMap = this.groupTasksByDate(future);
			const sortedDates = Array.from(dateMap.keys()).sort();

			sortedDates.forEach(dateKey => {
				const [year, month, day] = dateKey.split("-").map(Number);
				const date = new Date(year, month - 1, day);
				const tasks = dateMap.get(dateKey)!;

				sections.push({
					title: this.formatSectionTitleForDate(date),
					date: date,
					tasks: tasks,
					isExpanded: this.shouldExpandFutureSection(date, this.currentDate)
				});
			});

			return sections;
		}

		// When showing tasks for selected date
		const selectedTasks = this.getTasksForDate(this.selectedDate);

		if (selectedTasks.length > 0) {
			sections.push({
				title: this.formatSectionTitleForDate(this.selectedDate),
				date: new Date(this.selectedDate),
				tasks: selectedTasks,
				isExpanded: true
			});
		}

		// Add future sections after selected date
		const futureTasksAfterSelected = future.filter(task => {
			const relevantTimestamp = this.getRelevantDate(task);
			return relevantTimestamp !== undefined && relevantTimestamp > selectedTimestamp;
		});

		// Group by date
		const dateMap = this.groupTasksByDate(futureTasksAfterSelected);
		const sortedDates = Array.from(dateMap.keys()).sort();

		sortedDates.forEach(dateKey => {
			const [year, month, day] = dateKey.split("-").map(Number);
			const date = new Date(year, month - 1, day);
			const tasks = dateMap.get(dateKey)!;

			sections.push({
				title: this.formatSectionTitleForDate(date),
				date: date,
				tasks: tasks,
				isExpanded: this.shouldExpandFutureSection(date, this.selectedDate)
			});
		});

		return sections;
	}

	public getUpcomingDates(baseDate: Date, daysToLook: number = 15): { date: Date, tasks: Task[] }[] {
		const result: { date: Date, tasks: Task[] }[] = [];
		const baseDateCopy = new Date(baseDate);
		baseDateCopy.setHours(0, 0, 0, 0);

		for (let i = 0; i < daysToLook; i++) {
			const date = new Date(baseDateCopy);
			date.setDate(date.getDate() + i);

			// Skip the base date itself
			if (i === 0) continue;

			const tasksForDay = this.getTasksForDate(date);
			if (tasksForDay.length > 0) {
				result.push({
					date: date,
					tasks: tasksForDay
				});
			}
		}

		return result;
	}

	// Helper methods
	private getRelevantDate(task: Task): number | undefined {
		// Prioritize scheduledDate, fallback to dueDate
		const dateToUse = task.scheduledDate || task.dueDate;
		if (!dateToUse) return undefined;

		const date = new Date(dateToUse);
		date.setHours(0, 0, 0, 0);
		return date.getTime();
	}

	private formatSectionTitleForDate(date: Date): string {
		const dateTimestamp = new Date(date).setHours(0, 0, 0, 0);
		const todayTimestamp = new Date(this.currentDate).setHours(0, 0, 0, 0);

		let prefix = "";
		const dayDiffFromToday = Math.round(
			(dateTimestamp - todayTimestamp) / (1000 * 3600 * 24)
		);

		if (dayDiffFromToday === 0) {
			prefix = t("Today") + ", ";
		} else if (dayDiffFromToday === 1) {
			prefix = t("Tomorrow") + ", ";
		}

		const dayOfWeek = [
			"Sunday",
			"Monday",
			"Tuesday",
			"Wednesday",
			"Thursday",
			"Friday",
			"Saturday",
		][date.getDay()];

		const formattedDate = this.formatDate(date);

		if (dayDiffFromToday === 0) {
			return t("Today") + " — " + formattedDate;
		}

		return `${prefix}${dayOfWeek}, ${formattedDate}`;
	}

	private formatDate(date: Date): string {
		const months = [
			"January",
			"February",
			"March",
			"April",
			"May",
			"June",
			"July",
			"August",
			"September",
			"October",
			"November",
			"December",
		];
		return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
	}

	private shouldExpandFutureSection(sectionDate: Date, compareDate: Date): boolean {
		const compareTimestamp = new Date(compareDate).setHours(0, 0, 0, 0);
		const sectionTimestamp = new Date(sectionDate).setHours(0, 0, 0, 0);
		const dayDiff = Math.round(
			(sectionTimestamp - compareTimestamp) / (1000 * 3600 * 24)
		);
		return dayDiff > 0 && dayDiff <= 7;
	}

	private groupTasksByDate(tasks: Task[]): Map<string, Task[]> {
		const dateMap = new Map<string, Task[]>();

		tasks.forEach(task => {
			const relevantTimestamp = this.getRelevantDate(task);
			if (relevantTimestamp) {
				const date = new Date(relevantTimestamp);
				const dateKey = `${date.getFullYear()}-${String(
					date.getMonth() + 1
				).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

				if (!dateMap.has(dateKey)) {
					dateMap.set(dateKey, []);
				}
				if (!dateMap.get(dateKey)!.some(t => t.id === task.id)) {
					dateMap.get(dateKey)!.push(task);
				}
			}
		});

		return dateMap;
	}

	// Subscribe to state changes
	public subscribe(callback: () => void): void {
		this.onStateChanged = callback;
	}

	private notifyChange(): void {
		if (this.onStateChanged) {
			this.onStateChanged();
		}
	}
}
