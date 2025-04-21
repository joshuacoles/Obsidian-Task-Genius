import {
	App,
	Component,
	ExtraButtonComponent,
	Platform,
	setIcon,
} from "obsidian";
import { Task } from "../../utils/types/TaskIndex";
import { CalendarComponent } from "./calendar";
import { TaskListItemComponent } from "./listItem";
import { t } from "../../translations/helper";
import "../../styles/forecast.css";
import "../../styles/calendar.css";
import { TaskTreeItemComponent } from "./treeItem";
import { TaskListRendererComponent } from "./TaskList";
import TaskProgressBarPlugin from "../../index";
import { ForecastSpecificConfig } from "../../common/setting-definition";
import { ForecastStore, ForecastActionType } from "./forecastStore";

export interface DateSection {
	title: string;
	date: Date;
	tasks: Task[];
	isExpanded: boolean;
	renderer?: TaskListRendererComponent;
}

export class ForecastComponent extends Component {
	// UI Elements
	public containerEl: HTMLElement;
	private forecastHeaderEl: HTMLElement;
	private settingsEl: HTMLElement;
	private calendarContainerEl: HTMLElement;
	private dueSoonContainerEl: HTMLElement;
	private taskContainerEl: HTMLElement;
	private taskListContainerEl: HTMLElement;
	private focusBarEl: HTMLElement;
	private titleEl: HTMLElement;
	private statsContainerEl: HTMLElement;

	private leftColumnEl: HTMLElement;
	private rightColumnEl: HTMLElement;

	// Child components
	private calendarComponent: CalendarComponent;
	private taskComponents: TaskListItemComponent[] = [];

	// State and rendering
	private store: ForecastStore;
	private windowFocusHandler: () => void;
	private treeComponents: TaskTreeItemComponent[] = [];
	private dateSections: DateSection[] = [];

	constructor(
		private parentEl: HTMLElement,
		private app: App,
		private plugin: TaskProgressBarPlugin,
		private params: {
			onTaskSelected?: (task: Task | null) => void;
			onTaskCompleted?: (task: Task) => void;
			onTaskContextMenu?: (event: MouseEvent, task: Task) => void;
		} = {}
	) {
		super();
		// Initialize store
		this.store = new ForecastStore(this.plugin);

		// Subscribe to store changes
		this.store.subscribe(() => {
			this.updateUI();
		});
	}

	onload() {
		// Create main container
		this.containerEl = this.parentEl.createDiv({
			cls: "forecast-container",
		});

		// Create content container for columns
		const contentContainer = this.containerEl.createDiv({
			cls: "forecast-content",
		});

		// Left column: create calendar section and due soon stats
		this.createLeftColumn(contentContainer);

		// Right column: create task sections by date
		this.createRightColumn(contentContainer);

		// Set up window focus handler
		this.windowFocusHandler = () => {
			// Update current date when window regains focus
			const newCurrentDate = new Date();
			newCurrentDate.setHours(0, 0, 0, 0);

			// Store previous current date for comparison
			const oldCurrentDate = this.store.getCurrentDate();
			oldCurrentDate.setHours(0, 0, 0, 0);

			// Only update if the date has actually changed
			if (oldCurrentDate.getTime() !== newCurrentDate.getTime()) {
				// Update current date in store via dispatch
				this.store.dispatch({
					type: ForecastActionType.UPDATE_CURRENT_DATE,
					payload: newCurrentDate
				});

				// Update the calendar's current date
				this.calendarComponent.setCurrentDate(newCurrentDate);

				// Only update selected date if it's older than the new current date
				// and the selected date was previously on the current date
				const selectedDate = this.store.getSelectedDate();
				const selectedDateTimestamp = selectedDate.setHours(0, 0, 0, 0);
				const oldCurrentTimestamp = oldCurrentDate.getTime();
				const newCurrentTimestamp = newCurrentDate.getTime();

				// Check if selectedDate equals oldCurrentDate (was on "today")
				// and if the new current date is after the selected date
				if (selectedDateTimestamp === oldCurrentTimestamp &&
					selectedDateTimestamp < newCurrentTimestamp) {
					// Update selected date to the new current date
					this.store.dispatch({
						type: ForecastActionType.SELECT_DATE,
						payload: newCurrentDate
					});

					// Update the calendar's selected date
					this.calendarComponent.selectDate(newCurrentDate);
				}
			}
		};

		// Register the window focus event
		this.registerDomEvent(window, "focus", this.windowFocusHandler);
	}

	private createForecastHeader() {
		this.forecastHeaderEl = this.taskContainerEl.createDiv({
			cls: "forecast-header",
		});

		if (Platform.isPhone) {
			this.forecastHeaderEl.createEl(
				"div",
				{
					cls: "forecast-sidebar-toggle",
				},
				(el) => {
					new ExtraButtonComponent(el)
						.setIcon("sidebar")
						.onClick(() => {
							this.toggleLeftColumnVisibility();
						});
				}
			);
		}

		// Title and task count
		const titleContainer = this.forecastHeaderEl.createDiv({
			cls: "forecast-title-container",
		});

		this.titleEl = titleContainer.createDiv({
			cls: "forecast-title",
			text: t("Forecast"),
		});

		const countEl = titleContainer.createDiv({
			cls: "forecast-count",
		});
		countEl.setText(t("0 tasks, 0 projects"));

		// View toggle and settings
		const actionsContainer = this.forecastHeaderEl.createDiv({
			cls: "forecast-actions",
		});

		// List/Tree toggle button
		const viewToggleBtn = actionsContainer.createDiv({
			cls: "view-toggle-btn",
		});
		setIcon(viewToggleBtn, "list");
		viewToggleBtn.setAttribute("aria-label", t("Toggle list/tree view"));

		this.registerDomEvent(viewToggleBtn, "click", () => {
			this.store.dispatch({
				type: ForecastActionType.TOGGLE_TREE_VIEW
			});

			// Update the icon immediately
			setIcon(viewToggleBtn, this.store.isInTreeView() ? "git-branch" : "list");
		});
	}

	private createStatsBar(parentEl: HTMLElement) {
		this.statsContainerEl = parentEl.createDiv({
			cls: "forecast-stats",
		});

		// Create stat items
		const createStatItem = (
			id: string,
			label: string,
			count: number,
			type: string
		) => {
			const statItem = this.statsContainerEl.createDiv({
				cls: `stat-item tg-${id}`,
			});

			const countEl = statItem.createDiv({
				cls: "stat-count",
				text: count.toString(),
			});

			const labelEl = statItem.createDiv({
				cls: "stat-label",
				text: label,
			});

			// Register click handler
			this.registerDomEvent(statItem, "click", () => {
				this.focusTaskList(type);

				if (Platform.isPhone) {
					this.toggleLeftColumnVisibility(false);
				}
			});

			return statItem;
		};

		// Create stats for past due, today, and future
		createStatItem("past-due", t("Past Due"), 0, "past-due");
		createStatItem("today", t("Today"), 0, "today");
		createStatItem("future", t("Future"), 0, "future");
	}

	private createLeftColumn(parentEl: HTMLElement) {
		this.leftColumnEl = parentEl.createDiv({
			cls: "forecast-left-column",
		});

		if (Platform.isPhone) {
			// Add close button for mobile sidebar
			const closeBtn = this.leftColumnEl.createDiv({
				cls: "forecast-sidebar-close",
			});

			new ExtraButtonComponent(closeBtn).setIcon("x").onClick(() => {
				this.toggleLeftColumnVisibility(false);
			});
		}

		// Stats bar for Past Due / Today / Future counts
		this.createStatsBar(this.leftColumnEl);

		// Calendar section
		this.calendarContainerEl = this.leftColumnEl.createDiv({
			cls: "forecast-calendar-section",
		});

		// Create and initialize calendar component
		this.calendarComponent = new CalendarComponent(
			this.calendarContainerEl,
			this.plugin.settings.viewConfiguration.find(
				(view) => view.id === "forecast"
			)?.specificConfig as ForecastSpecificConfig
		);
		this.addChild(this.calendarComponent);
		this.calendarComponent.load();

		// Due Soon section below calendar
		this.createDueSoonSection(this.leftColumnEl);

		// Set up calendar events
		this.calendarComponent.onDateSelected = (date, tasks) => {
			this.store.dispatch({
				type: ForecastActionType.SELECT_DATE,
				payload: date
			});

			if (Platform.isPhone) {
				this.toggleLeftColumnVisibility(false);
			}
		};
	}

	private createDueSoonSection(parentEl: HTMLElement) {
		this.dueSoonContainerEl = parentEl.createDiv({
			cls: "forecast-due-soon-section",
		});
	}

	private createRightColumn(parentEl: HTMLElement) {
		this.taskContainerEl = parentEl.createDiv({
			cls: "forecast-right-column",
		});

		// Create header with project count and actions
		this.createForecastHeader();

		this.taskListContainerEl = this.taskContainerEl.createDiv({
			cls: "forecast-task-list",
		});
	}

	// Main method to update UI based on store changes
	private updateUI() {
		// Update header counts
		this.updateHeaderCount();

		// Update stats
		this.updateTaskStats();

		// Update due soon section
		this.updateDueSoonSection();

		// Update date sections
		this.refreshDateSectionsUI();

		// Update view toggle button icon
		const viewToggleBtn = this.forecastHeaderEl.querySelector(".view-toggle-btn") as HTMLElement;
		if (viewToggleBtn) {
			setIcon(viewToggleBtn, this.store.isInTreeView() ? "git-branch" : "list");
		}
	}

	public setTasks(tasks: Task[]) {
		// Update store via dispatch
		this.store.dispatch({
			type: ForecastActionType.SET_TASKS,
			payload: tasks
		});

		// Update calendar with all tasks
		this.calendarComponent.setTasks(tasks);
	}

	private updateHeaderCount() {
		const allTasks = this.store.getAllTasks();

		// Count actions (tasks) and unique projects
		const projectSet = new Set<string>();
		allTasks.forEach((task) => {
			if (task.project) {
				projectSet.add(task.project);
			}
		});

		const taskCount = allTasks.length;
		const projectCount = projectSet.size;

		// Update header
		const countEl = this.forecastHeaderEl.querySelector(".forecast-count");
		if (countEl) {
			countEl.textContent = `${taskCount} ${t(
				"tasks"
			)}, ${projectCount} ${t("project")}${
				projectCount !== 1 ? "s" : ""
			}`;
		}
	}

	private updateTaskStats() {
		const { past, today, future } = this.store.getTasksByCategory();

		// Update counts in stats bar
		const statItems = this.statsContainerEl.querySelectorAll(".stat-item");
		statItems.forEach((item) => {
			const countEl = item.querySelector(".stat-count");
			if (countEl) {
				if (item.hasClass("tg-past-due")) {
					countEl.textContent = past.length.toString();
				} else if (item.hasClass("tg-today")) {
					countEl.textContent = today.length.toString();
				} else if (item.hasClass("tg-future")) {
					countEl.textContent = future.length.toString();
				}
			}
		});

		// Update active status for filter buttons
		const currentFilter = this.store.getFocusFilter();
		statItems.forEach((item) => {
			item.removeClass("active");
			if (currentFilter === "past-due" && item.hasClass("tg-past-due")) {
				item.addClass("active");
			} else if (currentFilter === "today" && item.hasClass("tg-today")) {
				item.addClass("active");
			} else if (currentFilter === "future" && item.hasClass("tg-future")) {
				item.addClass("active");
			}
		});
	}

	private updateDueSoonSection() {
		// Clear existing content
		this.dueSoonContainerEl.empty();

		// Get upcoming dates from store
		const dueSoonItems = this.store.getUpcomingDates(this.store.getSelectedDate());

		// Add a header
		const headerEl = this.dueSoonContainerEl.createDiv({
			cls: "due-soon-header",
		});
		headerEl.setText(t("Coming Up"));

		// Create entries for upcoming tasks
		dueSoonItems.forEach((item) => {
			const itemEl = this.dueSoonContainerEl.createDiv({
				cls: "due-soon-item",
			});

			// Format the date
			const dateStr = this.formatDateForDueSoon(item.date);

			// Get day of week
			const dayOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
				item.date.getDay()
			];

			const dateEl = itemEl.createDiv({
				cls: "due-soon-date",
			});
			dateEl.setText(`${dayOfWeek}, ${dateStr}`);

			const countEl = itemEl.createDiv({
				cls: "due-soon-count",
			});

			// Format the task count
			const taskCount = item.tasks.length;
			countEl.setText(
				`${taskCount} ${taskCount === 1 ? t("Task") : t("Tasks")}`
			);

			// Add click handler to select this date in the calendar
			this.registerDomEvent(itemEl, "click", () => {
				// Calendar will trigger onDateSelected which updates the store
				this.calendarComponent.selectDate(item.date);

				if (Platform.isPhone) {
					this.toggleLeftColumnVisibility(false);
				}
			});
		});

		// Add empty state if needed
		if (dueSoonItems.length === 0) {
			const emptyEl = this.dueSoonContainerEl.createDiv({
				cls: "due-soon-empty",
			});
			emptyEl.setText(t("No upcoming tasks"));
		}
	}

	private formatDateForDueSoon(date: Date): string {
		const monthNames = [
			"Jan",
			"Feb",
			"Mar",
			"Apr",
			"May",
			"Jun",
			"Jul",
			"Aug",
			"Sep",
			"Oct",
			"Nov",
			"Dec",
		];
		return `${monthNames[date.getMonth()]} ${date.getDate()}`;
	}

	private refreshDateSectionsUI() {
		this.cleanupRenderers();

		// Get date sections from store
		this.dateSections = this.store.getDateSections();

		// Render the sections
		this.renderDateSectionsUI();
	}

	private renderDateSectionsUI() {
		// Clean up any existing components
		this.cleanupRenderers();

		// Get tasks map from store
		const tasksMap = this.store.getTasksMap();

		if (this.dateSections.length === 0) {
			const emptyEl = this.taskListContainerEl.createDiv({
				cls: "forecast-empty-state",
			});
			emptyEl.setText(t("No tasks scheduled"));
			return;
		}

		this.dateSections.forEach((section) => {
			const sectionEl = this.taskListContainerEl.createDiv({
				cls: "task-date-section",
			});

			// Check if this section is overdue
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			const sectionDate = new Date(section.date);
			sectionDate.setHours(0, 0, 0, 0);

			// Add 'overdue' class for past due sections
			if (
				sectionDate.getTime() < today.getTime() ||
				section.title === "Past Due"
			) {
				sectionEl.addClass("overdue");
			}

			// Section header
			const headerEl = sectionEl.createDiv({
				cls: "date-section-header",
			});

			// Expand/collapse toggle
			const toggleEl = headerEl.createDiv({
				cls: "section-toggle",
			});
			setIcon(
				toggleEl,
				section.isExpanded ? "chevron-down" : "chevron-right"
			);

			// Section title
			const titleEl = headerEl.createDiv({
				cls: "section-title",
			});
			titleEl.setText(section.title);

			// Task count badge
			const countEl = headerEl.createDiv({
				cls: "section-count",
			});
			countEl.setText(`${section.tasks.length}`);

			// Task container (initially hidden if collapsed)
			const taskListEl = sectionEl.createDiv({
				cls: "section-tasks",
			});

			if (!section.isExpanded) {
				taskListEl.hide();
			}

			// Register toggle event
			this.registerDomEvent(headerEl, "click", () => {
				section.isExpanded = !section.isExpanded;
				setIcon(
					toggleEl,
					section.isExpanded ? "chevron-down" : "chevron-right"
				);
				section.isExpanded ? taskListEl.show() : taskListEl.hide();
			});

			// Create and configure renderer for this section
			section.renderer = new TaskListRendererComponent(
				this,
				taskListEl,
				this.plugin,
				this.app,
				"forecast"
			);
			this.params.onTaskSelected &&
				(section.renderer.onTaskSelected = this.params.onTaskSelected);
			this.params.onTaskCompleted &&
				(section.renderer.onTaskCompleted =
					this.params.onTaskCompleted);
			this.params.onTaskContextMenu &&
				(section.renderer.onTaskContextMenu =
					this.params.onTaskContextMenu);

			// Render tasks using the section's renderer
			section.renderer.renderTasks(
				section.tasks,
				this.store.isInTreeView(),
				tasksMap,
				t("No tasks for this section.")
			);
		});
	}

	private focusTaskList(type: string) {
		// Get current focus filter
		const currentFilter = this.store.getFocusFilter();

		// Toggle or set filter via dispatch
		if (currentFilter === type) {
			// Toggle off if already selected
			this.store.dispatch({
				type: ForecastActionType.SET_FOCUS_FILTER,
				payload: null
			});
		} else {
			// Set new filter
			this.store.dispatch({
				type: ForecastActionType.SET_FOCUS_FILTER,
				payload: type
			});
		}
	}

	public updateTask(updatedTask: Task) {
		// Update task in store via dispatch
		this.store.dispatch({
			type: ForecastActionType.UPDATE_TASK,
			payload: updatedTask
		});

		// Update calendar
		this.calendarComponent.setTasks(this.store.getAllTasks());
	}

	private cleanupRenderers() {
		this.dateSections.forEach((section) => {
			if (section.renderer) {
				this.removeChild(section.renderer);
				section.renderer = undefined;
			}
		});
		// Clear the container manually
		this.taskListContainerEl.empty();
	}

	onunload() {
		// Renderers are children, handled by Obsidian unload.
		// No need to manually remove DOM event listeners registered with this.registerDomEvent
		this.containerEl.empty();
		this.containerEl.remove();
	}

	// Toggle left column visibility with animation support
	private toggleLeftColumnVisibility(visible?: boolean) {
		if (visible === undefined) {
			// Toggle based on current state
			visible = !this.leftColumnEl.hasClass("is-visible");
		}

		if (visible) {
			this.leftColumnEl.addClass("is-visible");
			this.leftColumnEl.show();
		} else {
			this.leftColumnEl.removeClass("is-visible");

			// Wait for animation to complete before hiding
			setTimeout(() => {
				if (!this.leftColumnEl.hasClass("is-visible")) {
					this.leftColumnEl.hide();
				}
			}, 300); // Match CSS transition duration
		}
	}
}
