import {
	App,
	PluginSettingTab,
	Setting,
	Modal,
	setIcon,
	ButtonComponent,
	TextAreaComponent,
	Notice,
	TextComponent, // Added TextComponent for input fields
	DropdownComponent,
	debounce, // Added DropdownComponent for occurrence selection
} from "obsidian";
import TaskProgressBarPlugin from ".";
import { allStatusCollections } from "./common/task-status";
import { migrateOldFilterOptions } from "./editor-ext/filterTasks";
import { t } from "./translations/helper";
import { WorkflowDefinitionModal } from "./components/WorkflowDefinitionModal";
import {
	DEFAULT_SETTINGS,
	ViewConfig,
	ViewFilterRule,
	ViewMode,
	RewardItem,
	OccurrenceLevel,
	SortCriterion, // Import SortCriterion
} from "./common/setting-definition";
import { formatProgressText } from "./editor-ext/progressBarWidget";
import "./styles/setting.css";
import { ViewConfigModal } from "./components/ViewConfigModal";
import {
	FolderSuggest,
	ImageSuggest,
	SingleFolderSuggest,
} from "./components/AutoComplete";
import { HabitList } from "./components/HabitSettingList";
import { ConfirmModal } from "./components/ConfirmModal";

export class TaskProgressBarSettingTab extends PluginSettingTab {
	plugin: TaskProgressBarPlugin;
	private applyDebounceTimer: number = 0;

	// Tabs management
	private currentTab: string = "general";
	private tabs: Array<{ id: string; name: string; icon: string }> = [
		{ id: "general", name: t("General"), icon: "gear" },
		{ id: "progress-bar", name: t("Progress Bar"), icon: "route" },
		{ id: "task-status", name: t("Task Status"), icon: "checkbox-glyph" },
		{ id: "task-filter", name: t("Task Filter"), icon: "filter" },
		{
			id: "task-handler",
			name: t("Task Handler"),
			icon: "arrow-right-circle",
		},
		{
			id: "quick-capture",
			name: t("Quick Capture"),
			icon: "lightbulb",
		},
		{ id: "workflow", name: t("Workflow"), icon: "workflow" },
		{ id: "date-priority", name: t("Date & Priority"), icon: "calendar" },
		{ id: "reward", name: t("Reward"), icon: "medal" },
		{ id: "habit", name: t("Habit"), icon: "calendar-check" },
		{ id: "view-settings", name: t("View Config"), icon: "layout" },
		{ id: "about", name: t("About"), icon: "info" },
	];

	constructor(app: App, plugin: TaskProgressBarPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	applySettingsUpdate() {
		clearTimeout(this.applyDebounceTimer);
		const plugin = this.plugin;
		this.applyDebounceTimer = window.setTimeout(() => {
			plugin.saveSettings();
		}, 100);
	}

	// Tabs management
	private createTabsUI() {
		this.containerEl.toggleClass("task-genius-settings", true);
		// Create tabs container
		new Setting(this.containerEl)
			.setName("Task Genius")
			.setClass("task-genius-settings-header")
			.setDesc(
				t(
					"Comprehensive task management plugin for Obsidian with progress bars, task status cycling, and advanced task tracking features."
				)
			)
			.setHeading();

		const tabsContainer = this.containerEl.createDiv({
			cls: "settings-tabs-container",
		});

		// Create tabs
		this.tabs.forEach((tab) => {
			const tabEl = tabsContainer.createDiv({
				cls: `settings-tab${
					this.currentTab === tab.id ? " settings-tab-active" : ""
				}`,
				attr: { "data-tab-id": tab.id },
			});

			// Add icon if Obsidian has it
			tabEl.createSpan({ cls: `settings-tab-icon` }, (el) => {
				setIcon(el, tab.icon);
			});

			// Add label
			tabEl.createSpan({
				text:
					tab.name +
					(tab.id === "about"
						? " Task Genius v" + this.plugin.manifest.version
						: ""),
			});

			// Add click handler
			tabEl.addEventListener("click", () => {
				this.switchToTab(tab.id);
			});
		});

		// Create sections container
		this.containerEl.createDiv({ cls: "settings-tab-sections" });
	}

	private switchToTab(tabId: string) {
		// Update current tab
		this.currentTab = tabId;

		// Update active tab
		const tabs = this.containerEl.querySelectorAll(".settings-tab");
		tabs.forEach((tab) => {
			if (tab.getAttribute("data-tab-id") === tabId) {
				tab.addClass("settings-tab-active");
			} else {
				tab.removeClass("settings-tab-active");
			}
		});

		// Show active section, hide others
		const sections = this.containerEl.querySelectorAll(
			".settings-tab-section"
		);
		sections.forEach((section) => {
			if (section.getAttribute("data-tab-id") === tabId) {
				section.addClass("settings-tab-section-active");
			} else {
				section.removeClass("settings-tab-section-active");
			}
		});
	}

	public openTab(tabId: string) {
		this.currentTab = tabId;
		this.display();
	}

	private createTabSection(tabId: string): HTMLElement {
		// Get the sections container
		const sectionsContainer = this.containerEl.querySelector(
			".settings-tab-sections"
		);
		if (!sectionsContainer) return this.containerEl;

		// Create section element
		const section = sectionsContainer.createDiv({
			cls: `settings-tab-section ${
				this.currentTab === tabId ? "settings-tab-section-active" : ""
			}`,
			attr: { "data-tab-id": tabId },
		});

		section.createDiv(
			{
				cls: "settings-tab-section-header",
			},
			(el) => {
				const button = new ButtonComponent(el)
					.setClass("header-button")
					.onClick(() => {
						this.currentTab = "general";
						this.display();
					});

				button.buttonEl.createEl(
					"span",
					{
						cls: "header-button-icon",
					},
					(el) => {
						setIcon(el, "arrow-left");
					}
				);
				button.buttonEl.createEl("span", {
					cls: "header-button-text",
					text: t("Back to main settings"),
				});
			}
		);

		return section;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		// Create tabs UI
		this.createTabsUI();

		// General Tab
		const generalSection = this.createTabSection("general");
		this.displayGeneralSettings(generalSection);

		// Progress Bar Tab
		const progressBarSection = this.createTabSection("progress-bar");
		this.displayProgressBarSettings(progressBarSection);

		// Task Status Tab
		const taskStatusSection = this.createTabSection("task-status");
		this.displayTaskStatusSettings(taskStatusSection);

		// Task Filter Tab
		const taskFilterSection = this.createTabSection("task-filter");
		this.displayTaskFilterSettings(taskFilterSection);

		// Task Handler Tab
		const taskHandlerSection = this.createTabSection("task-handler");
		this.displayTaskHandlerSettings(taskHandlerSection);

		// Quick Capture Tab
		const quickCaptureSection = this.createTabSection("quick-capture");
		this.displayQuickCaptureSettings(quickCaptureSection);

		// Workflow Tab
		const workflowSection = this.createTabSection("workflow");
		this.displayWorkflowSettings(workflowSection);

		// Date & Priority Tab
		const datePrioritySection = this.createTabSection("date-priority");
		this.displayDatePrioritySettings(datePrioritySection);

		// View Settings Tab
		const viewSettingsSection = this.createTabSection("view-settings");
		this.displayViewSettings(viewSettingsSection);

		// Reward Tab
		const rewardSection = this.createTabSection("reward");
		this.displayRewardSettings(rewardSection);

		// Habit Tab
		const habitSection = this.createTabSection("habit");
		this.displayHabitSettings(habitSection);

		// About Tab
		const aboutSection = this.createTabSection("about");
		this.displayAboutSettings(aboutSection);
	}

	private displayGeneralSettings(containerEl: HTMLElement): void {}

	private displayProgressBarSettings(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName(t("Progress bar"))
			.setDesc(
				t(
					"You can customize the progress bar behind the parent task(usually at the end of the task). You can also customize the progress bar for the task below the heading."
				)
			)
			.setHeading();

		new Setting(containerEl)
			.setName(t("Progress display mode"))
			.setDesc(t("Choose how to display task progress"))
			.addDropdown((dropdown) =>
				dropdown
					.addOption("none", t("No progress indicators"))
					.addOption("graphical", t("Graphical progress bar"))
					.addOption("text", t("Text progress indicator"))
					.addOption("both", t("Both graphical and text"))
					.setValue(this.plugin.settings.progressBarDisplayMode)
					.onChange(async (value: any) => {
						this.plugin.settings.progressBarDisplayMode = value;
						this.applySettingsUpdate();
						this.display();
					})
			);

		// Only show these options if some form of progress bar is enabled
		if (this.plugin.settings.progressBarDisplayMode !== "none") {
			new Setting(containerEl)
				.setName(t("Enable progress bar in reading mode"))
				.setDesc(
					t(
						"Toggle this to allow this plugin to show progress bars in reading mode."
					)
				)
				.addToggle((toggle) =>
					toggle
						.setValue(
							this.plugin.settings.enableProgressbarInReadingMode
						)
						.onChange(async (value) => {
							this.plugin.settings.enableProgressbarInReadingMode =
								value;

							this.applySettingsUpdate();
						})
				);

			new Setting(containerEl)
				.setName(t("Support hover to show progress info"))
				.setDesc(
					t(
						"Toggle this to allow this plugin to show progress info when hovering over the progress bar."
					)
				)
				.addToggle((toggle) =>
					toggle
						.setValue(
							this.plugin.settings.supportHoverToShowProgressInfo
						)
						.onChange(async (value) => {
							this.plugin.settings.supportHoverToShowProgressInfo =
								value;
							this.applySettingsUpdate();
						})
				);

			new Setting(containerEl)
				.setName(t("Add progress bar to non-task bullet"))
				.setDesc(
					t(
						"Toggle this to allow adding progress bars to regular list items (non-task bullets)."
					)
				)
				.addToggle((toggle) =>
					toggle
						.setValue(
							this.plugin.settings.addProgressBarToNonTaskBullet
						)
						.onChange(async (value) => {
							this.plugin.settings.addProgressBarToNonTaskBullet =
								value;
							this.applySettingsUpdate();
						})
				);

			new Setting(containerEl)
				.setName(t("Add progress bar to Heading"))
				.setDesc(
					t(
						"Toggle this to allow this plugin to add progress bar for Task below the headings."
					)
				)
				.addToggle((toggle) =>
					toggle
						.setValue(
							this.plugin.settings.addTaskProgressBarToHeading
						)
						.onChange(async (value) => {
							this.plugin.settings.addTaskProgressBarToHeading =
								value;
							this.applySettingsUpdate();
						})
				);

			new Setting(containerEl)
				.setName(t("Count sub children of current Task"))
				.setDesc(
					t(
						"Toggle this to allow this plugin to count sub tasks when generating progress bar."
					)
				)
				.addToggle((toggle) =>
					toggle
						.setValue(this.plugin.settings.countSubLevel)
						.onChange(async (value) => {
							this.plugin.settings.countSubLevel = value;
							this.applySettingsUpdate();
						})
				);

			new Setting(containerEl)
				.setName(t("Use custom goal for progress bar"))
				.setDesc(
					t(
						"Toggle this to allow this plugin to find the pattern g::number as goal of the parent task."
					)
				)
				.addToggle((toggle) =>
					toggle
						.setValue(this.plugin.settings.allowCustomProgressGoal)
						.onChange(async (value) => {
							this.plugin.settings.allowCustomProgressGoal =
								value;
							this.applySettingsUpdate();
						})
				);

			// Only show the number settings for modes that include text display
			if (
				this.plugin.settings.progressBarDisplayMode === "text" ||
				this.plugin.settings.progressBarDisplayMode === "both"
			) {
				this.displayNumberToProgressbar(containerEl);
			}

			new Setting(containerEl)
				.setName(t("Hide progress bars"))
				.setHeading();

			new Setting(containerEl)
				.setName(t("Hide progress bars based on conditions"))
				.setDesc(
					t(
						"Toggle this to enable hiding progress bars based on tags, folders, or metadata."
					)
				)
				.addToggle((toggle) =>
					toggle
						.setValue(
							this.plugin.settings
								.hideProgressBarBasedOnConditions
						)
						.onChange(async (value) => {
							this.plugin.settings.hideProgressBarBasedOnConditions =
								value;
							this.applySettingsUpdate();

							setTimeout(() => {
								this.display();
							}, 200);
						})
				);

			if (this.plugin.settings.hideProgressBarBasedOnConditions) {
				new Setting(containerEl)
					.setName(t("Hide by tags"))
					.setDesc(
						t(
							'Specify tags that will hide progress bars (comma-separated, without #). Example: "no-progress-bar,hide-progress"'
						)
					)
					.addText((text) =>
						text
							.setPlaceholder(
								DEFAULT_SETTINGS.hideProgressBarTags
							)
							.setValue(this.plugin.settings.hideProgressBarTags)
							.onChange(async (value) => {
								this.plugin.settings.hideProgressBarTags =
									value;
								this.applySettingsUpdate();
							})
					);

				new Setting(containerEl)
					.setName(t("Hide by folders"))
					.setDesc(
						t(
							'Specify folder paths that will hide progress bars (comma-separated). Example: "Daily Notes,Projects/Hidden"'
						)
					)
					.addText((text) =>
						text
							.setPlaceholder("folder1,folder2/subfolder")
							.setValue(
								this.plugin.settings.hideProgressBarFolders
							)
							.onChange(async (value) => {
								this.plugin.settings.hideProgressBarFolders =
									value;
								this.applySettingsUpdate();
							})
					);

				new Setting(containerEl)
					.setName(t("Hide by metadata"))
					.setDesc(
						t(
							'Specify frontmatter metadata that will hide progress bars. Example: "hide-progress-bar: true"'
						)
					)
					.addText((text) =>
						text
							.setPlaceholder(
								DEFAULT_SETTINGS.hideProgressBarMetadata
							)
							.setValue(
								this.plugin.settings.hideProgressBarMetadata
							)
							.onChange(async (value) => {
								this.plugin.settings.hideProgressBarMetadata =
									value;
								this.applySettingsUpdate();
							})
					);

				new Setting(containerEl)
					.setName(t("Show progress bars based on heading"))
					.setDesc(
						t(
							"Toggle this to enable showing progress bars based on heading."
						)
					)
					.addText((text) =>
						text
							.setPlaceholder(t("# heading"))
							.setValue(
								this.plugin.settings
									.showProgressBarBasedOnHeading
							)
							.onChange(async (value) => {
								this.plugin.settings.showProgressBarBasedOnHeading =
									value;
								this.applySettingsUpdate();
							})
					);
			}
		}
	}

	private displayNumberToProgressbar(containerEl: HTMLElement): void {
		// Add setting for display mode
		new Setting(containerEl)
			.setName(t("Progress format"))
			.setDesc(t("Choose how to display the task progress"))
			.addDropdown((dropdown) => {
				dropdown
					.addOption("percentage", t("Percentage (75%)"))
					.addOption(
						"bracketPercentage",
						t("Bracketed percentage ([75%])")
					)
					.addOption("fraction", t("Fraction (3/4)"))
					.addOption(
						"bracketFraction",
						t("Bracketed fraction ([3/4])")
					)
					.addOption("detailed", t("Detailed ([3✓ 1⟳ 0✗ 1? / 5])"))
					.addOption("custom", t("Custom format"))
					.addOption("range-based", t("Range-based text"))
					.setValue(
						this.plugin.settings.displayMode || "bracketFraction"
					)
					.onChange(async (value: any) => {
						this.plugin.settings.displayMode = value;
						this.applySettingsUpdate();
						this.display();
					});
			});

		// Show custom format setting only when custom format is selected
		if (this.plugin.settings.displayMode === "custom") {
			const fragment = document.createDocumentFragment();
			fragment.createEl("div", {
				cls: "custom-format-placeholder-info",
				text: t(
					"Use placeholders like {{COMPLETED}}, {{TOTAL}}, {{PERCENT}}, etc."
				),
			});

			fragment.createEl("div", {
				cls: "custom-format-placeholder-info",
				text: t(
					"Available placeholders: {{COMPLETED}}, {{TOTAL}}, {{IN_PROGRESS}}, {{ABANDONED}}, {{PLANNED}}, {{NOT_STARTED}}, {{PERCENT}}, {{COMPLETED_SYMBOL}}, {{IN_PROGRESS_SYMBOL}}, {{ABANDONED_SYMBOL}}, {{PLANNED_SYMBOL}}"
				),
			});

			fragment.createEl("div", {
				cls: "custom-format-placeholder-info",
				text: t(
					"Support expression in format, like using data.percentages to get the percentage of completed tasks. And using math or even repeat functions to get the result."
				),
			});

			new Setting(containerEl)
				.setName(t("Custom format"))
				.setDesc(fragment);

			const previewEl = containerEl.createDiv({
				cls: "custom-format-preview-container",
			});

			const previewLabel = previewEl.createDiv({
				cls: "custom-format-preview-label",
				text: t("Preview:"),
			});

			const previewContent = previewEl.createDiv({
				cls: "custom-format-preview-content",
			});

			// 初始预览
			this.updateFormatPreview(
				containerEl,
				this.plugin.settings.customFormat || "[{{COMPLETED}}/{{TOTAL}}]"
			);

			const textarea = containerEl.createEl(
				"div",
				{
					cls: "custom-format-textarea-container",
				},
				(el) => {
					const textAreaComponent = new TextAreaComponent(el);
					textAreaComponent.inputEl.toggleClass(
						"custom-format-textarea",
						true
					);
					textAreaComponent
						.setPlaceholder("[{{COMPLETED}}/{{TOTAL}}]")
						.setValue(
							this.plugin.settings.customFormat ||
								"[{{COMPLETED}}/{{TOTAL}}]"
						)
						.onChange(async (value) => {
							this.plugin.settings.customFormat = value;
							this.applySettingsUpdate();
							// 更新预览
							this.updateFormatPreview(containerEl, value);
						});
				}
			);

			// 添加预览区域

			// Show examples of advanced formats using expressions
			new Setting(containerEl)
				.setName(t("Expression examples"))
				.setDesc(t("Examples of advanced formats using expressions"))
				.setHeading();

			const exampleContainer = containerEl.createEl("div", {
				cls: "expression-examples",
			});

			const examples = [
				{
					name: t("Text Progress Bar"),
					code: '[${="=".repeat(Math.floor(data.percentages.completed/10)) + " ".repeat(10-Math.floor(data.percentages.completed/10))}] {{PERCENT}}%',
				},
				{
					name: t("Emoji Progress Bar"),
					code: '${="⬛".repeat(Math.floor(data.percentages.completed/10)) + "⬜".repeat(10-Math.floor(data.percentages.completed/10))} {{PERCENT}}%',
				},
				{
					name: t("Color-coded Status"),
					code: "{{COMPLETED}}/{{TOTAL}} ${=data.percentages.completed < 30 ? '🔴' : data.percentages.completed < 70 ? '🟠' : '🟢'}",
				},
				{
					name: t("Status with Icons"),
					code: "[{{COMPLETED_SYMBOL}}:{{COMPLETED}} {{IN_PROGRESS_SYMBOL}}:{{IN_PROGRESS}} {{PLANNED_SYMBOL}}:{{PLANNED}} / {{TOTAL}}]",
				},
			];

			examples.forEach((example) => {
				const exampleItem = exampleContainer.createEl("div", {
					cls: "expression-example-item",
				});

				exampleItem.createEl("div", {
					cls: "expression-example-name",
					text: example.name,
				});

				const codeEl = exampleItem.createEl("code", {
					cls: "expression-example-code",
					text: example.code,
				});

				// 添加预览效果
				const previewEl = exampleItem.createEl("div", {
					cls: "expression-example-preview",
				});

				// 创建示例数据来渲染预览
				const sampleData = {
					completed: 3,
					total: 5,
					inProgress: 1,
					abandoned: 0,
					notStarted: 0,
					planned: 1,
					percentages: {
						completed: 60,
						inProgress: 20,
						abandoned: 0,
						notStarted: 0,
						planned: 20,
					},
				};

				try {
					const renderedText = this.renderFormatPreview(
						example.code,
						sampleData
					);
					previewEl.setText(`${t("Preview")}: ${renderedText}`);
				} catch (error) {
					previewEl.setText(`${t("Preview")}: Error`);
					previewEl.addClass("expression-preview-error");
				}

				const useButton = exampleItem.createEl("button", {
					cls: "expression-example-use",
					text: t("Use"),
				});

				useButton.addEventListener("click", () => {
					this.plugin.settings.customFormat = example.code;
					this.applySettingsUpdate();

					const inputs = containerEl.querySelectorAll("textarea");
					for (const input of Array.from(inputs)) {
						if (input.placeholder === "[{{COMPLETED}}/{{TOTAL}}]") {
							input.value = example.code;
							break;
						}
					}

					this.updateFormatPreview(containerEl, example.code);
				});
			});
		}
		// Only show legacy percentage toggle for range-based or when displayMode is not set
		else if (
			this.plugin.settings.displayMode === "range-based" ||
			!this.plugin.settings.displayMode
		) {
			new Setting(containerEl)
				.setName(t("Show percentage"))
				.setDesc(
					t(
						"Toggle this to show percentage instead of completed/total count."
					)
				)
				.addToggle((toggle) =>
					toggle
						.setValue(this.plugin.settings.showPercentage)
						.onChange(async (value) => {
							this.plugin.settings.showPercentage = value;
							this.applySettingsUpdate();
						})
				);

			// If percentage display and range-based mode is selected
			if (
				this.plugin.settings.showPercentage &&
				this.plugin.settings.displayMode === "range-based"
			) {
				new Setting(containerEl)
					.setName(t("Customize progress ranges"))
					.setDesc(
						t(
							"Toggle this to customize the text for different progress ranges."
						)
					)
					.addToggle((toggle) =>
						toggle
							.setValue(
								this.plugin.settings.customizeProgressRanges
							)
							.onChange(async (value) => {
								this.plugin.settings.customizeProgressRanges =
									value;
								this.applySettingsUpdate();
								this.display();
							})
					);

				if (this.plugin.settings.customizeProgressRanges) {
					this.addProgressRangesSettings(containerEl);
				}
			}
		}
	}

	addProgressRangesSettings(containerEl: HTMLElement) {
		new Setting(containerEl)
			.setName(t("Progress Ranges"))
			.setDesc(
				t(
					"Define progress ranges and their corresponding text representations."
				)
			)
			.setHeading();

		// Display existing ranges
		this.plugin.settings.progressRanges.forEach((range, index) => {
			new Setting(containerEl)
				.setName(
					`${t("Range")} ${index + 1}: ${range.min}%-${range.max}%`
				)
				.setDesc(
					`${t("Use")} {{PROGRESS}} ${t(
						"as a placeholder for the percentage value"
					)}`
				)
				.addText((text) =>
					text
						.setPlaceholder(
							`${t("Template text with")} {{PROGRESS}} ${t(
								"placeholder"
							)}`
						)
						.setValue(range.text)
						.onChange(async (value) => {
							this.plugin.settings.progressRanges[index].text =
								value;
							this.applySettingsUpdate();
						})
				)
				.addButton((button) => {
					button.setButtonText("Delete").onClick(async () => {
						this.plugin.settings.progressRanges.splice(index, 1);
						this.applySettingsUpdate();
						this.display();
					});
				});
		});

		new Setting(containerEl)
			.setName(t("Add new range"))
			.setDesc(t("Add a new progress percentage range with custom text"));

		// Add a new range
		const newRangeSetting = new Setting(containerEl);
		newRangeSetting.infoEl.detach();

		newRangeSetting
			.addText((text) =>
				text
					.setPlaceholder(t("Min percentage (0-100)"))
					.setValue("")
					.onChange(async (value) => {
						// This will be handled when the user clicks the Add button
					})
			)
			.addText((text) =>
				text
					.setPlaceholder(t("Max percentage (0-100)"))
					.setValue("")
					.onChange(async (value) => {
						// This will be handled when the user clicks the Add button
					})
			)
			.addText((text) =>
				text
					.setPlaceholder(t("Text template (use {{PROGRESS}})"))
					.setValue("")
					.onChange(async (value) => {
						// This will be handled when the user clicks the Add button
					})
			)
			.addButton((button) => {
				button.setButtonText("Add").onClick(async () => {
					const settingsContainer = button.buttonEl.parentElement;
					if (!settingsContainer) return;

					const inputs = settingsContainer.querySelectorAll("input");
					if (inputs.length < 3) return;

					const min = parseInt(inputs[0].value);
					const max = parseInt(inputs[1].value);
					const text = inputs[2].value;

					if (isNaN(min) || isNaN(max) || !text) {
						return;
					}

					this.plugin.settings.progressRanges.push({
						min,
						max,
						text,
					});

					// Clear inputs
					inputs[0].value = "";
					inputs[1].value = "";
					inputs[2].value = "";

					this.applySettingsUpdate();
					this.display();
				});
			});

		// Reset to defaults
		new Setting(containerEl)
			.setName(t("Reset to defaults"))
			.setDesc(t("Reset progress ranges to default values"))
			.addButton((button) => {
				button.setButtonText(t("Reset")).onClick(async () => {
					this.plugin.settings.progressRanges = [
						{
							min: 0,
							max: 20,
							text: t("Just started {{PROGRESS}}%"),
						},
						{
							min: 20,
							max: 40,
							text: t("Making progress {{PROGRESS}}%"),
						},
						{ min: 40, max: 60, text: t("Half way {{PROGRESS}}%") },
						{
							min: 60,
							max: 80,
							text: t("Good progress {{PROGRESS}}%"),
						},
						{
							min: 80,
							max: 100,
							text: t("Almost there {{PROGRESS}}%"),
						},
					];
					this.applySettingsUpdate();
					this.display();
				});
			});
	}

	private displayTaskStatusSettings(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName(t("Task Status Settings"))
			.setDesc(t("Configure task status settings"))
			.setHeading();

		new Setting(containerEl)
			.setName(t("Auto complete parent task"))
			.setDesc(
				t(
					"Toggle this to allow this plugin to auto complete parent task when all child tasks are completed."
				)
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.autoCompleteParent)
					.onChange(async (value) => {
						this.plugin.settings.autoCompleteParent = value;
						this.applySettingsUpdate();
					})
			);

		new Setting(containerEl)
			.setName(t("Mark parent as 'In Progress' when partially complete"))
			.setDesc(
				t(
					"When some but not all child tasks are completed, mark the parent task as 'In Progress'. Only works when 'Auto complete parent' is enabled."
				)
			)
			.addToggle((toggle) =>
				toggle
					.setValue(
						this.plugin.settings
							.markParentInProgressWhenPartiallyComplete
					)
					.onChange(async (value) => {
						this.plugin.settings.markParentInProgressWhenPartiallyComplete =
							value;
						this.applySettingsUpdate();
					})
			);

		// Task Status Settings
		new Setting(containerEl)
			.setName(t("Task Status Settings"))
			.setDesc(
				t(
					"Select a predefined task status collection or customize your own"
				)
			)
			.setHeading()
			.addDropdown((dropdown) => {
				dropdown.addOption("custom", "Custom");
				for (const statusCollection of allStatusCollections) {
					dropdown.addOption(statusCollection, statusCollection);
				}

				// Set default value to custom
				dropdown.setValue("custom");

				dropdown.onChange(async (value) => {
					if (value === "custom") {
						return;
					}

					// Confirm before applying the theme
					const modal = new Modal(this.app);
					modal.titleEl.setText(`Apply ${value} Theme?`);

					const content = modal.contentEl.createDiv();
					content.setText(
						`This will override your current task status settings with the ${value} theme. Do you want to continue?`
					);

					const buttonContainer = modal.contentEl.createDiv();
					buttonContainer.addClass("modal-button-container");

					const cancelButton = buttonContainer.createEl("button");
					cancelButton.setText(t("Cancel"));
					cancelButton.addEventListener("click", () => {
						dropdown.setValue("custom");
						modal.close();
					});

					const confirmButton = buttonContainer.createEl("button");
					confirmButton.setText(t("Apply Theme"));
					confirmButton.addClass("mod-cta");
					confirmButton.addEventListener("click", async () => {
						modal.close();

						// Apply the selected theme's task statuses
						try {
							// Import the function dynamically based on the selected theme
							const functionName =
								value.toLowerCase() + "SupportedStatuses";
							const statusesModule = await import(
								"./common/task-status"
							);

							// Use type assertion for the dynamic function access
							const getStatuses = (statusesModule as any)[
								functionName
							];

							if (typeof getStatuses === "function") {
								const statuses = getStatuses();

								// Update cycle and marks
								const cycle =
									this.plugin.settings.taskStatusCycle;
								const marks =
									this.plugin.settings.taskStatusMarks;
								const excludeMarks =
									this.plugin.settings.excludeMarksFromCycle;

								// Clear existing cycle, marks and excludeMarks
								cycle.length = 0;
								Object.keys(marks).forEach(
									(key) => delete marks[key]
								);
								excludeMarks.length = 0;

								// Add new statuses to cycle and marks
								for (const [symbol, name, type] of statuses) {
									const realName = (name as string)
										.split("/")[0]
										.trim();
									// Add to cycle if not already included
									if (!cycle.includes(realName)) {
										cycle.push(realName);
									}

									// Add to marks
									marks[realName] = symbol;

									// Add to excludeMarks if not space or x
									if (symbol !== " " && symbol !== "x") {
										excludeMarks.push(realName);
									}
								}

								// Also update the main taskStatuses object based on the theme
								const statusMap: Record<string, string[]> = {
									completed: [],
									inProgress: [],
									abandoned: [],
									notStarted: [],
									planned: [],
								};
								for (const [symbol, _, type] of statuses) {
									if (type in statusMap) {
										statusMap[
											type as keyof typeof statusMap
										].push(symbol);
									}
								}
								// Corrected loop and assignment for TaskStatusConfig here too
								for (const type of Object.keys(
									statusMap
								) as Array<
									keyof import("./common/setting-definition").TaskStatusConfig
								>) {
									if (
										type in
											this.plugin.settings.taskStatuses &&
										statusMap[type] &&
										statusMap[type].length > 0
									) {
										this.plugin.settings.taskStatuses[
											type
										] = statusMap[type].join("|");
									}
								}

								// Save settings and refresh the display
								this.applySettingsUpdate();
								this.display();
							}
						} catch (error) {
							console.error(
								"Failed to apply task status theme:",
								error
							);
						}
					});

					modal.open();
				});
			});

		new Setting(containerEl)
			.setName(t("Completed task markers"))
			.setDesc(
				t(
					'Characters in square brackets that represent completed tasks. Example: "x|X"'
				)
			)
			.addText((text) =>
				text
					.setPlaceholder(DEFAULT_SETTINGS.taskStatuses.completed)
					.setValue(this.plugin.settings.taskStatuses.completed)
					.onChange(async (value) => {
						this.plugin.settings.taskStatuses.completed =
							value || DEFAULT_SETTINGS.taskStatuses.completed;
						this.applySettingsUpdate();
					})
			);

		new Setting(containerEl)
			.setName(t("Planned task markers"))
			.setDesc(
				t(
					'Characters in square brackets that represent planned tasks. Example: "?"'
				)
			)
			.addText((text) =>
				text
					.setPlaceholder(DEFAULT_SETTINGS.taskStatuses.planned)
					.setValue(this.plugin.settings.taskStatuses.planned)
					.onChange(async (value) => {
						this.plugin.settings.taskStatuses.planned =
							value || DEFAULT_SETTINGS.taskStatuses.planned;
						this.applySettingsUpdate();
					})
			);

		new Setting(containerEl)
			.setName(t("In progress task markers"))
			.setDesc(
				t(
					'Characters in square brackets that represent tasks in progress. Example: ">|/"'
				)
			)
			.addText((text) =>
				text
					.setPlaceholder(DEFAULT_SETTINGS.taskStatuses.inProgress)
					.setValue(this.plugin.settings.taskStatuses.inProgress)
					.onChange(async (value) => {
						this.plugin.settings.taskStatuses.inProgress =
							value || DEFAULT_SETTINGS.taskStatuses.inProgress;
						this.applySettingsUpdate();
					})
			);

		new Setting(containerEl)
			.setName(t("Abandoned task markers"))
			.setDesc(
				t(
					'Characters in square brackets that represent abandoned tasks. Example: "-"'
				)
			)
			.addText((text) =>
				text
					.setPlaceholder(DEFAULT_SETTINGS.taskStatuses.abandoned)
					.setValue(this.plugin.settings.taskStatuses.abandoned)
					.onChange(async (value) => {
						this.plugin.settings.taskStatuses.abandoned =
							value || DEFAULT_SETTINGS.taskStatuses.abandoned;
						this.applySettingsUpdate();
					})
			);

		new Setting(containerEl)
			.setName("Not started task markers")
			.setDesc(
				t(
					'Characters in square brackets that represent not started tasks. Default is space " "'
				)
			)
			.addText((text) =>
				text
					.setPlaceholder(DEFAULT_SETTINGS.taskStatuses.notStarted)
					.setValue(this.plugin.settings.taskStatuses.notStarted)
					.onChange(async (value) => {
						this.plugin.settings.taskStatuses.notStarted =
							value || DEFAULT_SETTINGS.taskStatuses.notStarted;
						this.applySettingsUpdate();
					})
			);

		new Setting(containerEl)
			.setName(t("Count other statuses as"))
			.setDesc(
				t(
					'Select the status to count other statuses as. Default is "Not Started".'
				)
			)
			.addDropdown((dropdown) => {
				dropdown.addOption("notStarted", "Not Started");
				dropdown.addOption("abandoned", "Abandoned");
				dropdown.addOption("planned", "Planned");
				dropdown.addOption("completed", "Completed");
				dropdown.addOption("inProgress", "In Progress");
				dropdown.setValue(
					this.plugin.settings.countOtherStatusesAs || "notStarted"
				);
				dropdown.onChange((value) => {
					this.plugin.settings.countOtherStatusesAs = value;
					this.applySettingsUpdate();
				});
			});

		// Task Counting Settings
		new Setting(containerEl)
			.setName(t("Task Counting Settings"))
			.setDesc(t("Configure which task markers to count or exclude"))
			.setHeading();

		new Setting(containerEl)
			.setName(t("Exclude specific task markers"))
			.setDesc(
				t(
					'Specify task markers to exclude from counting. Example: "?|/"'
				)
			)
			.addText((text) =>
				text
					.setPlaceholder("")
					.setValue(this.plugin.settings.excludeTaskMarks)
					.onChange(async (value) => {
						this.plugin.settings.excludeTaskMarks = value;
						this.applySettingsUpdate();
					})
			);

		new Setting(containerEl)
			.setName(t("Only count specific task markers"))
			.setDesc(t("Toggle this to only count specific task markers"))
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.useOnlyCountMarks)
					.onChange(async (value) => {
						this.plugin.settings.useOnlyCountMarks = value;
						this.applySettingsUpdate();

						setTimeout(() => {
							this.display();
						}, 200);
					})
			);

		if (this.plugin.settings.useOnlyCountMarks) {
			new Setting(containerEl)
				.setName(t("Specific task markers to count"))
				.setDesc(
					t('Specify which task markers to count. Example: "x|X|>|/"')
				)
				.addText((text) =>
					text
						.setPlaceholder(DEFAULT_SETTINGS.onlyCountTaskMarks)
						.setValue(this.plugin.settings.onlyCountTaskMarks)
						.onChange(async (value) => {
							if (value.length === 0) {
								this.plugin.settings.onlyCountTaskMarks =
									DEFAULT_SETTINGS.onlyCountTaskMarks;
							} else {
								this.plugin.settings.onlyCountTaskMarks = value;
							}
							this.applySettingsUpdate();
						})
				);
		}

		// Task Status Switcher section
		new Setting(containerEl)
			.setName(t("Task Status Switcher"))
			.setHeading();

		new Setting(containerEl)
			.setName(t("Enable task status switcher"))
			.setDesc(
				t(
					"Enable/disable the ability to cycle through task states by clicking."
				)
			)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.enableTaskStatusSwitcher)
					.onChange(async (value) => {
						this.plugin.settings.enableTaskStatusSwitcher = value;
						this.applySettingsUpdate();

						setTimeout(() => {
							this.display();
						}, 200);
					});
			});

		if (!this.plugin.settings.enableTaskStatusSwitcher) {
			return;
		}

		new Setting(containerEl)
			.setName(t("Enable custom task marks"))
			.setDesc(
				t(
					"Replace default checkboxes with styled text marks that follow your task status cycle when clicked."
				)
			)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.enableCustomTaskMarks)
					.onChange(async (value) => {
						this.plugin.settings.enableCustomTaskMarks = value;
						this.applySettingsUpdate();
					});
			});

		new Setting(containerEl)
			.setName(t("Enable text mark in source mode"))
			.setDesc(
				t(
					"Make the text mark in source mode follow the task status cycle when clicked."
				)
			)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.enableTextMarkInSourceMode)
					.onChange(async (value) => {
						this.plugin.settings.enableTextMarkInSourceMode = value;
						this.applySettingsUpdate();
					});
			});

		new Setting(containerEl)
			.setName(t("Enable cycle complete status"))
			.setDesc(
				t(
					"Enable/disable the ability to automatically cycle through task states when pressing a mark."
				)
			)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.enableCycleCompleteStatus)
					.onChange(async (value) => {
						this.plugin.settings.enableCycleCompleteStatus = value;
						this.applySettingsUpdate();
					});
			});

		new Setting(containerEl)
			.setName(t("Task status cycle and marks"))
			.setDesc(
				t(
					"Define task states and their corresponding marks. The order from top to bottom defines the cycling sequence."
				)
			)
			.addDropdown((dropdown) => {
				dropdown.addOption("custom", "Custom");
				for (const statusCollection of allStatusCollections) {
					dropdown.addOption(statusCollection, statusCollection);
				}

				// Set default value to custom
				dropdown.setValue("custom");

				dropdown.onChange(async (value) => {
					if (value === "custom") {
						return;
					}

					// Confirm before applying the theme
					const modal = new Modal(this.app);
					modal.titleEl.setText(`Apply ${value} Theme?`);

					const content = modal.contentEl.createDiv();
					content.setText(
						t(
							`This will override your current task status settings with the selected theme. Do you want to continue?`
						)
					);

					const buttonContainer = modal.contentEl.createDiv();
					buttonContainer.addClass("modal-button-container");

					const cancelButton = buttonContainer.createEl("button");
					cancelButton.setText(t("Cancel"));
					cancelButton.addEventListener("click", () => {
						dropdown.setValue("custom");
						modal.close();
					});

					const confirmButton = buttonContainer.createEl("button");
					confirmButton.setText(t("Apply Theme"));
					confirmButton.addClass("mod-cta");
					confirmButton.addEventListener("click", async () => {
						modal.close();

						// Apply the selected theme's task statuses
						try {
							// Import the function dynamically based on the selected theme
							const functionName =
								value.toLowerCase() + "SupportedStatuses";
							const statusesModule = await import(
								"./common/task-status"
							);

							// Use type assertion for the dynamic function access
							const getStatuses = (statusesModule as any)[
								functionName
							];

							if (typeof getStatuses === "function") {
								const statuses = getStatuses();

								// Update cycle and marks
								const cycle =
									this.plugin.settings.taskStatusCycle;
								const marks =
									this.plugin.settings.taskStatusMarks;
								const excludeMarks =
									this.plugin.settings.excludeMarksFromCycle;

								// Clear existing cycle, marks and excludeMarks
								cycle.length = 0;
								Object.keys(marks).forEach(
									(key) => delete marks[key]
								);
								excludeMarks.length = 0;

								// Add new statuses to cycle and marks
								for (const [symbol, name, type] of statuses) {
									const realName = (name as string)
										.split("/")[0]
										.trim();
									// Add to cycle if not already included
									if (!cycle.includes(realName)) {
										cycle.push(realName);
									}

									// Add to marks
									marks[realName] = symbol;

									// Add to excludeMarks if not space or x
									if (symbol !== " " && symbol !== "x") {
										excludeMarks.push(realName);
									}
								}

								// Also update the main taskStatuses object based on the theme
								const statusMap: Record<string, string[]> = {
									completed: [],
									inProgress: [],
									abandoned: [],
									notStarted: [],
									planned: [],
								};
								for (const [symbol, _, type] of statuses) {
									if (type in statusMap) {
										statusMap[
											type as keyof typeof statusMap
										].push(symbol);
									}
								}
								// Corrected loop and assignment for TaskStatusConfig here too
								for (const type of Object.keys(
									statusMap
								) as Array<
									keyof import("./common/setting-definition").TaskStatusConfig
								>) {
									if (
										type in
											this.plugin.settings.taskStatuses &&
										statusMap[type] &&
										statusMap[type].length > 0
									) {
										this.plugin.settings.taskStatuses[
											type
										] = statusMap[type].join("|");
									}
								}

								// Save settings and refresh the display
								this.applySettingsUpdate();
								this.display();
							}
						} catch (error) {
							console.error(
								"Failed to apply task status theme:",
								error
							);
						}
					});

					modal.open();
				});
			});

		// Create a container for the task states list
		const taskStatesContainer = containerEl.createDiv({
			cls: "task-states-container",
		});

		// Function to refresh the task states list
		const refreshTaskStatesList = () => {
			// Clear the container
			taskStatesContainer.empty();

			// Get current cycle and marks
			const cycle = this.plugin.settings.taskStatusCycle;
			const marks = this.plugin.settings.taskStatusMarks;

			// Initialize excludeMarksFromCycle if it doesn't exist
			if (!this.plugin.settings.excludeMarksFromCycle) {
				this.plugin.settings.excludeMarksFromCycle = [];
			}

			// Add each status in the cycle
			cycle.forEach((state, index) => {
				const stateRow = taskStatesContainer.createDiv({
					cls: "task-state-row",
				});

				// Create the setting
				const stateSetting = new Setting(stateRow)
					.setName(`Status #${index + 1}`)
					.addText((text) => {
						text.setValue(state)
							.setPlaceholder(t("Status name"))
							.onChange((value) => {
								// Update the state name in both cycle and marks
								const oldState = cycle[index];
								cycle[index] = value;

								// If the old state had a mark, preserve it with the new name
								if (oldState in marks) {
									marks[value] = marks[oldState];
									delete marks[oldState];
								}

								this.applySettingsUpdate();
							});
					})
					.addText((text) => {
						text.setValue(marks[state] || " ")
							.setPlaceholder("Mark")
							.onChange((value) => {
								// Only use the first character
								const mark = value.trim().charAt(0) || " ";
								marks[state] = mark;
								this.applySettingsUpdate();
							});
						text.inputEl.maxLength = 1;
						text.inputEl.style.width = "40px";
					});

				// Add toggle for including in cycle
				stateSetting.addToggle((toggle) => {
					toggle
						.setTooltip(t("Include in cycle"))
						.setValue(
							!this.plugin.settings.excludeMarksFromCycle.includes(
								state
							)
						)
						.onChange((value) => {
							if (!value) {
								// Add to exclude list if not already there
								if (
									!this.plugin.settings.excludeMarksFromCycle.includes(
										state
									)
								) {
									this.plugin.settings.excludeMarksFromCycle.push(
										state
									);
								}
							} else {
								// Remove from exclude list
								this.plugin.settings.excludeMarksFromCycle =
									this.plugin.settings.excludeMarksFromCycle.filter(
										(s) => s !== state
									);
							}
							this.applySettingsUpdate();
						});
				});

				// Add buttons for moving up/down and removing
				stateSetting.addExtraButton((button) => {
					button
						.setIcon("arrow-up")
						.setTooltip(t("Move up"))
						.onClick(() => {
							if (index > 0) {
								// Swap with the previous item
								[cycle[index - 1], cycle[index]] = [
									cycle[index],
									cycle[index - 1],
								];
								this.applySettingsUpdate();
								refreshTaskStatesList();
							}
						});
					button.extraSettingsEl.style.marginRight = "0";
				});

				stateSetting.addExtraButton((button) => {
					button
						.setIcon("arrow-down")
						.setTooltip(t("Move down"))
						.onClick(() => {
							if (index < cycle.length - 1) {
								// Swap with the next item
								[cycle[index], cycle[index + 1]] = [
									cycle[index + 1],
									cycle[index],
								];
								this.applySettingsUpdate();
								refreshTaskStatesList();
							}
						});
					button.extraSettingsEl.style.marginRight = "0";
				});

				stateSetting.addExtraButton((button) => {
					button
						.setIcon("trash")
						.setTooltip(t("Remove"))
						.onClick(() => {
							// Remove from cycle
							cycle.splice(index, 1);
							delete marks[state];
							this.applySettingsUpdate();
							refreshTaskStatesList();
						});
					button.extraSettingsEl.style.marginRight = "0";
				});
			});

			// Add button to add new status
			const addButtonContainer = taskStatesContainer.createDiv();
			new Setting(addButtonContainer).addButton((button) => {
				button
					.setButtonText(t("Add Status"))
					.setCta()
					.onClick(() => {
						// Add a new status to the cycle with a default mark
						const newStatus = `STATUS_${cycle.length + 1}`;
						cycle.push(newStatus);
						marks[newStatus] = " ";
						this.applySettingsUpdate();
						refreshTaskStatesList();
					});
			});
		};

		// Initial render of the task states list
		refreshTaskStatesList();
	}

	private displayDatePrioritySettings(containerEl: HTMLElement): void {
		// Priority picker settings
		new Setting(containerEl)
			.setName(t("Priority Picker Settings"))
			.setDesc(
				t(
					"Toggle to enable priority picker dropdown for emoji and letter format priorities."
				)
			)
			.setHeading();

		new Setting(containerEl)
			.setName(t("Enable priority picker"))
			.setDesc(
				t(
					"Toggle to enable priority picker dropdown for emoji and letter format priorities."
				)
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enablePriorityPicker)
					.onChange(async (value) => {
						this.plugin.settings.enablePriorityPicker = value;
						this.applySettingsUpdate();
					})
			);

		new Setting(containerEl)
			.setName(t("Enable priority keyboard shortcuts"))
			.setDesc(
				t(
					"Toggle to enable keyboard shortcuts for setting task priorities."
				)
			)
			.addToggle((toggle) =>
				toggle
					.setValue(
						this.plugin.settings.enablePriorityKeyboardShortcuts
					)
					.onChange(async (value) => {
						this.plugin.settings.enablePriorityKeyboardShortcuts =
							value;
						this.applySettingsUpdate();
					})
			);

		// Date picker settings
		new Setting(containerEl).setName(t("Date picker")).setHeading();

		new Setting(containerEl)
			.setName(t("Enable date picker"))
			.setDesc(
				t(
					"Toggle this to enable date picker for tasks. This will add a calendar icon near your tasks which you can click to select a date."
				)
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableDatePicker)
					.onChange(async (value) => {
						this.plugin.settings.enableDatePicker = value;
						this.applySettingsUpdate();
					})
			);

		// Date mark setting
		new Setting(containerEl)
			.setName(t("Date mark"))
			.setDesc(
				t(
					"Emoji mark to identify dates. You can use multiple emoji separated by commas."
				)
			)
			.addText((text) =>
				text
					.setValue(this.plugin.settings.dateMark)
					.onChange(async (value) => {
						this.plugin.settings.dateMark = value;
						this.applySettingsUpdate();
					})
			);
	}

	private displayTaskFilterSettings(containerEl: HTMLElement): void {
		new Setting(containerEl).setName(t("Task Filter")).setHeading();

		new Setting(containerEl)
			.setName(t("Enable Task Filter"))
			.setDesc(t("Toggle this to enable the task filter panel"))
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.taskFilter.enableTaskFilter)
					.onChange(async (value) => {
						this.plugin.settings.taskFilter.enableTaskFilter =
							value;
						this.applySettingsUpdate();
					});
			});

		// Preset filters section
		new Setting(containerEl)
			.setName(t("Preset Filters"))
			.setDesc(
				t(
					"Create and manage preset filters for quick access to commonly used task filters."
				)
			);

		// Add a container for the preset filters
		const presetFiltersContainer = containerEl.createDiv({
			cls: "preset-filters-container",
		});

		// Function to refresh the preset filters list
		const refreshPresetFiltersList = () => {
			// Clear the container
			presetFiltersContainer.empty();

			// Get current preset filters
			const presetFilters =
				this.plugin.settings.taskFilter.presetTaskFilters;

			if (presetFilters.length === 0) {
				presetFiltersContainer.createEl("div", {
					cls: "no-presets-message",
					text: t(
						"No preset filters created yet. Click 'Add New Preset' to create one."
					),
				});
			}

			// Add each preset filter in the list
			presetFilters.forEach((preset, index) => {
				const presetRow = presetFiltersContainer.createDiv({
					cls: "preset-filter-row",
				});

				// Create the setting
				const presetSetting = new Setting(presetRow)
					.setName(`${t("Preset")} #${index + 1}`)
					.addText((text) => {
						text.setValue(preset.name)
							.setPlaceholder(t("Preset name"))
							.onChange((value) => {
								preset.name = value;
								this.applySettingsUpdate();
							});
					});

				// Add buttons for editing, removing
				presetSetting.addExtraButton((button) => {
					button
						.setIcon("pencil")
						.setTooltip(t("Edit Filter"))
						.onClick(() => {
							// Show modal to edit filter options
							new PresetFilterModal(this.app, preset, () => {
								this.applySettingsUpdate();
								refreshPresetFiltersList();
							}).open();
						});
				});

				presetSetting.addExtraButton((button) => {
					button
						.setIcon("trash")
						.setTooltip(t("Remove"))
						.onClick(() => {
							// Remove the preset
							presetFilters.splice(index, 1);
							this.applySettingsUpdate();
							refreshPresetFiltersList();
						});
				});
			});

			// Add button to add new preset
			const addButtonContainer = presetFiltersContainer.createDiv();
			new Setting(addButtonContainer)
				.addButton((button) => {
					button
						.setButtonText(t("Add New Preset"))
						.setCta()
						.onClick(() => {
							// Add a new preset with default options
							const newPreset = {
								id: this.generateUniqueId(),
								name: t("New Filter"),
								options: {
									includeCompleted: true,
									includeInProgress: true,
									includeAbandoned: true,
									includeNotStarted: true,
									includePlanned: true,
									includeParentTasks: true,
									includeChildTasks: true,
									includeSiblingTasks: false,
									advancedFilterQuery: "",
									filterMode: "INCLUDE" as
										| "INCLUDE"
										| "EXCLUDE",
								},
							};

							this.plugin.settings.taskFilter.presetTaskFilters.push(
								newPreset
							);
							this.applySettingsUpdate();

							// Open the edit modal for the new preset
							new PresetFilterModal(this.app, newPreset, () => {
								this.applySettingsUpdate();
								refreshPresetFiltersList();
							}).open();

							refreshPresetFiltersList();
						});
				})
				.addButton((button) => {
					button
						.setButtonText(t("Reset to Default Presets"))
						.onClick(() => {
							// Show confirmation modal
							const modal = new Modal(this.app);
							modal.titleEl.setText(
								t("Reset to Default Presets")
							);

							const content = modal.contentEl.createDiv();
							content.setText(
								t(
									"This will replace all your current presets with the default set. Are you sure?"
								)
							);

							const buttonContainer = modal.contentEl.createDiv();
							buttonContainer.addClass("modal-button-container");

							const cancelButton =
								buttonContainer.createEl("button");
							cancelButton.setText(t("Cancel"));
							cancelButton.addEventListener("click", () => {
								modal.close();
							});

							const confirmButton =
								buttonContainer.createEl("button");
							confirmButton.setText(t("Reset"));
							confirmButton.addClass("mod-warning");
							confirmButton.addEventListener("click", () => {
								this.createDefaultPresetFilters();
								refreshPresetFiltersList();
								modal.close();
							});

							modal.open();
						});
				});
		};

		// Initial render of the preset filters list
		refreshPresetFiltersList();
	}

	private displayWorkflowSettings(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName(t("Workflow"))
			.setDesc(
				t("Configure task workflows for project and process management")
			)
			.setHeading();

		new Setting(containerEl)
			.setName(t("Enable workflow"))
			.setDesc(t("Toggle to enable the workflow system for tasks"))
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.workflow.enableWorkflow)
					.onChange(async (value) => {
						this.plugin.settings.workflow.enableWorkflow = value;
						this.applySettingsUpdate();

						setTimeout(() => {
							this.display();
						}, 200);
					});
			});

		if (!this.plugin.settings.workflow.enableWorkflow) return;

		new Setting(containerEl)
			.setName(t("Auto-add timestamp"))
			.setDesc(
				t(
					"Automatically add a timestamp to the task when it is created"
				)
			)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.workflow.autoAddTimestamp)
					.onChange(async (value) => {
						this.plugin.settings.workflow.autoAddTimestamp = value;
						this.applySettingsUpdate();

						setTimeout(() => {
							this.display();
						}, 200);
					});
			});

		if (this.plugin.settings.workflow.autoAddTimestamp) {
			let fragment = document.createDocumentFragment();
			fragment.createEl("span", {
				text: t("Timestamp format:"),
			});
			fragment.createEl("span", {
				text: "   ",
			});
			const span = fragment.createEl("span");
			new Setting(containerEl)
				.setName(t("Timestamp format"))
				.setDesc(fragment)
				.addMomentFormat((format) => {
					format.setSampleEl(span);
					format.setDefaultFormat(
						this.plugin.settings.workflow.timestampFormat ||
							"YYYY-MM-DD HH:mm:ss"
					);
					format
						.setValue(
							this.plugin.settings.workflow.timestampFormat ||
								"YYYY-MM-DD HH:mm:ss"
						)
						.onChange((value) => {
							this.plugin.settings.workflow.timestampFormat =
								value;
							this.applySettingsUpdate();

							format.updateSample();
						});
				});

			new Setting(containerEl)
				.setName(t("Remove timestamp when moving to next stage"))
				.setDesc(
					t(
						"Remove the timestamp from the current task when moving to the next stage"
					)
				)
				.addToggle((toggle) => {
					toggle
						.setValue(
							this.plugin.settings.workflow
								.removeTimestampOnTransition
						)
						.onChange(async (value) => {
							this.plugin.settings.workflow.removeTimestampOnTransition =
								value;
							this.applySettingsUpdate();
						});
				});

			new Setting(containerEl)
				.setName(t("Calculate spent time"))
				.setDesc(
					t(
						"Calculate and display the time spent on the task when moving to the next stage"
					)
				)
				.addToggle((toggle) => {
					toggle
						.setValue(
							this.plugin.settings.workflow.calculateSpentTime
						)
						.onChange(async (value) => {
							this.plugin.settings.workflow.calculateSpentTime =
								value;
							this.applySettingsUpdate();

							setTimeout(() => {
								this.display();
							}, 200);
						});
				});

			if (this.plugin.settings.workflow.calculateSpentTime) {
				let fragment = document.createDocumentFragment();
				fragment.createEl("span", {
					text: t("Format for spent time:"),
				});
				fragment.createEl("span", {
					text: "   ",
				});
				const span = fragment.createEl("span", {
					text: "HH:mm:ss",
				});
				fragment.createEl("span", {
					text: ".   ",
				});
				fragment.createEl("span", {
					text: t("Calculate spent time when move to next stage."),
				});
				new Setting(containerEl)
					.setName(t("Spent time format"))
					.setDesc(fragment)
					.addMomentFormat((format) => {
						format.setSampleEl(span);
						format.setDefaultFormat(
							this.plugin.settings.workflow.spentTimeFormat ||
								"HH:mm:ss"
						);
						format
							.setValue(
								this.plugin.settings.workflow.spentTimeFormat ||
									"HH:mm:ss"
							)
							.onChange((value) => {
								this.plugin.settings.workflow.spentTimeFormat =
									value;
								this.applySettingsUpdate();

								format.updateSample();
							});
					});

				new Setting(containerEl)
					.setName(t("Calculate full spent time"))
					.setDesc(
						t(
							"Calculate the full spent time from the start of the task to the last stage"
						)
					)
					.addToggle((toggle) => {
						toggle
							.setValue(
								this.plugin.settings.workflow
									.calculateFullSpentTime
							)
							.onChange(async (value) => {
								this.plugin.settings.workflow.calculateFullSpentTime =
									value;
								this.applySettingsUpdate();
							});
					});
			}
		}

		new Setting(containerEl)
			.setName(t("Auto remove last stage marker"))
			.setDesc(
				t(
					"Automatically remove the last stage marker when a task is completed"
				)
			)
			.addToggle((toggle) => {
				toggle
					.setValue(
						this.plugin.settings.workflow.autoRemoveLastStageMarker
					)
					.onChange(async (value) => {
						this.plugin.settings.workflow.autoRemoveLastStageMarker =
							value;
						this.applySettingsUpdate();
					});
			});

		new Setting(containerEl)
			.setName(t("Auto-add next task"))
			.setDesc(
				t(
					"Automatically create a new task with the next stage when completing a task"
				)
			)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.workflow.autoAddNextTask)
					.onChange(async (value) => {
						this.plugin.settings.workflow.autoAddNextTask = value;
						this.applySettingsUpdate();
					});
			});

		// Workflow definitions list
		new Setting(containerEl)
			.setName(t("Workflow definitions"))
			.setDesc(
				t(
					"Configure workflow templates for different types of processes"
				)
			);

		// Create a container for the workflow list
		const workflowContainer = containerEl.createDiv({
			cls: "workflow-container",
		});

		// Function to display workflow list
		const refreshWorkflowList = () => {
			// Clear the container
			workflowContainer.empty();

			const workflows = this.plugin.settings.workflow.definitions;

			if (workflows.length === 0) {
				workflowContainer.createEl("div", {
					cls: "no-workflows-message",
					text: t(
						"No workflow definitions created yet. Click 'Add New Workflow' to create one."
					),
				});
			}

			// Add each workflow in the list
			workflows.forEach((workflow, index) => {
				const workflowRow = workflowContainer.createDiv({
					cls: "workflow-row",
				});

				const workflowSetting = new Setting(workflowRow)
					.setName(workflow.name)
					.setDesc(workflow.description || "");

				// Add edit button
				workflowSetting.addExtraButton((button) => {
					button
						.setIcon("pencil")
						.setTooltip(t("Edit workflow"))
						.onClick(() => {
							new WorkflowDefinitionModal(
								this.app,
								this.plugin,
								workflow,
								(updatedWorkflow) => {
									// Update the workflow
									this.plugin.settings.workflow.definitions[
										index
									] = updatedWorkflow;
									this.applySettingsUpdate();
									refreshWorkflowList();
								}
							).open();
						});
				});

				// Add delete button
				workflowSetting.addExtraButton((button) => {
					button
						.setIcon("trash")
						.setTooltip(t("Remove workflow"))
						.onClick(() => {
							// Show confirmation dialog
							const modal = new Modal(this.app);
							modal.titleEl.setText(t("Delete workflow"));

							const content = modal.contentEl.createDiv();
							content.setText(
								t(
									`Are you sure you want to delete the '${workflow.name}' workflow?`
								)
							);

							const buttonContainer = modal.contentEl.createDiv();
							buttonContainer.addClass("modal-button-container");

							const cancelButton =
								buttonContainer.createEl("button");
							cancelButton.setText(t("Cancel"));
							cancelButton.addEventListener("click", () => {
								modal.close();
							});

							const deleteButton =
								buttonContainer.createEl("button");
							deleteButton.setText(t("Delete"));
							deleteButton.addClass("mod-warning");
							deleteButton.addEventListener("click", () => {
								// Remove the workflow
								this.plugin.settings.workflow.definitions.splice(
									index,
									1
								);
								this.applySettingsUpdate();
								refreshWorkflowList();
								modal.close();
							});

							modal.open();
						});
				});

				// Show stage information
				const stagesInfo = workflowRow.createDiv({
					cls: "workflow-stages-info",
				});

				if (workflow.stages.length > 0) {
					const stagesList = stagesInfo.createEl("ul");
					stagesList.addClass("workflow-stages-list");

					workflow.stages.forEach((stage) => {
						const stageItem = stagesList.createEl("li");
						stageItem.addClass("workflow-stage-item");
						stageItem.addClass(`workflow-stage-type-${stage.type}`);

						const stageName = stageItem.createSpan({
							text: stage.name,
						});

						if (stage.type === "cycle") {
							stageItem.addClass("workflow-stage-cycle");
							stageName.addClass("workflow-stage-name-cycle");
						} else if (stage.type === "terminal") {
							stageItem.addClass("workflow-stage-terminal");
							stageName.addClass("workflow-stage-name-terminal");
						}
					});
				}
			});

			// Add button to create a new workflow
			const addButtonContainer = workflowContainer.createDiv();
			new Setting(addButtonContainer).addButton((button) => {
				button
					.setButtonText(t("Add New Workflow"))
					.setCta()
					.onClick(() => {
						// Create a new empty workflow
						const newWorkflow = {
							id: this.generateUniqueId(),
							name: t("New Workflow"),
							description: "",
							stages: [],
							metadata: {
								version: "1.0",
								created: new Date().toISOString().split("T")[0],
								lastModified: new Date()
									.toISOString()
									.split("T")[0],
							},
						};

						// Show the edit modal for the new workflow
						new WorkflowDefinitionModal(
							this.app,
							this.plugin,
							newWorkflow,
							(createdWorkflow) => {
								// Add the workflow to the list
								this.plugin.settings.workflow.definitions.push(
									createdWorkflow
								);
								this.applySettingsUpdate();
								refreshWorkflowList();
							}
						).open();
					});
			});
		};

		// Initial render of the workflow list
		refreshWorkflowList();
	}

	private displayQuickCaptureSettings(containerEl: HTMLElement): void {
		new Setting(containerEl).setName(t("Quick capture")).setHeading();

		new Setting(containerEl)
			.setName(t("Enable quick capture"))
			.setDesc(
				t(
					"Toggle this to enable Org-mode style quick capture panel. Press Alt+C to open the capture panel."
				)
			)
			.addToggle((toggle) =>
				toggle
					.setValue(
						this.plugin.settings.quickCapture.enableQuickCapture
					)
					.onChange(async (value) => {
						this.plugin.settings.quickCapture.enableQuickCapture =
							value;
						this.applySettingsUpdate();
					})
			);

		if (!this.plugin.settings.quickCapture.enableQuickCapture) return;

		new Setting(containerEl)
			.setName(t("Target file"))
			.setDesc(
				t(
					"The file where captured text will be saved. You can include a path, e.g., 'folder/Quick Capture.md'"
				)
			)
			.addText((text) =>
				text
					.setValue(this.plugin.settings.quickCapture.targetFile)
					.onChange(async (value) => {
						this.plugin.settings.quickCapture.targetFile = value;
						this.applySettingsUpdate();
					})
			);

		new Setting(containerEl)
			.setName(t("Placeholder text"))
			.setDesc(t("Placeholder text to display in the capture panel"))
			.addText((text) =>
				text
					.setValue(this.plugin.settings.quickCapture.placeholder)
					.onChange(async (value) => {
						this.plugin.settings.quickCapture.placeholder = value;
						this.applySettingsUpdate();
					})
			);

		new Setting(containerEl)
			.setName(t("Append to file"))
			.setDesc(
				t(
					"If enabled, captured text will be appended to the target file. If disabled, it will replace the file content."
				)
			)
			.addDropdown((dropdown) =>
				dropdown
					.addOption("append", "Append")
					.addOption("prepend", "Prepend")
					.addOption("replace", "Replace")
					.setValue(this.plugin.settings.quickCapture.appendToFile)
					.onChange(async (value) => {
						this.plugin.settings.quickCapture.appendToFile =
							value as "append" | "prepend" | "replace";
						this.applySettingsUpdate();
					})
			);
	}

	private displayTaskHandlerSettings(containerEl: HTMLElement): void {
		// Add Completed Task Mover settings
		new Setting(containerEl)
			.setName(t("Completed Task Mover"))
			.setHeading();

		new Setting(containerEl)
			.setName(t("Enable completed task mover"))
			.setDesc(
				t(
					"Toggle this to enable commands for moving completed tasks to another file."
				)
			)
			.addToggle((toggle) =>
				toggle
					.setValue(
						this.plugin.settings.completedTaskMover
							.enableCompletedTaskMover
					)
					.onChange(async (value) => {
						this.plugin.settings.completedTaskMover.enableCompletedTaskMover =
							value;
						this.applySettingsUpdate();
					})
			);

		if (this.plugin.settings.completedTaskMover.enableCompletedTaskMover) {
			new Setting(containerEl)
				.setName(t("Task marker type"))
				.setDesc(t("Choose what type of marker to add to moved tasks"))
				.addDropdown((dropdown) => {
					dropdown
						.addOption("version", "Version marker")
						.addOption("date", "Date marker")
						.addOption("custom", "Custom marker")
						.setValue(
							this.plugin.settings.completedTaskMover
								.taskMarkerType
						)
						.onChange(
							async (value: "version" | "date" | "custom") => {
								this.plugin.settings.completedTaskMover.taskMarkerType =
									value;
								this.applySettingsUpdate();
							}
						);
				});

			// Show specific settings based on marker type
			const markerType =
				this.plugin.settings.completedTaskMover.taskMarkerType;

			if (markerType === "version") {
				new Setting(containerEl)
					.setName(t("Version marker text"))
					.setDesc(
						t(
							"Text to append to tasks when moved (e.g., 'version 1.0')"
						)
					)
					.addText((text) =>
						text
							.setPlaceholder("version 1.0")
							.setValue(
								this.plugin.settings.completedTaskMover
									.versionMarker
							)
							.onChange(async (value) => {
								this.plugin.settings.completedTaskMover.versionMarker =
									value;
								this.applySettingsUpdate();
							})
					);
			} else if (markerType === "date") {
				new Setting(containerEl)
					.setName(t("Date marker text"))
					.setDesc(
						t(
							"Text to append to tasks when moved (e.g., 'archived on 2023-12-31')"
						)
					)
					.addText((text) =>
						text
							.setPlaceholder("archived on {{date}}")
							.setValue(
								this.plugin.settings.completedTaskMover
									.dateMarker
							)
							.onChange(async (value) => {
								this.plugin.settings.completedTaskMover.dateMarker =
									value;
								this.applySettingsUpdate();
							})
					);
			} else if (markerType === "custom") {
				new Setting(containerEl)
					.setName(t("Custom marker text"))
					.setDesc(
						t(
							"Use {{DATE:format}} for date formatting (e.g., {{DATE:YYYY-MM-DD}}"
						)
					)
					.addText((text) =>
						text
							.setPlaceholder("moved {{DATE:YYYY-MM-DD HH:mm}}")
							.setValue(
								this.plugin.settings.completedTaskMover
									.customMarker
							)
							.onChange(async (value) => {
								this.plugin.settings.completedTaskMover.customMarker =
									value;
								this.applySettingsUpdate();
							})
					);
			}

			new Setting(containerEl)
				.setName(t("Treat abandoned tasks as completed"))
				.setDesc(
					t(
						"If enabled, abandoned tasks will be treated as completed."
					)
				)
				.addToggle((toggle) => {
					toggle.setValue(
						this.plugin.settings.completedTaskMover
							.treatAbandonedAsCompleted
					);
					toggle.onChange((value) => {
						this.plugin.settings.completedTaskMover.treatAbandonedAsCompleted =
							value;
						this.applySettingsUpdate();
					});
				});

			new Setting(containerEl)
				.setName(t("Complete all moved tasks"))
				.setDesc(
					t(
						"If enabled, all moved tasks will be marked as completed."
					)
				)
				.addToggle((toggle) => {
					toggle.setValue(
						this.plugin.settings.completedTaskMover
							.completeAllMovedTasks
					);
					toggle.onChange((value) => {
						this.plugin.settings.completedTaskMover.completeAllMovedTasks =
							value;
						this.applySettingsUpdate();
					});
				});

			new Setting(containerEl)
				.setName(t("With current file link"))
				.setDesc(
					t(
						"A link to the current file will be added to the parent task of the moved tasks."
					)
				)
				.addToggle((toggle) => {
					toggle.setValue(
						this.plugin.settings.completedTaskMover
							.withCurrentFileLink
					);
					toggle.onChange((value) => {
						this.plugin.settings.completedTaskMover.withCurrentFileLink =
							value;
						this.applySettingsUpdate();
					});
				});
		}

		// --- Task Sorting Settings ---
		new Setting(containerEl)
			.setName(t("Task Sorting"))
			.setDesc(t("Configure how tasks are sorted in the document."))
			.setHeading();

		new Setting(containerEl)
			.setName(t("Enable Task Sorting"))
			.setDesc(t("Toggle this to enable commands for sorting tasks."))
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.sortTasks)
					.onChange(async (value) => {
						this.plugin.settings.sortTasks = value;
						this.applySettingsUpdate();
						// Refresh the settings display to show/hide criteria section
						this.display(); // Or just this section if optimized
					});
			});

		if (this.plugin.settings.sortTasks) {
			new Setting(containerEl)
				.setName(t("Sort Criteria"))
				.setDesc(
					t(
						"Define the order in which tasks should be sorted. Criteria are applied sequentially."
					)
				)
				.setHeading();

			const criteriaContainer = containerEl.createDiv({
				cls: "sort-criteria-container",
			});

			const refreshCriteriaList = () => {
				criteriaContainer.empty();
				const criteria = this.plugin.settings.sortCriteria || [];

				if (criteria.length === 0) {
					criteriaContainer.createEl("p", {
						text: t(
							"No sort criteria defined. Add criteria below."
						),
						cls: "setting-item-description",
					});
				}

				criteria.forEach((criterion, index) => {
					const criterionSetting = new Setting(criteriaContainer)
						.setClass("sort-criterion-row")
						.addDropdown((dropdown) => {
							dropdown
								.addOption("status", t("Status"))
								.addOption("priority", t("Priority"))
								.addOption("dueDate", t("Due Date"))
								.addOption("startDate", t("Start Date"))
								.addOption("scheduledDate", t("Scheduled Date"))
								.addOption("content", t("Content"))
								.setValue(criterion.field)
								.onChange((value: SortCriterion["field"]) => {
									this.plugin.settings.sortCriteria[
										index
									].field = value;
									this.applySettingsUpdate();
								});
						})
						.addDropdown((dropdown) => {
							dropdown
								.addOption("asc", t("Ascending")) // Ascending might mean different things (e.g., High -> Low for priority)
								.addOption("desc", t("Descending")) // Descending might mean different things (e.g., Low -> High for priority)
								.setValue(criterion.order)
								.onChange((value: SortCriterion["order"]) => {
									this.plugin.settings.sortCriteria[
										index
									].order = value;
									this.applySettingsUpdate();
								});
							// Add tooltips explaining what asc/desc means for each field type if possible
							if (criterion.field === "priority") {
								dropdown.selectEl.title = t(
									"Ascending: High -> Low -> None. Descending: None -> Low -> High"
								);
							} else if (
								[
									"dueDate",
									"startDate",
									"scheduledDate",
								].includes(criterion.field)
							) {
								dropdown.selectEl.title = t(
									"Ascending: Earlier -> Later -> None. Descending: None -> Later -> Earlier"
								);
							} else if (criterion.field === "status") {
								dropdown.selectEl.title = t(
									"Ascending respects status order (Overdue first). Descending reverses it."
								);
							} else {
								dropdown.selectEl.title = t(
									"Ascending: A-Z. Descending: Z-A"
								);
							}
						});

					// Controls for reordering and deleting
					criterionSetting.addExtraButton((button) => {
						button
							.setIcon("arrow-up")
							.setTooltip(t("Move Up"))
							.setDisabled(index === 0)
							.onClick(() => {
								if (index > 0) {
									const item =
										this.plugin.settings.sortCriteria.splice(
											index,
											1
										)[0];
									this.plugin.settings.sortCriteria.splice(
										index - 1,
										0,
										item
									);
									this.applySettingsUpdate();
									refreshCriteriaList();
								}
							});
					});
					criterionSetting.addExtraButton((button) => {
						button
							.setIcon("arrow-down")
							.setTooltip(t("Move Down"))
							.setDisabled(index === criteria.length - 1)
							.onClick(() => {
								if (index < criteria.length - 1) {
									const item =
										this.plugin.settings.sortCriteria.splice(
											index,
											1
										)[0];
									this.plugin.settings.sortCriteria.splice(
										index + 1,
										0,
										item
									);
									this.applySettingsUpdate();
									refreshCriteriaList();
								}
							});
					});
					criterionSetting.addExtraButton((button) => {
						button
							.setIcon("trash")
							.setTooltip(t("Remove Criterion"))
							.onClick(() => {
								this.plugin.settings.sortCriteria.splice(
									index,
									1
								);
								this.applySettingsUpdate();
								refreshCriteriaList();
							});
						// Add class to the container element of the extra button
						button.extraSettingsEl.addClass("mod-warning");
					});
				});

				// Button to add a new criterion
				new Setting(criteriaContainer)
					.addButton((button) => {
						button
							.setButtonText(t("Add Sort Criterion"))
							.setCta()
							.onClick(() => {
								const newCriterion: SortCriterion = {
									field: "status",
									order: "asc",
								};
								if (!this.plugin.settings.sortCriteria) {
									this.plugin.settings.sortCriteria = [];
								}
								this.plugin.settings.sortCriteria.push(
									newCriterion
								);
								this.applySettingsUpdate();
								refreshCriteriaList();
							});
					})
					.addButton((button) => {
						// Button to reset to defaults
						button
							.setButtonText(t("Reset to Defaults"))
							.onClick(() => {
								// Optional: Add confirmation dialog here
								this.plugin.settings.sortCriteria = [
									...DEFAULT_SETTINGS.sortCriteria,
								]; // Use spread to copy
								this.applySettingsUpdate();
								refreshCriteriaList();
							});
					});
			};

			refreshCriteriaList(); // Initial render
		}
	} // End displayTaskHandlerSettings

	private displayViewSettings(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName(t("View & Index Configuration"))
			.setDesc(
				t(
					"Configure the Task Genius sidebar views, visibility, order, and create custom views."
				)
			)
			.setHeading();

		new Setting(containerEl)
			.setName(t("Enable task genius view"))
			.setDesc(
				t(
					"Enable task genius view will also enable the task genius indexer, which will provide the task genius view results from whole vault."
				)
			)
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.enableView);
				toggle.onChange((value) => {
					this.plugin.settings.enableView = value;
					this.applySettingsUpdate();
					this.display(); // Refresh settings display
				});
			});

		new Setting(containerEl)
			.setName(t("Prefer metadata format of task"))
			.setDesc(
				t(
					"You can choose dataview format or tasks format, that will influence both index and save format."
				)
			)
			.addDropdown((dropdown) => {
				dropdown
					.addOption("dataview", "Dataview")
					.addOption("tasks", "Tasks")
					.setValue(this.plugin.settings.preferMetadataFormat)
					.onChange(async (value) => {
						this.plugin.settings.preferMetadataFormat = value as
							| "dataview"
							| "tasks";
						this.applySettingsUpdate();
					});
			});

		new Setting(containerEl)
			.setName(t("Use daily note path as date"))
			.setDesc(
				t(
					"If enabled, the daily note path will be used as the date for tasks."
				)
			)
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.useDailyNotePathAsDate);
				toggle.onChange((value) => {
					this.plugin.settings.useDailyNotePathAsDate = value;
					this.applySettingsUpdate();

					setTimeout(() => {
						this.display();
					}, 200);
				});
			});

		if (this.plugin.settings.useDailyNotePathAsDate) {
			const descFragment = document.createDocumentFragment();
			descFragment.createEl("div", {
				text: t(
					"Task Genius will use moment.js and also this format to parse the daily note path."
				),
			});
			descFragment.createEl("div", {
				text: t(
					"You need to set `yyyy` instead of `YYYY` in the format string. And `dd` instead of `DD`."
				),
			});
			new Setting(containerEl)
				.setName(t("Daily note format"))
				.setDesc(descFragment)
				.addText((text) => {
					text.setValue(this.plugin.settings.dailyNoteFormat);
					text.onChange((value) => {
						this.plugin.settings.dailyNoteFormat = value;
						this.applySettingsUpdate();
					});
				});

			new Setting(containerEl)
				.setName(t("Daily note path"))
				.setDesc(t("Select the folder that contains the daily note."))
				.addText((text) => {
					new SingleFolderSuggest(
						this.app,
						text.inputEl,
						this.plugin
					);
					text.setValue(this.plugin.settings.dailyNotePath);
					text.onChange((value) => {
						this.plugin.settings.dailyNotePath = value;
						this.applySettingsUpdate();
					});
				});

			new Setting(containerEl)
				.setName(t("Use as date type"))
				.setDesc(
					t(
						"You can choose due, start, or scheduled as the date type for tasks."
					)
				)
				.addDropdown((dropdown) => {
					dropdown
						.addOption("due", t("Due"))
						.addOption("start", t("Start"))
						.addOption("scheduled", t("Scheduled"))
						.setValue(this.plugin.settings.useAsDateType)
						.onChange(async (value) => {
							this.plugin.settings.useAsDateType = value as
								| "due"
								| "start"
								| "scheduled";
							this.applySettingsUpdate();
						});
				});
		}

		new Setting(containerEl)
			.setName(t("Use relative time for date"))
			.setDesc(
				t(
					"Use relative time for date in task list item, e.g. 'yesterday', 'today', 'tomorrow', 'in 2 days', '3 months ago', etc."
				)
			)
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.useRelativeTimeForDate);
				toggle.onChange((value) => {
					this.plugin.settings.useRelativeTimeForDate = value;
					this.applySettingsUpdate();
				});
			});

		new Setting(containerEl)
			.setName(t("Ignore all tasks behind heading"))
			.setDesc(
				t(
					"Enter the heading to ignore, e.g. '## Project', '## Inbox', separated by comma"
				)
			)
			.addText((text) => {
				text.setValue(this.plugin.settings.ignoreHeading);
				text.onChange((value) => {
					this.plugin.settings.ignoreHeading = value;
					this.applySettingsUpdate();
				});
			});

		new Setting(containerEl)
			.setName(t("Focus all tasks behind heading"))
			.setDesc(
				t(
					"Enter the heading to focus, e.g. '## Project', '## Inbox', separated by comma"
				)
			)
			.addText((text) => {
				text.setValue(this.plugin.settings.focusHeading);
				text.onChange((value) => {
					this.plugin.settings.focusHeading = value;
					this.applySettingsUpdate();
				});
			});

		if (!this.plugin.settings.enableView) return;

		// --- New View Management Section ---
		new Setting(containerEl)
			.setName(t("Manage Views"))
			.setDesc(
				t(
					"Configure sidebar views, order, visibility, and hide/show completed tasks per view."
				)
			)
			.setHeading();

		const viewListContainer = containerEl.createDiv({
			cls: "view-management-list",
		});

		// Function to render the list of views
		const renderViewList = () => {
			viewListContainer.empty();

			this.plugin.settings.viewConfiguration.forEach((view, index) => {
				const viewSetting = new Setting(viewListContainer)
					.setName(view.name)
					.setDesc(`[${view.type}]`)
					.addToggle((toggle) => {
						/* Visibility Toggle */
						toggle
							.setTooltip(t("Show in sidebar"))
							.setValue(view.visible)
							.onChange(async (value) => {
								this.plugin.settings.viewConfiguration[
									index
								].visible = value;
								this.applySettingsUpdate();
							});
					});

				// Edit button - Now available for ALL views to edit rules/name/icon
				viewSetting.addExtraButton((button) => {
					button
						.setIcon("pencil")
						.setTooltip(t("Edit View"))
						.onClick(() => {
							if (view.id === "habit") {
								this.openTab("habit");
								return;
							}
							// Get current rules (might be undefined for defaults initially)
							const currentRules = view.filterRules || {};
							new ViewConfigModal(
								this.app,
								this.plugin,
								view,
								currentRules,
								(
									updatedView: ViewConfig,
									updatedRules: ViewFilterRule
								) => {
									const currentIndex =
										this.plugin.settings.viewConfiguration.findIndex(
											(v) => v.id === updatedView.id
										);
									if (currentIndex !== -1) {
										// Update the view config in the array
										this.plugin.settings.viewConfiguration[
											currentIndex
										] = {
											...updatedView,
											filterRules: updatedRules,
										}; // Ensure rules are saved back to viewConfig
										this.applySettingsUpdate();
										renderViewList(); // Re-render the settings list
									}
								}
							).open();
						});
					button.extraSettingsEl.addClass("view-edit-button"); // Add class for potential styling
				});

				// Reordering buttons
				viewSetting.addExtraButton((button) => {
					button
						.setIcon("arrow-up")
						.setTooltip(t("Move Up"))
						.setDisabled(index === 0)
						.onClick(() => {
							if (index > 0) {
								const item =
									this.plugin.settings.viewConfiguration.splice(
										index,
										1
									)[0];
								this.plugin.settings.viewConfiguration.splice(
									index - 1,
									0,
									item
								);
								this.applySettingsUpdate();
								renderViewList(); // Re-render the list
							}
						});
					button.extraSettingsEl.addClass("view-order-button");
				});
				viewSetting.addExtraButton((button) => {
					button
						.setIcon("arrow-down")
						.setTooltip(t("Move Down"))
						.setDisabled(
							index ===
								this.plugin.settings.viewConfiguration.length -
									1
						)
						.onClick(() => {
							if (
								index <
								this.plugin.settings.viewConfiguration.length -
									1
							) {
								const item =
									this.plugin.settings.viewConfiguration.splice(
										index,
										1
									)[0];
								this.plugin.settings.viewConfiguration.splice(
									index + 1,
									0,
									item
								);
								this.applySettingsUpdate();
								renderViewList(); // Re-render the list
							}
						});
					button.extraSettingsEl.addClass("view-order-button");
				});

				// Delete button - ONLY for custom views
				if (view.type === "custom") {
					viewSetting.addExtraButton((button) => {
						button
							.setIcon("trash")
							.setTooltip(t("Delete View"))
							.onClick(() => {
								// TODO: Add confirmation modal before deleting
								this.plugin.settings.viewConfiguration.splice(
									index,
									1
								);
								// No need to delete from customViewDefinitions anymore
								this.applySettingsUpdate();
								renderViewList();
							});
						button.extraSettingsEl.addClass("view-delete-button");
					});
				}

				// Add new view icon
				const fragement = document.createDocumentFragment();
				const icon = fragement.createEl("i", {
					cls: "view-icon",
				});
				setIcon(icon, view.icon);
				viewSetting.settingEl.prepend(fragement);
			});
		};

		renderViewList(); // Initial render

		// Add New Custom View Button (Logic unchanged)
		const addBtnContainer = containerEl.createDiv();
		new Setting(addBtnContainer).addButton((button) => {
			button
				.setButtonText(t("Add Custom View"))
				.setCta()
				.onClick(() => {
					new ViewConfigModal(
						this.app,
						this.plugin,
						null,
						null,
						(
							createdView: ViewConfig,
							createdRules: ViewFilterRule
						) => {
							if (
								!this.plugin.settings.viewConfiguration.some(
									(v) => v.id === createdView.id
								)
							) {
								// Save with filter rules embedded
								this.plugin.settings.viewConfiguration.push({
									...createdView,
									filterRules: createdRules,
								});
								this.applySettingsUpdate();
								renderViewList();
							} else {
								new Notice(t("Error: View ID already exists."));
							}
						}
					).open();
				});
		});

		// --- Keep Rebuild Index ---
		new Setting(containerEl)
			.setName(t("Rebuild index"))
			.setClass("mod-warning")
			.addButton((button) => {
				button.setButtonText(t("Rebuild")).onClick(async () => {
					new ConfirmModal(this.plugin, {
						title: t("Reindex"),
						message: t(
							"Are you sure you want to force reindex all tasks?"
						),
						confirmText: t("Reindex"),
						cancelText: t("Cancel"),
						onConfirm: async (confirmed: boolean) => {
							if (!confirmed) return;
							try {
								new Notice(
									t(
										"Clearing task cache and rebuilding index..."
									)
								);
								await this.plugin.taskManager.forceReindex();
								new Notice(t("Task index completely rebuilt"));
							} catch (error) {
								console.error(
									"Failed to force reindex tasks:",
									error
								);
								new Notice(t("Failed to force reindex tasks"));
							}
						},
					}).open();
				});
			});
	}

	private displayAboutSettings(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName(t("About") + " Task Genius")
			.setHeading();

		new Setting(containerEl)
			.setName(t("Version"))
			.setDesc(`Task Genius v${this.plugin.manifest.version}`);

		new Setting(containerEl)
			.setName(t("Donate"))
			.setDesc(
				t(
					"If you like this plugin, consider donating to support continued development:"
				)
			)
			.addButton((bt) => {
				bt.buttonEl.outerHTML = `<a href="https://www.buymeacoffee.com/boninall"><img src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=&slug=boninall&button_colour=6495ED&font_colour=ffffff&font_family=Inter&outline_colour=000000&coffee_colour=FFDD00"></a>`;
			});

		new Setting(containerEl)
			.setName(t("Documentation"))
			.setDesc(t("View the documentation for this plugin"))
			.addButton((button) => {
				button.setButtonText(t("Open Documentation")).onClick(() => {
					window.open("https://taskgenius.md/docs");
				});
			});
	}


	// START: New Reward Settings Section
	private displayRewardSettings(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName(t("Rewards"))
			.setDesc(
				t(
					"Configure rewards for completing tasks. Define items, their occurrence chances, and conditions."
				)
			)
			.setHeading();

		// --- Enable Rewards ---
		new Setting(containerEl)
			.setName(t("Enable rewards"))
			.setDesc(t("Toggle to enable or disable the reward system."))
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.rewards.enableRewards)
					.onChange(async (value) => {
						this.plugin.settings.rewards.enableRewards = value;
						this.applySettingsUpdate();
						this.displayRewardSettings(containerEl); // Re-render to show/hide sections
					})
			);

		if (!this.plugin.settings.rewards.enableRewards) {
			return; // Don't render the rest if rewards are disabled
		}

		// --- Reward Display Type ---
		new Setting(containerEl)
			.setName(t("Reward display type"))
			.setDesc(t("Choose how rewards are displayed when earned."))
			.addDropdown((dropdown) => {
				dropdown
					.addOption("modal", t("Modal dialog"))
					.addOption("notice", t("Notice (Auto-accept)"))
					.setValue(
						this.plugin.settings.rewards.showRewardType || "modal"
					)
					.onChange(async (value: "modal" | "notice") => {
						this.plugin.settings.rewards.showRewardType = value;
						this.applySettingsUpdate();
					});
			});

		// --- Occurrence Levels ---
		new Setting(containerEl)
			.setName(t("Occurrence levels"))
			.setDesc(
				t(
					"Define different levels of reward rarity and their probability."
				)
			)
			.setHeading();

		const occurrenceLevelsContainer = containerEl.createDiv({
			cls: "rewards-levels-container",
		});

		const debounceChanceUpdate = debounce(
			(
				text: TextComponent,
				level: OccurrenceLevel,
				value: string,
				index: number
			) => {
				const chance = parseInt(value, 10);
				if (!isNaN(chance) && chance >= 0 && chance <= 100) {
					this.plugin.settings.rewards.occurrenceLevels[
						index
					].chance = chance;
					this.applySettingsUpdate();
				} else {
					// Optional: Provide feedback for invalid input
					new Notice(t("Chance must be between 0 and 100."));
					text.setValue(level.chance.toString()); // Revert
				}
			},
			1000
		);

		const debounceNameUpdate = debounce((value: string, index: number) => {
			this.plugin.settings.rewards.occurrenceLevels[index].name =
				value.trim();
			this.applySettingsUpdate();
		}, 1000);

		this.plugin.settings.rewards.occurrenceLevels.forEach(
			(level, index) => {
				const levelSetting = new Setting(occurrenceLevelsContainer)
					.setClass("rewards-level-row")
					.addText((text) =>
						text
							.setPlaceholder(t("Level Name (e.g., common)"))
							.setValue(level.name)
							.onChange((value) => {
								debounceNameUpdate(value, index);
							})
					)
					.addText((text) =>
						text
							.setPlaceholder(t("Chance (%)"))
							.setValue(level.chance.toString())
							.onChange((value) => {
								debounceChanceUpdate(text, level, value, index);
							})
					)
					.addButton((button) =>
						button
							.setIcon("trash")
							.setTooltip(t("Delete Level"))
							.setClass("mod-warning")
							.onClick(() => {
								this.plugin.settings.rewards.occurrenceLevels.splice(
									index,
									1
								);
								this.applySettingsUpdate();

								setTimeout(() => {
									this.display();
								}, 200);
							})
					);
			}
		);

		new Setting(occurrenceLevelsContainer).addButton((button) =>
			button
				.setButtonText(t("Add occurrence level"))
				.setCta()
				.onClick(() => {
					const newLevel: OccurrenceLevel = {
						name: t("New Level"),
						chance: 0,
					};
					this.plugin.settings.rewards.occurrenceLevels.push(
						newLevel
					);
					this.applySettingsUpdate();
					this.displayRewardSettings(containerEl);
				})
		);

		// --- Reward Items ---
		new Setting(containerEl)
			.setName(t("Reward items"))
			.setDesc(t("Manage the specific rewards that can be obtained."))
			.setHeading();

		const rewardItemsContainer = containerEl.createDiv({
			cls: "rewards-items-container",
		});

		// Get available occurrence level names for dropdown
		const levelNames = this.plugin.settings.rewards.occurrenceLevels.map(
			(l) => l.name
		);
		if (levelNames.length === 0) levelNames.push(t("No levels defined"));

		this.plugin.settings.rewards.rewardItems.forEach((item, index) => {
			const itemSetting = new Setting(rewardItemsContainer)
				.setClass("rewards-item-row")
				.addTextArea((text) =>
					text // Use TextArea for potentially longer names
						.setPlaceholder(t("Reward Name/Text"))
						.setValue(item.name)
						.onChange((value) => {
							this.plugin.settings.rewards.rewardItems[
								index
							].name = value;
							this.applySettingsUpdate();
						})
				)
				.addDropdown((dropdown) => {
					levelNames.forEach((levelName) => {
						dropdown.addOption(levelName, levelName);
					});
					dropdown
						.setValue(item.occurrence || levelNames[0]) // Handle missing/default
						.onChange((value) => {
							this.plugin.settings.rewards.rewardItems[
								index
							].occurrence = value;
							this.applySettingsUpdate();
						});
				})
				.addText((text) => {
					text.inputEl.ariaLabel = t("Inventory (-1 for ∞)");
					text.setPlaceholder(t("Inventory (-1 for ∞)")) // For Inventory
						.setValue(item.inventory.toString())
						.onChange((value) => {
							const inventory = parseInt(value, 10);
							if (!isNaN(inventory)) {
								this.plugin.settings.rewards.rewardItems[
									index
								].inventory = inventory;
								this.applySettingsUpdate();
							} else {
								new Notice(t("Invalid inventory number."));
								text.setValue(item.inventory.toString()); // Revert
							}
						});
				})
				.addText((text) =>
					text // For Condition
						.setPlaceholder(t("Condition (e.g., #tag AND project)"))
						.setValue(item.condition || "")
						.onChange((value) => {
							this.plugin.settings.rewards.rewardItems[
								index
							].condition = value.trim() || undefined; // Store as undefined if empty
							this.applySettingsUpdate();
						})
				)
				.addText((text) => {
					text.setPlaceholder(t("Image url (optional)")) // For Image URL
						.setValue(item.imageUrl || "")
						.onChange((value) => {
							this.plugin.settings.rewards.rewardItems[
								index
							].imageUrl = value.trim() || undefined; // Store as undefined if empty
							this.applySettingsUpdate();
						});

					new ImageSuggest(this.app, text.inputEl, this.plugin);
				})
				.addButton((button) =>
					button
						.setIcon("trash")
						.setTooltip(t("Delete reward item"))
						.setClass("mod-warning")
						.onClick(() => {
							this.plugin.settings.rewards.rewardItems.splice(
								index,
								1
							);
							this.applySettingsUpdate();
							this.displayRewardSettings(containerEl); // Re-render
						})
				);
			// Add some spacing or dividers if needed visually
			rewardItemsContainer.createEl("hr", {
				cls: "rewards-item-divider",
			});
		});

		if (this.plugin.settings.rewards.rewardItems.length === 0) {
			rewardItemsContainer.createEl("p", {
				text: t("No reward items defined yet."),
				cls: "setting-item-description",
			});
		}

		new Setting(rewardItemsContainer).addButton((button) =>
			button
				.setButtonText(t("Add reward item"))
				.setCta()
				.onClick(() => {
					const newItem: RewardItem = {
						id: `reward-${Date.now()}-${Math.random()
							.toString(36)
							.substring(2, 7)}`, // Simple unique ID
						name: t("New Reward"),
						occurrence:
							this.plugin.settings.rewards.occurrenceLevels[0]
								?.name || "default", // Use first level or default
						inventory: -1, // Default to infinite
					};
					this.plugin.settings.rewards.rewardItems.push(newItem);
					this.applySettingsUpdate();
					this.displayRewardSettings(containerEl); // Re-render
				})
		);
	}

	private displayHabitSettings(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName(t("Habit"))
			.setDesc(
				t(
					"Configure habit settings, including adding new habits, editing existing habits, and managing habit completion."
				)
			)
			.setHeading();

		new Setting(containerEl)
			.setName(t("Enable habits"))
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.habit.enableHabits)
					.onChange(async (value) => {
						this.plugin.settings.habit.enableHabits = value;
						this.applySettingsUpdate();
					});
			});

		const habitContainer = containerEl.createDiv({
			cls: "habit-settings-container",
		});

		// Habit List
		this.displayHabitList(habitContainer);
	}

	// Helper methods for task filters and workflows
	private generateUniqueId(): string {
		return Date.now().toString() + Math.random().toString(36).substr(2, 9);
	}

	private createDefaultPresetFilters(): void {
		// Clear existing presets if any
		this.plugin.settings.taskFilter.presetTaskFilters = [];

		// Add default presets
		const defaultPresets = [
			{
				id: this.generateUniqueId(),
				name: t("Incomplete tasks"),
				options: {
					includeCompleted: false,
					includeInProgress: true,
					includeAbandoned: false,
					includeNotStarted: true,
					includePlanned: true,
					includeParentTasks: true,
					includeChildTasks: true,
					includeSiblingTasks: false,
					advancedFilterQuery: "",
					filterMode: "INCLUDE" as "INCLUDE" | "EXCLUDE",
				},
			},
			{
				id: this.generateUniqueId(),
				name: t("In progress tasks"),
				options: {
					includeCompleted: false,
					includeInProgress: true,
					includeAbandoned: false,
					includeNotStarted: false,
					includePlanned: false,
					includeParentTasks: true,
					includeChildTasks: true,
					includeSiblingTasks: false,
					advancedFilterQuery: "",
					filterMode: "INCLUDE" as "INCLUDE" | "EXCLUDE",
				},
			},
			{
				id: this.generateUniqueId(),
				name: t("Completed tasks"),
				options: {
					includeCompleted: true,
					includeInProgress: false,
					includeAbandoned: false,
					includeNotStarted: false,
					includePlanned: false,
					includeParentTasks: false,
					includeChildTasks: true,
					includeSiblingTasks: false,
					advancedFilterQuery: "",
					filterMode: "INCLUDE" as "INCLUDE" | "EXCLUDE",
				},
			},
			{
				id: this.generateUniqueId(),
				name: t("All tasks"),
				options: {
					includeCompleted: true,
					includeInProgress: true,
					includeAbandoned: true,
					includeNotStarted: true,
					includePlanned: true,
					includeParentTasks: true,
					includeChildTasks: true,
					includeSiblingTasks: true,
					advancedFilterQuery: "",
					filterMode: "INCLUDE" as "INCLUDE" | "EXCLUDE",
				},
			},
		];

		// Add default presets to settings
		this.plugin.settings.taskFilter.presetTaskFilters = defaultPresets;
		this.applySettingsUpdate();
	}

	// 添加渲染格式文本的辅助方法
	private renderFormatPreview(formatText: string, sampleData: any): string {
		try {
			// 保存原始的customFormat值
			const originalFormat = this.plugin.settings.customFormat;

			// 临时设置customFormat为我们要预览的格式
			this.plugin.settings.customFormat = formatText;

			// 使用插件的formatProgressText函数计算预览
			const result = formatProgressText(sampleData, this.plugin);

			// 恢复原始的customFormat值
			this.plugin.settings.customFormat = originalFormat;

			return result;
		} catch (error) {
			console.error("Error in renderFormatPreview:", error);
			throw error;
		}
	}

	// 更新预览的方法
	private updateFormatPreview(
		containerEl: HTMLElement,
		formatText: string
	): void {
		const previewContainer = containerEl.querySelector(
			".custom-format-preview-content"
		);
		if (!previewContainer) return;

		// 创建示例数据
		const sampleData = {
			completed: 3,
			total: 5,
			inProgress: 1,
			abandoned: 0,
			notStarted: 0,
			planned: 1,
			percentages: {
				completed: 60,
				inProgress: 20,
				abandoned: 0,
				notStarted: 0,
				planned: 20,
			},
		};

		try {
			const renderedText = this.renderFormatPreview(
				formatText,
				sampleData
			);
			previewContainer.setText(renderedText);
			previewContainer.removeClass("custom-format-preview-error");
		} catch (error) {
			previewContainer.setText("Error rendering format");
			previewContainer.addClass("custom-format-preview-error");
		}
	}

	private displayHabitList(containerEl: HTMLElement): void {
		// 创建习惯列表组件
		new HabitList(this.plugin, containerEl);
	}
}

class PresetFilterModal extends Modal {
	constructor(app: App, private preset: any, private onSave: () => void) {
		super(app);
		// Migrate old preset options if needed
		if (this.preset && this.preset.options) {
			this.preset.options = migrateOldFilterOptions(this.preset.options);
		}
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		// Set modal title
		this.titleEl.setText(t("Edit Filter: ") + this.preset.name);

		// Create form for filter options
		new Setting(contentEl).setName(t("Filter name")).addText((text) => {
			text.setValue(this.preset.name).onChange((value) => {
				this.preset.name = value;
			});
		});

		// Task status section
		new Setting(contentEl)
			.setName(t("Task Status"))
			.setDesc(t("Include or exclude tasks based on their status"));

		const statusOptions = [
			{ id: "includeCompleted", name: t("Include Completed Tasks") },
			{ id: "includeInProgress", name: t("Include In Progress Tasks") },
			{ id: "includeAbandoned", name: t("Include Abandoned Tasks") },
			{ id: "includeNotStarted", name: t("Include Not Started Tasks") },
			{ id: "includePlanned", name: t("Include Planned Tasks") },
		];

		for (const option of statusOptions) {
			new Setting(contentEl).setName(option.name).addToggle((toggle) => {
				toggle
					.setValue(this.preset.options[option.id])
					.onChange((value) => {
						this.preset.options[option.id] = value;
					});
			});
		}

		// Related tasks section
		new Setting(contentEl)
			.setName(t("Related Tasks"))
			.setDesc(
				t("Include parent, child, and sibling tasks in the filter")
			);

		const relatedOptions = [
			{ id: "includeParentTasks", name: t("Include Parent Tasks") },
			{ id: "includeChildTasks", name: t("Include Child Tasks") },
			{ id: "includeSiblingTasks", name: t("Include Sibling Tasks") },
		];

		for (const option of relatedOptions) {
			new Setting(contentEl).setName(option.name).addToggle((toggle) => {
				toggle
					.setValue(this.preset.options[option.id])
					.onChange((value) => {
						this.preset.options[option.id] = value;
					});
			});
		}

		// Advanced filter section
		new Setting(contentEl)
			.setName(t("Advanced Filter"))
			.setDesc(
				t(
					"Use boolean operations: AND, OR, NOT. Example: 'text content AND #tag1'"
				)
			);

		new Setting(contentEl)
			.setName(t("Filter query"))
			.setDesc(
				t(
					"Use boolean operations: AND, OR, NOT. Example: 'text content AND #tag1'"
				)
			)
			.addText((text) => {
				text.setValue(this.preset.options.advancedFilterQuery).onChange(
					(value) => {
						this.preset.options.advancedFilterQuery = value;
					}
				);
			});

		new Setting(contentEl)
			.setName(t("Filter Mode"))
			.setDesc(
				t("Choose whether to show or hide tasks that match the filters")
			)
			.addDropdown((dropdown) => {
				dropdown
					.addOption("INCLUDE", t("Show matching tasks"))
					.addOption("EXCLUDE", t("Hide matching tasks"))
					.setValue(this.preset.options.filterMode || "INCLUDE")
					.onChange((value: "INCLUDE" | "EXCLUDE") => {
						this.preset.options.filterMode = value;
					});
			});

		// Save and cancel buttons
		new Setting(contentEl)
			.addButton((button) => {
				button
					.setButtonText(t("Save"))
					.setCta()
					.onClick(() => {
						this.onSave();
						this.close();
					});
			})
			.addButton((button) => {
				button.setButtonText(t("Cancel")).onClick(() => {
					this.close();
				});
			});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
