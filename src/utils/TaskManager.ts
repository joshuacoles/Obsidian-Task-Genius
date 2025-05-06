/**
 * TaskManager - Primary interface for task management
 *
 * This class serves as the main entry point for all task-related operations,
 * wrapping the TaskIndexer implementation and providing a simplified API.
 */

import { App, Component, MetadataCache, TFile, Vault } from "obsidian";
import {
	Task,
	TaskFilter,
	SortingCriteria,
	TaskCache,
} from "./types/TaskIndex";
import { TaskIndexer } from "./import/TaskIndexer";
import { TaskWorkerManager } from "./workers/TaskWorkerManager";
import { LocalStorageCache } from "./persister";
import TaskProgressBarPlugin from "../index";
import { RRule, RRuleSet, rrulestr } from "rrule";

/**
 * TaskManager options
 */
export interface TaskManagerOptions {
	/** Whether to use web workers for processing (if available) */
	useWorkers?: boolean;
	/** Number of workers to use (if workers are enabled) */
	maxWorkers?: number;
	/** Whether to print debug information */
	debug?: boolean;
}

/**
 * Default options for task manager
 */
const DEFAULT_OPTIONS: TaskManagerOptions = {
	useWorkers: true,
	maxWorkers: 2,
	debug: false,
};

/**
 * TaskManager provides a unified interface for working with tasks in Obsidian
 */
export class TaskManager extends Component {
	/** The primary task indexer implementation */
	private indexer: TaskIndexer;
	/** Optional worker manager for background processing */
	private workerManager?: TaskWorkerManager;
	/** Options for the task manager */
	private options: TaskManagerOptions;
	/** Whether the manager has been initialized */
	private initialized: boolean = false;
	/** Whether initialization is currently in progress */
	private isInitializing: boolean = false;
	/** Whether we should trigger update events after initialization */
	private updateEventPending: boolean = false;
	/** Local-storage backed cache of metadata objects. */
	persister: LocalStorageCache;

	/**
	 * Create a new task manager
	 */
	constructor(
		private app: App,
		private vault: Vault,
		private metadataCache: MetadataCache,
		private plugin: TaskProgressBarPlugin,
		options: Partial<TaskManagerOptions> = {}
	) {
		super();
		this.options = { ...DEFAULT_OPTIONS, ...options };

		// Initialize the main indexer
		this.indexer = new TaskIndexer(
			this.app,
			this.vault,
			this.metadataCache
		);
		this.persister = new LocalStorageCache(this.app.appId);

		// Preload tasks from persister to improve initialization speed
		this.preloadTasksFromCache();

		// Set up the worker manager if workers are enabled
		if (this.options.useWorkers) {
			try {
				this.workerManager = new TaskWorkerManager(
					this.vault,
					this.metadataCache,
					{
						maxWorkers: this.options.maxWorkers,
						debug: this.options.debug,
						settings: this.plugin.settings,
					}
				);
				this.log("Worker manager initialized");
			} catch (error) {
				console.error("Failed to initialize worker manager:", error);
				this.log("Falling back to single-threaded indexing");
			}
		}

		// Register event handlers
		this.registerEventHandlers();

		this.addChild(this.indexer);
		if (this.workerManager) {
			this.addChild(this.workerManager);
		}
	}

	/**
	 * Register event handlers for file changes
	 */
	private registerEventHandlers(): void {
		// Watch for file modifications
		this.registerEvent(
			this.metadataCache.on("changed", (file, content, cache) => {
				this.log("All files resolved, updating indexes");
				// Trigger a full index update when all files are resolved
				if (file instanceof TFile && file.extension === "md") {
					this.indexFile(file);
				}
			})
		);

		// Watch for individual file changes
		this.registerEvent(
			this.metadataCache.on("deleted", (file) => {
				if (file instanceof TFile && file.extension === "md") {
					this.removeFileFromIndex(file);
				}
			})
		);

		// Watch for file deletions
		this.registerEvent(
			this.vault.on("rename", (file, oldPath) => {
				if (file instanceof TFile && file.extension === "md") {
					this.removeFileFromIndexByOldPath(oldPath);
					this.indexFile(file);
				}
			})
		);

		// Watch for new files
		this.app.workspace.onLayoutReady(() => {
			this.registerEvent(
				this.vault.on("create", (file) => {
					if (file instanceof TFile && file.extension === "md") {
						this.indexFile(file);
					}
				})
			);
		});
	}

	/**
	 * Preload tasks from persistent cache for faster startup
	 */
	private async preloadTasksFromCache(): Promise<void> {
		try {
			// Try to load the consolidated cache first (much faster)
			const consolidatedCache =
				await this.persister.loadConsolidatedCache<TaskCache>(
					"taskCache"
				);

			if (consolidatedCache) {
				// We have a valid consolidated cache - use it directly
				this.log(
					`Loading consolidated task cache from version ${consolidatedCache.version}`
				);

				// Replace the indexer's cache with the cached version
				this.indexer.setCache(consolidatedCache.data);

				// Trigger a task cache updated event
				this.app.workspace.trigger(
					"task-genius:task-cache-updated",
					this.indexer.getCache()
				);

				this.plugin.preloadedTasks = Array.from(
					this.indexer.getCache().tasks.values()
				);

				this.plugin.triggerViewUpdate();

				this.log(
					`Preloaded ${
						this.indexer.getCache().tasks.size
					} tasks from consolidated cache`
				);
				return;
			}

			// Fall back to loading individual file caches
			this.log(
				"No consolidated cache found, falling back to file-by-file loading"
			);
			const cachedTasks = await this.persister.getAll<Task[]>();
			if (cachedTasks && Object.keys(cachedTasks).length > 0) {
				this.log(
					`Preloading ${
						Object.keys(cachedTasks).length
					} files from cache`
				);

				// Update the indexer with all cached tasks
				for (const [filePath, cacheItem] of Object.entries(
					cachedTasks
				)) {
					if (cacheItem && cacheItem.data) {
						this.indexer.updateIndexWithTasks(
							filePath,
							cacheItem.data
						);
						this.log(
							`Preloaded ${cacheItem.data.length} tasks from cache for ${filePath}`
						);
					}
				}

				// Store the consolidated cache for next time
				await this.storeConsolidatedCache();

				// Trigger a task cache updated event
				this.app.workspace.trigger(
					"task-genius:task-cache-updated",
					this.indexer.getCache()
				);
				this.log(
					`Preloaded ${
						this.indexer.getCache().tasks.size
					} tasks from file caches`
				);
			} else {
				this.log("No cached tasks found for preloading");
			}
		} catch (error) {
			console.error("Error preloading tasks from cache:", error);
		}
	}

	/**
	 * Store the current task cache as a consolidated cache
	 */
	private async storeConsolidatedCache(): Promise<void> {
		try {
			const cache = this.indexer.getCache();
			await this.persister.storeConsolidatedCache("taskCache", cache);
			this.log(
				`Stored consolidated cache with ${cache.tasks.size} tasks`
			);
		} catch (error) {
			console.error("Error storing consolidated task cache:", error);
		}
	}

	/**
	 * Initialize the task manager and index all files
	 */
	public async initialize(): Promise<void> {
		if (this.initialized) return;
		if (this.isInitializing) {
			this.log("Initialization already in progress, skipping");
			this.updateEventPending = true; // Mark event as pending when init completes
			return;
		}

		this.isInitializing = true;
		this.updateEventPending = true; // We'll trigger the event when done
		this.log("Initializing task manager");

		try {
			// Get all Markdown files
			const files = this.vault.getMarkdownFiles();
			this.log(`Found ${files.length} files to index`);

			// Try to synchronize task cache with current files and clean up non-existent file caches
			try {
				const currentFilePaths = files.map((file) => file.path);
				const cleared = await this.persister.synchronize(
					currentFilePaths
				);
				if (cleared.size > 0) {
					this.log(
						`Dropped ${cleared.size} out-of-date file task caches`
					);
				}
			} catch (error) {
				console.error("Error synchronizing task cache:", error);
			}

			// Get list of files that have already been preloaded from cache
			const preloadedFiles = new Set<string>();
			for (const taskId of this.indexer.getCache().tasks.keys()) {
				const task = this.indexer.getCache().tasks.get(taskId);
				if (task) {
					preloadedFiles.add(task.filePath);
				}
			}

			this.log(`${preloadedFiles.size} files already loaded from cache`);

			// Filter out files that have already been loaded from cache
			const filesToProcess = files.filter(
				(file) => !preloadedFiles.has(file.path)
			);
			this.log(`${filesToProcess.length} files still need processing`);

			if (this.workerManager && filesToProcess.length > 0) {
				try {
					// Process files in batches to avoid excessive memory usage
					const batchSize = 200;
					let importedCount = 0;
					let cachedCount = 0;

					for (let i = 0; i < filesToProcess.length; i += batchSize) {
						const batch = filesToProcess.slice(i, i + batchSize);
						this.log(
							`Processing batch ${
								Math.floor(i / batchSize) + 1
							}/${Math.ceil(
								filesToProcess.length / batchSize
							)} (${batch.length} files)`
						);

						// Process each file in the batch
						for (const file of batch) {
							// Try to load from cache
							try {
								const cached = await this.persister.loadFile<
									Task[]
								>(file.path);
								if (cached && cached.time >= file.stat.mtime) {
									// Update index with cached data
									this.indexer.updateIndexWithTasks(
										file.path,
										cached.data
									);
									this.log(
										`Loaded ${cached.data.length} tasks from cache for ${file.path}`
									);
									cachedCount++;
								} else {
									// Cache doesn't exist or is outdated, process with worker
									// Don't trigger events - we'll trigger once when initialization is complete
									await this.processFileWithoutEvents(file);
									importedCount++;
								}
							} catch (error) {
								console.error(
									`Error processing file ${file.path}:`,
									error
								);
								// Fall back to main thread processing
								await this.indexer.indexFile(file);
								importedCount++;
							}
						}

						// Yield time to the main thread between batches
						await new Promise((resolve) => setTimeout(resolve, 0));
					}

					this.log(
						`Completed worker-based indexing (${importedCount} imported, ${cachedCount} from cache, ${preloadedFiles.size} preloaded)`
					);
				} catch (error) {
					console.error(
						"Error using workers for initial indexing:",
						error
					);
					this.log("Falling back to single-threaded indexing");

					// If worker usage fails, reinitialize index and use single-threaded processing
					// We'll preserve any preloaded data
					await this.fallbackToMainThreadIndexing(filesToProcess);
				}
			} else if (filesToProcess.length > 0) {
				// No worker or no files to process, use single-threaded indexing
				await this.fallbackToMainThreadIndexing(filesToProcess);
			}

			this.initialized = true;
			const totalTasks = this.indexer.getCache().tasks.size;
			this.log(`Task manager initialized with ${totalTasks} tasks`);

			// Store the consolidated cache after we've finished processing everything
			await this.storeConsolidatedCache();

			// Trigger task cache updated event once initialization is complete
			if (this.updateEventPending) {
				this.app.workspace.trigger(
					"task-genius:task-cache-updated",
					this.indexer.getCache()
				);
				this.updateEventPending = false; // Reset the pending flag
			}
		} catch (error) {
			console.error("Task manager initialization failed:", error);
			this.updateEventPending = false; // Reset on error
		} finally {
			this.isInitializing = false;
		}
	}

	/**
	 * Process a file using worker without triggering events - used during initialization
	 */
	private async processFileWithoutEvents(file: TFile): Promise<void> {
		if (!this.workerManager) {
			// If worker manager is not available, use main thread processing
			await this.indexer.indexFile(file);
			// Cache the results
			const tasks = this.getTasksForFile(file.path);
			if (tasks.length > 0) {
				await this.persister.storeFile(file.path, tasks);
			}
			return;
		}

		try {
			// Use the worker to process the file
			const tasks = await this.workerManager.processFile(file);

			// Update the index with the tasks
			this.indexer.updateIndexWithTasks(file.path, tasks);

			// Store tasks in cache if there are any
			if (tasks.length > 0) {
				await this.persister.storeFile(file.path, tasks);
				this.log(
					`Processed and cached ${tasks.length} tasks in ${file.path}`
				);
			} else {
				// If no tasks were found, remove the file from cache
				await this.persister.removeFile(file.path);
			}

			// No event triggering in this version
		} catch (error) {
			console.error(`Worker error processing ${file.path}:`, error);
			// Fall back to main thread indexing
			await this.indexer.indexFile(file);
			// Cache the results after main thread processing
			const tasks = this.getTasksForFile(file.path);
			if (tasks.length > 0) {
				await this.persister.storeFile(file.path, tasks);
			}

			// No event triggering in this version
		}
	}

	/**
	 * Process a file using worker and update cache (with event triggering)
	 */
	private async processFileWithWorker(file: TFile): Promise<void> {
		if (!this.workerManager) {
			// If worker manager is not available, use main thread processing
			await this.indexer.indexFile(file);
			// Cache the results
			const tasks = this.getTasksForFile(file.path);
			if (tasks.length > 0) {
				await this.persister.storeFile(file.path, tasks);
			}
			return;
		}

		try {
			// Use the worker to process the file
			const tasks = await this.workerManager.processFile(file);

			// Update the index with the tasks
			this.indexer.updateIndexWithTasks(file.path, tasks);

			// Store tasks in cache if there are any
			if (tasks.length > 0) {
				await this.persister.storeFile(file.path, tasks);
				this.log(
					`Processed and cached ${tasks.length} tasks in ${file.path}`
				);
			} else {
				// If no tasks were found, remove the file from cache
				await this.persister.removeFile(file.path);
			}

			// Only trigger events if we're not in the process of initializing
			// This prevents circular event triggering during initialization
			if (!this.isInitializing) {
				// Update the consolidated cache
				await this.storeConsolidatedCache();

				// Trigger task cache updated event
				this.app.workspace.trigger(
					"task-genius:task-cache-updated",
					this.indexer.getCache()
				);
			}
		} catch (error) {
			console.error(`Worker error processing ${file.path}:`, error);
			// Fall back to main thread indexing
			await this.indexer.indexFile(file);
			// Cache the results after main thread processing
			const tasks = this.getTasksForFile(file.path);
			if (tasks.length > 0) {
				await this.persister.storeFile(file.path, tasks);
			}

			// Only trigger events if we're not in the process of initializing
			if (!this.isInitializing) {
				// Update the consolidated cache
				await this.storeConsolidatedCache();

				// Trigger task cache updated event
				this.app.workspace.trigger(
					"task-genius:task-cache-updated",
					this.indexer.getCache()
				);
			}
		}
	}

	/**
	 * When worker processing fails, fall back to main thread processing
	 */
	private async fallbackToMainThreadIndexing(files: TFile[]): Promise<void> {
		this.log(`Indexing ${files.length} files using main thread...`);

		// Use smaller batch size to avoid UI freezing
		const batchSize = 10;
		let importedCount = 0;
		let cachedCount = 0;

		for (let i = 0; i < files.length; i += batchSize) {
			const batch = files.slice(i, i + batchSize);

			// Process each file in the batch
			for (const file of batch) {
				// Try to load from cache
				try {
					const cached = await this.persister.loadFile<Task[]>(
						file.path
					);
					if (cached && cached.time >= file.stat.mtime) {
						// Update index with cached data
						this.indexer.updateIndexWithTasks(
							file.path,
							cached.data
						);
						this.log(
							`Loaded ${cached.data.length} tasks from cache for ${file.path}`
						);
						cachedCount++;
					} else {
						// Cache doesn't exist or is outdated, use main thread processing
						await this.indexer.indexFile(file);
						// Get processed tasks and store to cache
						const tasks = this.getTasksForFile(file.path);
						if (tasks.length > 0) {
							await this.persister.storeFile(file.path, tasks);
							this.log(
								`Processed and cached ${tasks.length} tasks in ${file.path}`
							);
						} else {
							// If no tasks were found, remove the file from cache if it exists
							if (await this.persister.hasFile(file.path)) {
								await this.persister.removeFile(file.path);
							}
						}
						importedCount++;
					}
				} catch (error) {
					console.error(`Error processing file ${file.path}:`, error);
					// Fall back to main thread processing in case of error
					await this.indexer.indexFile(file);
					importedCount++;
				}
			}

			// Update progress log
			if ((i + batchSize) % 100 === 0 || i + batchSize >= files.length) {
				this.log(
					`Indexed ${Math.min(i + batchSize, files.length)}/${
						files.length
					} files (${Math.round(
						(Math.min(i + batchSize, files.length) / files.length) *
							100
					)}%)`
				);
			}

			// Yield time to the main thread
			await new Promise((resolve) => setTimeout(resolve, 0));
		}

		const preloadedFiles =
			this.indexer.getCache().tasks.size - (importedCount + cachedCount);

		this.log(
			`Completed main-thread indexing (${importedCount} imported, ${cachedCount} from cache, approximately ${preloadedFiles} tasks from preload)`
		);

		// After all files are processed, only trigger the event at the end of batch processing
		// This helps prevent recursive event triggering during initialization
		if (!this.isInitializing) {
			// Update the consolidated cache
			await this.storeConsolidatedCache();

			// Trigger task cache updated event
			this.app.workspace.trigger(
				"task-genius:task-cache-updated",
				this.indexer.getCache()
			);
		}
	}

	/**
	 * Index a single file
	 */
	public async indexFile(file: TFile): Promise<void> {
		if (!this.initialized) {
			if (this.isInitializing) {
				this.log(
					`Skipping indexFile for ${file.path} - initialization in progress`
				);
				return;
			}

			this.log(`Need to initialize before indexing file: ${file.path}`);
			await this.initialize();

			// If initialization failed, return early
			if (!this.initialized) {
				console.warn(
					`Cannot index ${file.path} - initialization failed`
				);
				return;
			}
		}

		this.log(`Indexing file: ${file.path}`);

		// Use the worker if available
		if (this.workerManager) {
			// During initialization, use the method without event triggering
			if (this.isInitializing) {
				await this.processFileWithoutEvents(file);
			} else {
				await this.processFileWithWorker(file);
			}
		} else {
			// Use main thread indexing
			await this.indexer.indexFile(file);
			// Cache the results
			const tasks = this.getTasksForFile(file.path);
			if (tasks.length > 0) {
				await this.persister.storeFile(file.path, tasks);
				this.log(
					`Processed ${tasks.length} tasks in ${file.path} using main thread`
				);
			} else {
				// If no tasks found, remove from cache if it exists
				if (await this.persister.hasFile(file.path)) {
					await this.persister.removeFile(file.path);
				}
			}

			// Only trigger events if not initializing
			if (!this.isInitializing) {
				// Trigger task cache updated event
				this.app.workspace.trigger(
					"task-genius:task-cache-updated",
					this.indexer.getCache()
				);
			}
		}
	}

	/**
	 * Synchronize worker-processed tasks with the main indexer
	 */
	private syncWorkerResults(filePath: string, tasks: Task[]): void {
		// Directly update the indexer with the worker results
		this.indexer.updateIndexWithTasks(filePath, tasks);

		// Trigger task cache updated event
		this.app.workspace.trigger(
			"task-genius:task-cache-updated",
			this.indexer.getCache()
		);
	}

	/**
	 * Format a date for index keys (YYYY-MM-DD)
	 */
	private formatDateForIndex(date: number): string {
		const d = new Date(date);
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
			2,
			"0"
		)}-${String(d.getDate()).padStart(2, "0")}`;
	}

	/**
	 * Remove a file from the index based on the old path
	 */
	private removeFileFromIndexByOldPath(oldPath: string): void {
		this.indexer.updateIndexWithTasks(oldPath, []);
		try {
			this.persister.removeFile(oldPath);
			this.log(`Removed ${oldPath} from cache`);

			// Trigger task cache updated event
			this.app.workspace.trigger(
				"task-genius:task-cache-updated",
				this.indexer.getCache()
			);
		} catch (error) {
			console.error(`Error removing ${oldPath} from cache:`, error);
		}
	}

	/**
	 * Remove a file from the index
	 */
	private removeFileFromIndex(file: TFile): void {
		// 使用 indexer 的方法来删除文件
		this.indexer.updateIndexWithTasks(file.path, []);

		// 从缓存中删除文件
		try {
			this.persister.removeFile(file.path);
			this.log(`Removed ${file.path} from cache`);

			// Trigger task cache updated event
			this.app.workspace.trigger(
				"task-genius:task-cache-updated",
				this.indexer.getCache()
			);
		} catch (error) {
			console.error(`Error removing ${file.path} from cache:`, error);
		}
	}

	/**
	 * Query tasks based on filters and sorting criteria
	 */
	public queryTasks(
		filters: TaskFilter[] = [],
		sortBy: SortingCriteria[] = []
	): Task[] {
		if (!this.initialized) {
			console.warn("Task manager not initialized, initializing now");
			// Instead of calling initialize() directly which causes recursion,
			// schedule it for the next event loop and return empty results for now
			setTimeout(() => {
				if (!this.initialized) {
					this.initialize().catch((error) => {
						console.error(
							"Error during delayed initialization:",
							error
						);
					});
				}
			}, 0);
			return [];
		}

		return this.indexer.queryTasks(filters, sortBy);
	}

	/**
	 * Get all tasks in the vault
	 */
	public getAllTasks(): Task[] {
		return this.queryTasks();
	}

	/**
	 * get available context or projects from current all tasks
	 */
	public getAvailableContextOrProjects(): {
		contexts: string[];
		projects: string[];
	} {
		const allTasks = this.getAllTasks();

		const contextSet = new Set<string>();
		const projectSet = new Set<string>();

		for (const task of allTasks) {
			if (task.context) contextSet.add(task.context);
			if (task.project) projectSet.add(task.project);
		}

		return {
			contexts: Array.from(contextSet),
			projects: Array.from(projectSet),
		};
	}

	/**
	 * Get a task by ID
	 */
	public getTaskById(id: string): Task | undefined {
		return this.indexer.getTaskById(id);
	}

	/**
	 * Get all tasks in a file
	 */
	public getTasksForFile(filePath: string): Task[] {
		const cache = this.indexer.getCache();
		const taskIds = cache.files.get(filePath);

		if (!taskIds) return [];

		return Array.from(taskIds)
			.map((id) => cache.tasks.get(id))
			.filter((task): task is Task => task !== undefined);
	}

	/**
	 * Get tasks matching specific criteria
	 */
	public getTasksByFilter(filter: TaskFilter): Task[] {
		return this.queryTasks([filter]);
	}

	/**
	 * Get incomplete tasks
	 */
	public getIncompleteTasks(): Task[] {
		return this.queryTasks([
			{ type: "status", operator: "=", value: false },
		]);
	}

	/**
	 * Get completed tasks
	 */
	public getCompletedTasks(): Task[] {
		return this.queryTasks([
			{ type: "status", operator: "=", value: true },
		]);
	}

	/**
	 * Get tasks due today
	 */
	public getTasksDueToday(): Task[] {
		const today = new Date();
		const dateStr = `${today.getFullYear()}-${String(
			today.getMonth() + 1
		).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

		return this.queryTasks([
			{ type: "dueDate", operator: "=", value: dateStr },
		]);
	}

	/**
	 * Get overdue tasks
	 */
	public getOverdueTasks(): Task[] {
		const today = new Date();
		const dateStr = `${today.getFullYear()}-${String(
			today.getMonth() + 1
		).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

		return this.queryTasks([
			{ type: "dueDate", operator: "before", value: dateStr },
			{ type: "status", operator: "=", value: false },
		]);
	}

	/**
	 * Update an existing task
	 * This method updates both the task index and the task in the file
	 */
	public async updateTask(updatedTask: Task): Promise<void> {
		// Get the original task to compare changes
		const originalTask = this.indexer.getTaskById(updatedTask.id);
		if (!originalTask) {
			throw new Error(`Task with ID ${updatedTask.id} not found`);
		}

		// Check if this is a completion of a recurring task
		const isCompletingRecurringTask =
			!originalTask.completed &&
			updatedTask.completed &&
			updatedTask.recurrence;

		// Determine the metadata format from plugin settings
		const useDataviewFormat =
			this.plugin.settings.preferMetadataFormat === "dataview";

		try {
			const file = this.vault.getFileByPath(updatedTask.filePath);
			if (!(file instanceof TFile) || !file) {
				throw new Error(`File not found: ${updatedTask.filePath}`);
			}

			const content = await this.vault.read(file);
			const lines = content.split("\n");
			const taskLine = lines[updatedTask.line];
			console.log("taskLine", taskLine);
			if (!taskLine) {
				throw new Error(
					`Task line ${updatedTask.line} not found in file ${updatedTask.filePath}`
				);
			}

			const indentMatch = taskLine.match(/^(\s*)/);
			const indentation = indentMatch ? indentMatch[0] : "";
			let updatedLine = taskLine;

			// Update content
			if (originalTask.content !== updatedTask.content) {
				updatedLine = updatedLine.replace(
					/(\s*[-*+]\s*\[[^\]]*\]\s*).*$/,
					`$1${updatedTask.content}`
				);
			}

			// Update status if it exists in the updated task
			if (updatedTask.status) {
				updatedLine = updatedLine.replace(
					/(\s*[-*+]\s*\[)[^\]]*(\]\s*)/,
					`$1${updatedTask.status}$2`
				);
			}
			// Otherwise, update completion status if it changed
			else if (originalTask.completed !== updatedTask.completed) {
				const statusMark = updatedTask.completed ? "x" : " ";
				updatedLine = updatedLine.replace(
					/(\s*[-*+]\s*\[)[^\]]*(\]\s*)/,
					`$1${statusMark}$2`
				);
			}

			const formatDate = (
				date: number | undefined
			): string | undefined => {
				if (!date) return undefined;
				const d = new Date(date);
				return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
					2,
					"0"
				)}-${String(d.getDate()).padStart(2, "0")}`;
			};

			// --- Remove existing metadata (both formats) ---
			// Emoji dates
			updatedLine = updatedLine.replace(/📅\s*\d{4}-\d{2}-\d{2}/g, "");
			updatedLine = updatedLine.replace(/🛫\s*\d{4}-\d{2}-\d{2}/g, "");
			updatedLine = updatedLine.replace(/⏳\s*\d{4}-\d{2}-\d{2}/g, "");
			updatedLine = updatedLine.replace(/✅\s*\d{4}-\d{2}-\d{2}/g, "");
			updatedLine = updatedLine.replace(/➕\s*\d{4}-\d{2}-\d{2}/g, ""); // Added created date emoji
			// Dataview dates (inline field format) - match key or emoji
			updatedLine = updatedLine.replace(
				/\[(?:due|🗓️)::\s*\d{4}-\d{2}-\d{2}\]/gi,
				""
			);
			updatedLine = updatedLine.replace(
				/\[(?:completion|✅)::\s*\d{4}-\d{2}-\d{2}\]/gi,
				""
			);
			updatedLine = updatedLine.replace(
				/\[(?:created|➕)::\s*\d{4}-\d{2}-\d{2}\]/gi,
				""
			);
			updatedLine = updatedLine.replace(
				/\[(?:start|🛫)::\s*\d{4}-\d{2}-\d{2}\]/gi,
				""
			);
			updatedLine = updatedLine.replace(
				/\[(?:scheduled|⏳)::\s*\d{4}-\d{2}-\d{2}\]/gi,
				""
			);

			// Emoji Priority markers
			updatedLine = updatedLine.replace(
				/\s+(🔼|🔽|⏫|⏬|🔺|\[#[A-C]\])/g,
				""
			);
			// Dataview Priority
			updatedLine = updatedLine.replace(/\[priority::\s*\w+\]/gi, ""); // Assuming priority value is a word like high, medium, etc. or number

			updatedLine = updatedLine.replace(
				new RegExp("🔁" + "\\s*" + updatedTask.recurrence),
				""
			);
			// Emoji Recurrence
			updatedLine = updatedLine.replace(/🔁\s*[^\s]+/g, "");
			// Dataview Recurrence
			updatedLine = updatedLine.replace(
				/\[(?:repeat|recurrence)::\s*[^\]]+\]/gi,
				""
			); // Allow 'repeat' or 'recurrence'

			// Dataview Project and Context
			updatedLine = updatedLine.replace(/\[project::\s*[^\]]+\]/gi, "");
			updatedLine = updatedLine.replace(/\[context::\s*[^\]]+\]/gi, "");

			// --- Clean up the content part after removal ---
			const contentStartIndex = updatedLine.indexOf("] ") + 2;
			let taskTextContent = updatedLine
				.substring(contentStartIndex)
				.trim();

			// Remove all instances of existing tags and context from the content part

			// First completely remove project tags from content
			taskTextContent = taskTextContent
				.replace(/#project\/[^\s]+/g, "")
				.replace(/\s+/g, " ") // Normalize spaces
				.trim();

			// Then remove context tags from content
			taskTextContent = taskTextContent
				.replace(/@[^\s]+/g, "")
				.replace(/\s+/g, " ") // Normalize spaces
				.trim();

			// Then remove general tags, ensuring all instances are removed
			if (originalTask.tags && originalTask.tags.length > 0) {
				// Get a unique list of tags to avoid processing duplicates
				const uniqueTags = [...new Set(originalTask.tags)];

				// Filter out project tags as they are handled differently
				const generalTags = uniqueTags.filter(
					(tag) =>
						!tag.startsWith("#project/") && !tag.startsWith("@")
				);

				// Remove each general tag, ensuring we handle all instances
				for (const tag of generalTags) {
					// Extract the tag text without the # prefix
					const tagText = tag.replace(/^#/, "");

					// Create a regex that looks for the tag preceded by whitespace and followed by word boundary
					// This ensures we don't remove parts of words or other content
					const tagRegex = new RegExp(
						`\\s+#${tagText.replace(
							/[.*+?^${}()|[\]\\]/g,
							"\\$&"
						)}\\b`,
						"g"
					);
					taskTextContent = taskTextContent
						.replace(tagRegex, " ")
						.replace(/\s+/g, " ") // Normalize spaces
						.trim();
				}
			}

			// Reconstruct the beginning of the line
			updatedLine =
				updatedLine.substring(0, contentStartIndex) + taskTextContent;

			// --- Add updated metadata ---
			const metadata = [];
			const formattedDueDate = formatDate(updatedTask.dueDate);
			const formattedStartDate = formatDate(updatedTask.startDate);
			const formattedScheduledDate = formatDate(
				updatedTask.scheduledDate
			);
			const formattedCompletedDate = formatDate(
				updatedTask.completedDate
			);

			// --- Add non-project/context tags first (1. Tags) ---
			if (updatedTask.tags && updatedTask.tags.length > 0) {
				if (!useDataviewFormat) {
					// For emoji format: add tags that aren't project tags
					const generalTags = updatedTask.tags.filter(
						(tag) =>
							!tag.startsWith("#project/") && !tag.startsWith("@")
					);

					// Convert array to Set and back to ensure uniqueness
					const finalUniqueTags = [...new Set(generalTags)];

					if (finalUniqueTags.length > 0) {
						metadata.push(...finalUniqueTags);
					}
				} else {
					// For dataview format: add tags that aren't project/context tags
					const tagsToAdd = updatedTask.tags.filter((tag) => {
						// filter out project tags (already added as [project::...])
						if (tag.startsWith("#project/")) return false;
						// filter out context tags (already added as [context::...])
						if (
							tag.startsWith("@") &&
							updatedTask.context &&
							tag === `@${updatedTask.context}`
						)
							return false;
						return true;
					});

					const uniqueTagsToAdd = [...new Set(tagsToAdd)];

					if (uniqueTagsToAdd.length > 0) {
						metadata.push(...uniqueTagsToAdd);
					}
				}
			}

			// 2. Project
			if (updatedTask.project) {
				if (useDataviewFormat) {
					metadata.push(`[project:: ${updatedTask.project}]`);
				} else {
					const projectTag = `#project/${updatedTask.project}`;
					// Only add to tags array if not already present
					if (!updatedTask.tags) updatedTask.tags = [];
					if (!updatedTask.tags.includes(projectTag)) {
						updatedTask.tags.push(projectTag);
					}
					// Only add to metadata if not already added before
					if (!metadata.includes(projectTag)) {
						metadata.push(projectTag);
					}
				}
			}

			// 3. Context
			if (updatedTask.context) {
				if (useDataviewFormat) {
					metadata.push(`[context:: ${updatedTask.context}]`);
				} else {
					const contextTag = `@${updatedTask.context}`;
					// Only add to metadata if not already present
					if (!metadata.includes(contextTag)) {
						metadata.push(contextTag);
					}
				}
			}

			// 4. Priority
			if (updatedTask.priority) {
				if (useDataviewFormat) {
					let priorityValue: string | number;
					switch (updatedTask.priority) {
						case 5:
							priorityValue = "highest";
							break;
						case 4:
							priorityValue = "high";
							break;
						case 3:
							priorityValue = "medium";
							break;
						case 2:
							priorityValue = "low";
							break;
						case 1:
							priorityValue = "lowest";
							break;
						default:
							priorityValue = updatedTask.priority;
					}
					metadata.push(`[priority:: ${priorityValue}]`);
				} else {
					// Emoji format
					let priorityMarker = "";
					switch (updatedTask.priority) {
						case 5:
							priorityMarker = "🔺";
							break;
						case 4:
							priorityMarker = "⏫";
							break;
						case 3:
							priorityMarker = "🔼";
							break;
						case 2:
							priorityMarker = "🔽";
							break;
						case 1:
							priorityMarker = "⏬";
							break;
					}
					if (priorityMarker) metadata.push(priorityMarker);
				}
			}

			// 5. Recurrence
			if (updatedTask.recurrence) {
				metadata.push(
					useDataviewFormat
						? `[repeat:: ${updatedTask.recurrence}]`
						: `🔁 ${updatedTask.recurrence}`
				);
			}

			// 6. Start Date
			if (formattedStartDate) {
				// Check if this date should be skipped based on useAsDateType
				if (
					!(
						updatedTask.useAsDateType === "start" &&
						formatDate(originalTask.startDate) ===
							formattedStartDate
					)
				) {
					metadata.push(
						useDataviewFormat
							? `[start:: ${formattedStartDate}]`
							: `🛫 ${formattedStartDate}`
					);
				}
			}

			// 7. Scheduled Date
			if (formattedScheduledDate) {
				// Check if this date should be skipped based on useAsDateType
				if (
					!(
						updatedTask.useAsDateType === "scheduled" &&
						formatDate(originalTask.scheduledDate) ===
							formattedScheduledDate
					)
				) {
					metadata.push(
						useDataviewFormat
							? `[scheduled:: ${formattedScheduledDate}]`
							: `⏳ ${formattedScheduledDate}`
					);
				}
			}

			// 8. Due Date
			if (formattedDueDate) {
				// Check if this date should be skipped based on useAsDateType
				if (
					!(
						updatedTask.useAsDateType === "due" &&
						formatDate(originalTask.dueDate) === formattedDueDate
					)
				) {
					metadata.push(
						useDataviewFormat
							? `[due:: ${formattedDueDate}]`
							: `📅 ${formattedDueDate}`
					);
				}
			}

			// 9. Completion Date (only if completed)
			if (formattedCompletedDate && updatedTask.completed) {
				metadata.push(
					useDataviewFormat
						? `[completion:: ${formattedCompletedDate}]`
						: `✅ ${formattedCompletedDate}`
				);
			}

			// Append all metadata to the line
			if (metadata.length > 0) {
				updatedLine = updatedLine.trim(); // Trim first to remove trailing space before adding metadata
				updatedLine = `${updatedLine} ${metadata.join(" ")}`;
			}

			// Ensure indentation is preserved
			if (indentation && !updatedLine.startsWith(indentation)) {
				updatedLine = `${indentation}${updatedLine.trimStart()}`;
			}

			if (updatedTask.completed && !originalTask.completed) {
				updatedTask &&
					this.app.workspace.trigger(
						"task-genius:task-completed",
						updatedTask
					);
			}

			// Update the line in the file content
			if (updatedLine !== taskLine) {
				lines[updatedTask.line] = updatedLine;

				// If this is a completed recurring task, create a new task with updated dates
				if (isCompletingRecurringTask) {
					try {
						const newTaskLine = this.createRecurringTask(
							updatedTask,
							indentation
						);

						// Insert the new task line after the current task
						lines.splice(updatedTask.line + 1, 0, newTaskLine);
						this.log(
							`Created new recurring task after line ${updatedTask.line}`
						);
					} catch (error) {
						console.error("Error creating recurring task:", error);
					}
				}

				await this.vault.modify(file, lines.join("\n"));
				await this.indexFile(file); // Re-index the modified file
				this.log(
					`Updated task ${updatedTask.id} and re-indexed file ${updatedTask.filePath}`
				);
			} else {
				this.log(
					`Task ${updatedTask.id} content did not change. No file modification needed.`
				);
			}
		} catch (error) {
			console.error("Error updating task:", error);
			throw error;
		}
	}

	/**
	 * Creates a new task line based on a completed recurring task
	 */
	private createRecurringTask(
		completedTask: Task,
		indentation: string
	): string {
		// Calculate the next due date based on the recurrence pattern
		const nextDate = this.calculateNextDueDate(completedTask);

		// Create a new task with the same content but updated dates
		const newTask = { ...completedTask };

		// Reset completion status and date
		newTask.completed = false;
		newTask.completedDate = undefined;

		// Determine where to apply the next date based on what the original task had
		if (completedTask.dueDate) {
			// If original task had due date, update due date
			newTask.dueDate = nextDate;
		} else if (completedTask.scheduledDate) {
			// If original task only had scheduled date, update scheduled date
			newTask.scheduledDate = nextDate;
			newTask.dueDate = undefined; // Make sure due date is not set
		}

		// Format dates for task markdown
		const formattedDueDate = newTask.dueDate
			? this.formatDateForDisplay(newTask.dueDate)
			: undefined;

		// For scheduled date, use the new calculated date if that's what was updated
		const formattedScheduledDate = newTask.scheduledDate
			? this.formatDateForDisplay(newTask.scheduledDate)
			: undefined;

		// For other dates, copy the original ones if they exist
		const formattedStartDate = completedTask.startDate
			? this.formatDateForDisplay(completedTask.startDate)
			: undefined;

		// Extract the original list marker (-, *, 1., etc.) from the original markdown
		let listMarker = "- ";
		if (completedTask.originalMarkdown) {
			// Match the list marker pattern: could be "- ", "* ", "1. ", etc.
			const listMarkerMatch = completedTask.originalMarkdown.match(
				/^(\s*)([*\-+]|\d+\.)\s+\[/
			);
			if (listMarkerMatch && listMarkerMatch[2]) {
				listMarker = listMarkerMatch[2] + " ";

				// If it's a numbered list, increment the number
				if (/^\d+\.$/.test(listMarkerMatch[2])) {
					const numberStr = listMarkerMatch[2].replace(/\.$/, "");
					const number = parseInt(numberStr);
					listMarker = number + 1 + ". ";
				}
			}
		}

		// Create the task markdown with the correct list marker
		const useDataviewFormat =
			this.plugin.settings.preferMetadataFormat === "dataview";
		// Start with the basic task using the extracted list marker
		let newTaskLine = `${indentation}${listMarker}[ ] ${completedTask.content}`;

		// Add metadata based on format preference
		const metadata = [];

		// Create sets to track existing project and context tags
		const existingProjectTags = new Set<string>();
		const existingContextTags = new Set<string>();

		if (completedTask.tags && completedTask.tags.length > 0) {
			completedTask.tags.forEach((tag) => {
				if (tag.startsWith("#project/")) {
					existingProjectTags.add(tag.substring("#project/".length));
				} else if (tag.startsWith("@")) {
					existingContextTags.add(tag.substring(1));
				}
			});
		}

		// 1. Tags (excluding project/context tags that are handled separately)
		if (completedTask.tags && completedTask.tags.length > 0) {
			const tagsToAdd = completedTask.tags.filter((tag) => {
				// Skip project tags (handled separately)
				if (tag.startsWith("#project/")) return false;
				// Skip context tags (handled separately)
				if (
					tag.startsWith("@") &&
					completedTask.context &&
					tag === `@${completedTask.context}`
				)
					return false;
				return true;
			});

			if (tagsToAdd.length > 0) {
				metadata.push(...tagsToAdd);
			}
		}

		// 2. Project
		if (completedTask.project) {
			if (useDataviewFormat) {
				metadata.push(`[project:: ${completedTask.project}]`);
			} else {
				// Only add project tag if it's not already in the existing project tags
				if (!existingProjectTags.has(completedTask.project)) {
					metadata.push(`#project/${completedTask.project}`);
				} else {
					// Project already in tags, ensure it's added to the tag list
					const projectTag = `#project/${completedTask.project}`;
					if (!metadata.includes(projectTag)) {
						metadata.push(projectTag);
					}
				}
			}
		}

		// 3. Context
		if (completedTask.context) {
			if (useDataviewFormat) {
				metadata.push(`[context:: ${completedTask.context}]`);
			} else {
				// 仅当上下文不在已有上下文标签集合中时才添加
				if (!existingContextTags.has(completedTask.context)) {
					metadata.push(`@${completedTask.context}`);
				} else {
					// 上下文已在标签中，确保它被添加到标签列表
					const contextTag = `@${completedTask.context}`;
					if (!metadata.includes(contextTag)) {
						metadata.push(contextTag);
					}
				}
			}
		}

		// 4. Priority
		if (completedTask.priority) {
			if (useDataviewFormat) {
				let priorityValue: string | number;
				switch (completedTask.priority) {
					case 5:
						priorityValue = "highest";
						break;
					case 4:
						priorityValue = "high";
						break;
					case 3:
						priorityValue = "medium";
						break;
					case 2:
						priorityValue = "low";
						break;
					case 1:
						priorityValue = "lowest";
						break;
					default:
						priorityValue = completedTask.priority;
				}
				metadata.push(`[priority:: ${priorityValue}]`);
			} else {
				let priorityMarker = "";
				switch (completedTask.priority) {
					case 5:
						priorityMarker = "🔺";
						break;
					case 4:
						priorityMarker = "⏫";
						break;
					case 3:
						priorityMarker = "🔼";
						break;
					case 2:
						priorityMarker = "🔽";
						break;
					case 1:
						priorityMarker = "⏬";
						break;
				}
				if (priorityMarker) metadata.push(priorityMarker);
			}
		}

		// 5. Recurrence
		if (completedTask.recurrence) {
			metadata.push(
				useDataviewFormat
					? `[repeat:: ${completedTask.recurrence}]`
					: `🔁 ${completedTask.recurrence}`
			);
		}

		// 6. Start Date
		if (formattedStartDate) {
			metadata.push(
				useDataviewFormat
					? `[start:: ${formattedStartDate}]`
					: `🛫 ${formattedStartDate}`
			);
		}

		// 7. Scheduled Date
		if (formattedScheduledDate) {
			metadata.push(
				useDataviewFormat
					? `[scheduled:: ${formattedScheduledDate}]`
					: `⏳ ${formattedScheduledDate}`
			);
		}

		// 8. Due Date
		if (formattedDueDate) {
			metadata.push(
				useDataviewFormat
					? `[due:: ${formattedDueDate}]`
					: `📅 ${formattedDueDate}`
			);
		}

		// Append all metadata to the line
		if (metadata.length > 0) {
			newTaskLine = `${newTaskLine} ${metadata.join(" ")}`;
		}

		return newTaskLine;
	}

	/**
	 * Calculates the next due date based on recurrence pattern
	 */
	private calculateNextDueDate(task: Task): number | undefined {
		if (!task.recurrence) return undefined;

		console.log(task);

		// Start with due date if available, then scheduled date, then today
		const baseDate = task.dueDate
			? new Date(task.dueDate)
			: task.scheduledDate
			? new Date(task.scheduledDate)
			: new Date();
		// Ensure baseDate is at the beginning of the day for date-based recurrence
		baseDate.setHours(0, 0, 0, 0);

		try {
			// Attempt to parse using rrule first
			try {
				// Use the task's recurrence string directly if it's a valid RRULE string
				// Provide dtstart to rrulestr for context, especially for rules that might depend on the start date.
				const rule = rrulestr(task.recurrence, { dtstart: baseDate });

				// We want the first occurrence strictly *after* the baseDate.
				// Adding a small time offset ensures we get the next instance even if baseDate itself is an occurrence.
				const afterDate = new Date(baseDate.getTime() + 1000); // 1 second after baseDate
				const nextOccurrence = rule.after(afterDate); // Find the first occurrence after this adjusted date

				if (nextOccurrence) {
					// Set time to start of day, assuming date-only recurrence for now
					nextOccurrence.setHours(0, 0, 0, 0);
					this.log(
						`Calculated next date using rrule for '${
							task.recurrence
						}': ${nextOccurrence.toISOString()}`
					);
					return nextOccurrence.getTime();
				} else {
					// No next occurrence found by rrule (e.g., rule has COUNT and finished)
					this.log(
						`[TaskManager] rrule couldn't find next occurrence for rule: ${task.recurrence}. Falling back.`
					);
					// Fall through to simple logic below
				}
			} catch (e) {
				// rrulestr failed, likely not a standard RRULE format. Fall back to simple parsing.
				if (e instanceof Error) {
					this.log(
						`[TaskManager] Failed to parse recurrence '${task.recurrence}' with rrule. Falling back to simple logic. Error: ${e.message}`
					);
				} else {
					this.log(
						`[TaskManager] Failed to parse recurrence '${task.recurrence}' with rrule. Falling back to simple logic. Unknown error.`
					);
				}
			}

			// --- Fallback Simple Parsing Logic ---
			this.log(
				`[TaskManager] Using fallback logic for recurrence: ${task.recurrence}`
			);
			const recurrence = task.recurrence.trim().toLowerCase();
			let nextDate = new Date(baseDate); // Start calculation from the base date

			// Parse "every X days/weeks/months/years" format
			if (recurrence.startsWith("every")) {
				const parts = recurrence.split(" ");
				if (parts.length >= 2) {
					let interval = 1;
					let unit = parts[1];
					if (parts.length >= 3 && !isNaN(parseInt(parts[1]))) {
						interval = parseInt(parts[1]);
						unit = parts[2];
					}
					if (unit.endsWith("s")) {
						unit = unit.substring(0, unit.length - 1);
					}
					switch (unit) {
						case "day":
							const dayBasedNextDate = new Date(
								baseDate.getTime()
							);
							dayBasedNextDate.setDate(
								dayBasedNextDate.getDate() + interval
							);
							nextDate = dayBasedNextDate;
							break;
						case "week":
							nextDate.setDate(baseDate.getDate() + interval * 7);
							break;
						case "month":
							const monthBasedNextDate = new Date(
								baseDate.getTime()
							);
							monthBasedNextDate.setMonth(
								monthBasedNextDate.getMonth() + interval
							);

							// Check if the date has changed
							nextDate = monthBasedNextDate;
							break;
						case "year":
							nextDate.setFullYear(
								baseDate.getFullYear() + interval
							);
							break;
						default:
							this.log(
								`[TaskManager] Unknown unit in recurrence '${recurrence}'. Defaulting to days.`
							);
							// 同样使用克隆日期对象进行计算
							const defaultNextDate = new Date(
								baseDate.getTime()
							);
							defaultNextDate.setDate(
								defaultNextDate.getDate() + interval
							);
							nextDate = defaultNextDate;
					}
				} else {
					// Malformed "every" rule, fallback to +1 day from baseDate
					this.log(
						`[TaskManager] Malformed 'every' rule '${recurrence}'. Defaulting to next day.`
					);
					const fallbackNextDate = new Date(baseDate.getTime());
					fallbackNextDate.setDate(fallbackNextDate.getDate() + 1);
					nextDate = fallbackNextDate;
				}
			}
			// Handle specific weekday recurrences like "every Monday"
			else if (
				recurrence.includes("monday") ||
				recurrence.includes("tuesday") ||
				recurrence.includes("wednesday") ||
				recurrence.includes("thursday") ||
				recurrence.includes("friday") ||
				recurrence.includes("saturday") ||
				recurrence.includes("sunday")
			) {
				const weekdays: { [key: string]: number } = {
					sunday: 0,
					monday: 1,
					tuesday: 2,
					wednesday: 3,
					thursday: 4,
					friday: 5,
					saturday: 6,
				};
				let targetDay = -1;
				for (const [day, value] of Object.entries(weekdays)) {
					if (recurrence.includes(day)) {
						targetDay = value;
						break;
					}
				}
				if (targetDay >= 0) {
					// Start calculation from the day *after* the baseDate
					nextDate.setDate(baseDate.getDate() + 1);
					while (nextDate.getDay() !== targetDay) {
						nextDate.setDate(nextDate.getDate() + 1);
					}
				} else {
					// Malformed weekday rule, fallback to +1 day from baseDate
					this.log(
						`[TaskManager] Malformed weekday rule '${recurrence}'. Defaulting to next day.`
					);
					nextDate.setDate(baseDate.getDate() + 1);
				}
			} else {
				// Unknown format, fallback to +1 day from baseDate
				this.log(
					`[TaskManager] Unknown recurrence format '${recurrence}'. Defaulting to next day.`
				);
				nextDate.setDate(baseDate.getDate() + 1);
			}

			// Ensure the calculated date is at the start of the day
			nextDate.setHours(0, 0, 0, 0);
			this.log(
				`Calculated next date using simple logic for '${
					task.recurrence
				}': ${nextDate.toISOString()}`
			);
			return nextDate.getTime();
		} catch (error) {
			console.error("Error calculating next date:", error);
			// Default fallback: add one day to baseDate
			const fallbackDate = new Date(baseDate);
			fallbackDate.setDate(fallbackDate.getDate() + 1);
			fallbackDate.setHours(0, 0, 0, 0);
			if (task.recurrence) {
				this.log(
					`Error calculating next date for '${
						task.recurrence
					}'. Defaulting to ${fallbackDate.toISOString()}`
				);
			} else {
				this.log(
					`Error calculating next date for task without recurrence. Defaulting to ${fallbackDate.toISOString()}`
				);
			}
			return fallbackDate.getTime();
		}
	}

	/**
	 * Format a date for display in task metadata
	 */
	private formatDateForDisplay(timestamp: number): string {
		const date = new Date(timestamp);
		return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
			2,
			"0"
		)}-${String(date.getDate()).padStart(2, "0")}`;
	}

	/**
	 * Force reindex all tasks by clearing all current indices and rebuilding from scratch
	 */
	public async forceReindex(): Promise<void> {
		this.log("Force reindexing all tasks");

		// Reset initialization state
		this.initialized = false;

		// Clear all caches
		this.indexer.resetCache();

		// Clear the persister cache
		try {
			await this.persister.clear();

			// Explicitly remove the consolidated cache
			try {
				await this.persister.persister.removeItem(
					"consolidated:taskCache"
				);
				this.log("Cleared consolidated task cache");
			} catch (error) {
				console.error("Error clearing consolidated cache:", error);
			}

			this.log("Cleared all cached task data");
		} catch (error) {
			console.error("Error clearing cache:", error);
		}

		// Re-initialize everything
		await this.initialize();

		// Trigger an update event
		this.app.workspace.trigger(
			"task-genius:task-cache-updated",
			this.indexer.getCache()
		);

		this.log("Force reindex complete");
	}

	/**
	 * Log a message if debugging is enabled
	 */
	private log(message: string): void {
		if (this.options.debug) {
			console.log(`[TaskManager] ${message}`);
		}
	}

	/**
	 * Clean up resources when the component is unloaded
	 */
	public onunload(): void {
		// Clean up worker manager if it exists
		if (this.workerManager) {
			this.workerManager.onunload();
		}

		super.onunload();
	}
}
